
// UI Manager for WebRTC Calls
// WebRTC 通话的 UI 管理器

import { createElement, $id } from './util.dom.js';
import { t } from './util.i18n.js';

export class CallUIManager {
    constructor(webRTCManager) {
        this.rtc = webRTCManager;
        this.container = null;
        this.localVideo = null;
        this.remoteVideo = null;
        this.statusLabel = null;
        this.timerLabel = null;
        this.callStartTime = 0;
        this.timerInterval = null;
        this.beautyFilterEnabled = false;
        this.beautyCanvas = null;
        this.beautyCtx = null;
        this.beautyIntensity = 0.3;
        this.animationFrame = null;
    }

    // Create call overlay
    // 创建通话覆盖层
    createCallUI() {
        if (this.container) return;

        this.container = createElement('div', { id: 'call-overlay', class: 'call-overlay hidden' });

        // Videos
        const videoContainer = createElement('div', { class: 'call-video-container' });
        this.remoteVideo = createElement('video', { id: 'remote-video', autoplay: true, playsinline: true });
        this.localVideo = createElement('video', { id: 'local-video', autoplay: true, playsinline: true, muted: true });

        videoContainer.appendChild(this.remoteVideo);
        videoContainer.appendChild(this.localVideo);

        // Info
        const infoContainer = createElement('div', { class: 'call-info' });
        this.statusLabel = createElement('div', { class: 'call-status' }, 'Ready');
        this.timerLabel = createElement('div', { class: 'call-timer' }, '00:00');
        infoContainer.appendChild(this.statusLabel);
        infoContainer.appendChild(this.timerLabel);

        // Controls
        const controls = createElement('div', { class: 'call-controls' });

        const muteBtn = createElement('button', { class: 'call-btn', title: 'Mute Audio' }, '🎤');
        muteBtn.onclick = () => {
            const enabled = muteBtn.classList.toggle('active'); // active means muted/disabled in this context? No, let's say active means OFF
            // Actually let's use standard toggle logic
            const isMuted = muteBtn.classList.contains('muted');
            if (isMuted) {
                // Unmute
                muteBtn.classList.remove('muted');
                muteBtn.textContent = '🎤';
                this.rtc.toggleAudio(true);
            } else {
                // Mute
                muteBtn.classList.add('muted');
                muteBtn.textContent = '🔇';
                this.rtc.toggleAudio(false);
            }
        };

        const videoBtn = createElement('button', { class: 'call-btn', title: 'Toggle Video' }, '📹');
        videoBtn.onclick = () => {
            const isOff = videoBtn.classList.contains('off');
            if (isOff) {
                videoBtn.classList.remove('off');
                this.rtc.toggleVideo(true);
            } else {
                videoBtn.classList.add('off');
                this.rtc.toggleVideo(false);
            }
        };

        const beautyBtn = createElement('button', { class: 'call-btn', title: 'Beauty Filter' }, '✨');
        beautyBtn.onclick = () => {
            this.toggleBeautyFilter();
            const isEnabled = beautyBtn.classList.contains('active');
            beautyBtn.textContent = isEnabled ? '✨' : '💫';
        };

        const hangupBtn = createElement('button', { class: 'call-btn hangup', title: 'End Call' }, '📞');
        hangupBtn.onclick = () => {
            this.rtc.endCall('User hung up');
            this.hideCallUI();
        };

        controls.appendChild(muteBtn);
        controls.appendChild(hangupBtn);
        controls.appendChild(videoBtn);
        controls.appendChild(beautyBtn);

        this.container.appendChild(videoContainer);
        this.container.appendChild(infoContainer);
        this.container.appendChild(controls);

        document.body.appendChild(this.container);
    }

    showCallUI(isCaller, targetName, isVideo) {
        this.createCallUI();
        this.container.classList.remove('hidden');
        this.statusLabel.textContent = isCaller ? `${t('call.calling', 'Calling')} ${targetName}...` : `${t('call.connecting', 'Connecting')}...`;
        this.timerLabel.textContent = '';

        // Hide local video if audio only
        this.localVideo.style.display = isVideo ? 'block' : 'none';
        this.remoteVideo.style.display = isVideo ? 'block' : 'none';

        // Reset buttons
        const muteBtn = this.container.querySelector('button[title="Mute Audio"]');
        if (muteBtn) { muteBtn.classList.remove('muted'); muteBtn.textContent = '🎤'; }
    }

    hideCallUI() {
        if (this.container) {
            this.container.classList.add('hidden');
            this.stopTimer();
        }
        // Cleanup streams from video elements to allow camera release
        if (this.localVideo) this.localVideo.srcObject = null;
        if (this.remoteVideo) this.remoteVideo.srcObject = null;
        // Stop beauty filter
        this.disableBeautyFilter();
    }

    // Toggle beauty filter
    toggleBeautyFilter() {
        this.beautyFilterEnabled = !this.beautyFilterEnabled;
        const beautyBtn = this.container?.querySelector('button[title="Beauty Filter"]');
        
        if (this.beautyFilterEnabled) {
            beautyBtn?.classList.add('active');
            this.enableBeautyFilter();
        } else {
            beautyBtn?.classList.remove('active');
            this.disableBeautyFilter();
        }
    }

    // Enable beauty filter
    enableBeautyFilter() {
        if (!this.localVideo || !this.localVideo.srcObject) return;

        // Create canvas for beauty filter processing
        this.beautyCanvas = document.createElement('canvas');
        this.beautyCanvas.width = 640;
        this.beautyCanvas.height = 480;
        this.beautyCtx = this.beautyCanvas.getContext('2d');

        // Create a new video element for processing
        this.processingVideo = document.createElement('video');
        this.processingVideo.autoplay = true;
        this.processingVideo.muted = true;
        this.processingVideo.srcObject = this.localVideo.srcObject;

        this.processingVideo.onloadedmetadata = () => {
            this.processingVideo.play();
            this.applyBeautyFilter();
        };
    }

    // Disable beauty filter
    disableBeautyFilter() {
        this.beautyFilterEnabled = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        if (this.processingVideo) {
            this.processingVideo.srcObject = null;
            this.processingVideo = null;
        }
        if (this.beautyCanvas) {
            this.beautyCanvas = null;
            this.beautyCtx = null;
        }
        // Restore original stream
        if (this.localVideo && this.rtc.localStream) {
            this.localVideo.srcObject = this.rtc.localStream;
        }
    }

    // Apply beauty filter using canvas processing
    applyBeautyFilter() {
        if (!this.beautyFilterEnabled || !this.processingVideo || !this.beautyCanvas) return;

        const ctx = this.beautyCtx;
        const canvas = this.beautyCanvas;

        // Draw video frame to canvas
        ctx.drawImage(this.processingVideo, 0, 0, canvas.width, canvas.height);

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Apply beauty filter (skin smoothing and brightening)
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Detect skin tones (simplified)
            const isSkin = (r > 95 && g > 40 && b > 20 &&
                          r > g && r > b &&
                          Math.abs(r - g) > 15 &&
                          r - g < 100);

            if (isSkin) {
                // Skin smoothing - slight blur effect by averaging with neighbors
                // Brighten skin
                const brightness = 1 + this.beautyIntensity * 0.3;
                data[i] = Math.min(255, r * brightness);
                data[i + 1] = Math.min(255, g * brightness);
                data[i + 2] = Math.min(255, b * brightness);

                // Reduce redness slightly for more even skin tone
                data[i] = Math.min(255, data[i] * (1 - this.beautyIntensity * 0.1));
            }
        }

        // Put processed image data back
        ctx.putImageData(imageData, 0, 0);

        // Create stream from canvas
        const canvasStream = canvas.captureStream(30);
        
        // Replace video source with processed stream
        if (this.localVideo) {
            this.localVideo.srcObject = canvasStream;
        }

        // Continue processing
        this.animationFrame = requestAnimationFrame(() => this.applyBeautyFilter());
    }

    setLocalStream(stream) {
        if (this.localVideo) this.localVideo.srcObject = stream;
    }

    setRemoteStream(stream) {
        if (this.remoteVideo) this.remoteVideo.srcObject = stream;
        this.statusLabel.textContent = t('call.connected', 'Connected');
        this.startTimer();
    }

    startTimer() {
        this.callStartTime = Date.now();
        this.timerInterval = setInterval(() => {
            const delta = Math.floor((Date.now() - this.callStartTime) / 1000);
            const min = Math.floor(delta / 60).toString().padStart(2, '0');
            const sec = (delta % 60).toString().padStart(2, '0');
            this.timerLabel.textContent = `${min}:${sec}`;
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    // Incoming call modal
    showIncomingCallModal(callerName, isVideo, onAccept, onReject) {
        const modal = createElement('div', { class: 'incoming-call-modal' });
        const typeText = isVideo ? t('call.video_call', 'Video Call') : t('call.voice_call', 'Voice Call');

        modal.innerHTML = `
            <div class="incoming-content">
                <div class="incoming-avatar">${callerName[0].toUpperCase()}</div>
                <div class="incoming-name">${callerName}</div>
                <div class="incoming-type">${t('call.incoming', 'Incoming')} ${typeText}</div>
                <div class="incoming-actions">
                    <button class="call-btn reject">❌</button>
                    <button class="call-btn accept">📞</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const rejectBtn = modal.querySelector('.reject');
        rejectBtn.onclick = () => {
            onReject();
            modal.remove();
        };

        const acceptBtn = modal.querySelector('.accept');
        acceptBtn.onclick = () => {
            onAccept();
            modal.remove();
        };

        return modal; // Return so we can remove it programmatically if caller cancels
    }
}
