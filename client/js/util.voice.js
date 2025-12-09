
import { $id, addClass, removeClass } from './util.dom.js';
import { t } from './util.i18n.js';

let isRecording = false;
let mediaRecorder = null;
let audioChunks = [];
let recordingStream = null;

export function setupVoiceRecording(onSend, onCancel) {
    const voiceBtn = $id('chat-voice-btn');
    if (!voiceBtn) return;

    voiceBtn.onclick = async () => {
        if (isRecording) {
            // Stop recording and send
            stopRecording(onSend);
        } else {
            // Start recording
            startRecording();
        }
    };
}

async function startRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        window.addSystemMsg && window.addSystemMsg(t('system.voice_not_supported', 'Voice recording not supported in this browser.'));
        return;
    }

    try {
        recordingStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(recordingStream);
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
                voiceBtn.title = t('action.stop_recording', 'Click to stop and send');
            }
            // Optional: Show "Recording..." indicator elsewhere
        };

        mediaRecorder.start();

    } catch (err) {
        console.error('Error accessing microphone:', err);
        window.addSystemMsg && window.addSystemMsg(t('system.mic_error', 'Could not access microphone.') + ' ' + err.message);
    }
}

function stopRecording(callback) {
    if (mediaRecorder && isRecording) {
        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            // Convert blob to base64 or send as is? 
            // Existing chat logic prefers base64 or raw data object logic.
            // For simplicity with existing file handlers, we can convert to Data URL
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = () => {
                const base64data = reader.result;
                // Create a "voice" message payload
                const voiceMessage = {
                    audio: base64data,
                    duration: 0 // Duration calculation would require more complex audio context logic, skipping for MVP
                };
                if (callback) callback(voiceMessage);
            };

            // Cleanup
            if (recordingStream) {
                recordingStream.getTracks().forEach(track => track.stop());
                recordingStream = null;
            }
            isRecording = false;
            const voiceBtn = $id('chat-voice-btn');
            if (voiceBtn) {
                removeClass(voiceBtn, 'recording');
                voiceBtn.title = t('action.start_recording', 'Send Voice Message');
            }
        };
        mediaRecorder.stop();
    }
}
