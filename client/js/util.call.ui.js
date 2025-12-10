
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

        const hangupBtn = createElement('button', { class: 'call-btn hangup', title: 'End Call' }, '📞');
        hangupBtn.onclick = () => {
            this.rtc.endCall('User hung up');
            this.hideCallUI();
        };

        controls.appendChild(muteBtn);
        controls.appendChild(hangupBtn);
        controls.appendChild(videoBtn);

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
