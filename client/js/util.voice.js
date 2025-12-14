
import { $id, addClass, removeClass } from './util.dom.js';
import { t } from './util.i18n.js';

let isRecording = false;
let mediaRecorder = null;
let audioChunks = [];
let recordingStream = null;

export function setupVoiceRecording(onSend, onCancel) {
    const voiceBtn = $id('chat-voice-btn');
    if (!voiceBtn) return;

    // Prevent duplicate events on mobile
    let lastActionTime = 0;

    async function handleVoiceClick(e) {
        // Prevent duplicate events (touchend + click)
        const now = Date.now();
        if (now - lastActionTime < 500) {
            return;
        }
        lastActionTime = now;

        e.preventDefault();
        e.stopPropagation();

        if (isRecording) {
            // Stop recording and send
            stopRecording(onSend);
        } else {
            // Start recording
            await startRecording();
        }
    }

    // Use both click and touchend for mobile compatibility
    voiceBtn.onclick = handleVoiceClick;
    voiceBtn.addEventListener('touchend', handleVoiceClick, { passive: false });
}

async function startRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const msg = t('system.voice_not_supported', '您的浏览器不支持语音录制功能');
        window.addSystemMsg && window.addSystemMsg(msg);
        alert(msg);
        return;
    }

    try {
        recordingStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });

        // Try different MIME types for better browser compatibility
        let mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
            if (MediaRecorder.isTypeSupported('audio/mp4')) {
                mimeType = 'audio/mp4';
            } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
                mimeType = 'audio/ogg';
            } else {
                mimeType = ''; // Let browser choose default
            }
        }

        const options = mimeType ? { mimeType: mimeType } : {};
        mediaRecorder = new MediaRecorder(recordingStream, options);
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.onstart = () => {
            isRecording = true;
            const voiceBtn = $id('chat-voice-btn');
            if (voiceBtn) {
                addClass(voiceBtn, 'recording');
                voiceBtn.title = t('action.stop_recording', '点击停止并发送');
            }
        };

        mediaRecorder.onerror = (event) => {
            console.error('MediaRecorder error:', event.error);
            const msg = t('system.recording_error', '录音失败: ') + event.error;
            window.addSystemMsg && window.addSystemMsg(msg);
            cleanup();
        };

        mediaRecorder.start();

    } catch (err) {
        console.error('Error accessing microphone:', err);
        let errorMsg = t('system.mic_error', '无法访问麦克风');

        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            errorMsg = t('system.mic_permission_denied', '您拒绝了麦克风权限。请在浏览器设置中允许访问麦克风。');
        } else if (err.name === 'NotFoundError') {
            errorMsg = t('system.mic_not_found', '未找到麦克风设备。');
        } else if (err.name === 'NotReadableError') {
            errorMsg = t('system.mic_in_use', '麦克风已被其他应用占用。');
        }

        window.addSystemMsg && window.addSystemMsg(errorMsg);
        alert(errorMsg);
        cleanup();
    }
}

function stopRecording(callback) {
    if (mediaRecorder && isRecording) {
        mediaRecorder.onstop = () => {
            try {
                const audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType || 'audio/webm' });

                // Check if blob is valid
                if (audioBlob.size === 0) {
                    window.addSystemMsg && window.addSystemMsg(t('system.recording_empty', '录音失败：没有录制到声音'));
                    cleanup();
                    return;
                }

                // Convert blob to base64
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    const base64data = reader.result;
                    // Create a "voice" message payload
                    const voiceMessage = {
                        audio: base64data,
                        duration: 0 // Duration calculation would require more complex audio context logic
                    };
                    if (callback) callback(voiceMessage);
                    cleanup();
                };
                reader.onerror = () => {
                    window.addSystemMsg && window.addSystemMsg(t('system.recording_process_error', '处理录音失败'));
                    cleanup();
                };
            } catch (err) {
                console.error('Error processing recording:', err);
                window.addSystemMsg && window.addSystemMsg(t('system.recording_process_error', '处理录音失败'));
                cleanup();
            }
        };
        mediaRecorder.stop();
    }
}

function cleanup() {
    // Cleanup
    if (recordingStream) {
        recordingStream.getTracks().forEach(track => track.stop());
        recordingStream = null;
    }
    isRecording = false;
    const voiceBtn = $id('chat-voice-btn');
    if (voiceBtn) {
        removeClass(voiceBtn, 'recording');
        voiceBtn.title = t('action.start_recording', '发送语音消息');
    }
    audioChunks = [];
    mediaRecorder = null;
}
