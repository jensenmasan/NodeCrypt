
// WebRTC Manager for Video/Voice Calls
// 视频/语音通话的 WebRTC 管理器

export class WebRTCManager {
    constructor(callbacks) {
        this.callbacks = callbacks || {};
        // callbacks:
        // onLocalStream(stream)
        // onRemoteStream(stream)
        // onCallEnded(reason)
        // onSignal(targetId, data)
        // onIncomingCall(callerId, callerName, isVideo)

        this.peerConnection = null;
        this.localStream = null;
        this.remoteStream = null;
        this.targetId = null;
        this.isVideo = false; // Video or Audio only
        this.isInitiator = false;

        // Default STUN servers
        // 默认 STUN 服务器
        this.configuration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' }
            ]
        };
    }

    // Initialize local stream
    // 初始化本地流
    async initLocalStream(video = true) {
        try {
            const constraints = {
                audio: true,
                video: video
            };
            this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
            if (this.callbacks.onLocalStream) {
                this.callbacks.onLocalStream(this.localStream);
            }
            return true;
        } catch (error) {
            console.error('Error accessing media devices:', error);
            if (this.callbacks.onError) {
                this.callbacks.onError('Media device access denied or not available');
            }
            return false;
        }
    }

    // Create PeerConnection
    // 创建 PeerConnection
    createPeerConnection() {
        if (this.peerConnection) return;

        this.peerConnection = new RTCPeerConnection(this.configuration);

        // Add local tracks
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                this.peerConnection.addTrack(track, this.localStream);
            });
        }

        // Handle ICE candidates
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate && this.targetId) {
                this.callbacks.onSignal(this.targetId, {
                    type: 'call_ice',
                    candidate: event.candidate
                });
            }
        };

        // Handle connection state changes
        this.peerConnection.onconnectionstatechange = () => {
            console.log('Connection state:', this.peerConnection.connectionState);
            if (this.peerConnection.connectionState === 'disconnected' ||
                this.peerConnection.connectionState === 'failed' ||
                this.peerConnection.connectionState === 'closed') {
                this.endCall('Connection closed');
            }
        };

        // Handle remote stream
        this.peerConnection.ontrack = (event) => {
            if (event.streams && event.streams[0]) {
                this.remoteStream = event.streams[0];
                if (this.callbacks.onRemoteStream) {
                    this.callbacks.onRemoteStream(this.remoteStream);
                }
            }
        };
    }

    // Start a call
    // 开始呼叫
    async startCall(targetId, isVideo = true) {
        this.targetId = targetId;
        this.isVideo = isVideo;
        this.isInitiator = true;

        const success = await this.initLocalStream(isVideo);
        if (!success) {
            this.endCall('Failed to get local stream');
            return;
        }

        this.createPeerConnection();

        try {
            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);

            this.callbacks.onSignal(this.targetId, {
                type: 'call_offer',
                sdp: offer,
                isVideo: isVideo
            });
        } catch (error) {
            console.error('Error creating offer:', error);
            this.endCall('Error creating offer');
        }
    }

    // Accept a call
    // 接受呼叫
    async acceptCall(targetId, offer, isVideo) {
        this.targetId = targetId;
        this.isVideo = isVideo;
        this.isInitiator = false;

        // Ensure local stream is ready (might be audio only if user chose so, but let's match offer)
        const success = await this.initLocalStream(isVideo);
        if (!success) {
            this.endCall('Failed to get local stream');
            return;
        }

        this.createPeerConnection();

        try {
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);

            this.callbacks.onSignal(this.targetId, {
                type: 'call_answer',
                sdp: answer
            });
        } catch (error) {
            console.error('Error creating answer:', error);
            this.endCall('Error creating answer');
        }
    }

    // Handle incoming signal
    // 处理传入信号
    async handleSignal(senderId, data) {
        // If we are already in a call with someone else, maybe reject? 
        // For simplicity, if we are in a call and senderId != this.targetId, ignore or auto-reject.
        if (this.peerConnection && this.peerConnection.connectionState === 'connected' && senderId !== this.targetId) {
            // Busy
            // this.callbacks.onSignal(senderId, { type: 'call_busy' });
            return;
        }

        switch (data.type) {
            case 'call_offer':
                // Incoming call
                if (this.callbacks.onIncomingCall) {
                    this.callbacks.onIncomingCall(senderId, data.sdp, data.isVideo);
                }
                break;

            case 'call_answer':
                if (this.peerConnection && this.targetId === senderId) {
                    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
                }
                break;

            case 'call_ice':
                if (this.peerConnection && this.targetId === senderId) {
                    try {
                        await this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
                    } catch (e) {
                        console.error('Error adding ice candidate:', e);
                    }
                }
                break;

            case 'call_end':
                if (this.targetId === senderId) {
                    this.endCall('Remote ended call');
                }
                break;
        }
    }

    // End call
    // 结束通话
    endCall(reason) {
        // Send end signal if we have a target and connection was active/connecting
        if (this.targetId && this.peerConnection && this.peerConnection.connectionState !== 'closed') {
            try {
                this.callbacks.onSignal(this.targetId, { type: 'call_end' });
            } catch (e) {/*ignore*/ }
        }

        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }

        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }

        this.remoteStream = null;
        this.targetId = null;

        if (this.callbacks.onCallEnded) {
            this.callbacks.onCallEnded(reason);
        }
    }

    toggleAudio(enabled) {
        if (this.localStream) {
            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack) audioTrack.enabled = enabled;
        }
    }

    toggleVideo(enabled) {
        if (this.localStream) {
            const videoTrack = this.localStream.getVideoTracks()[0];
            if (videoTrack) videoTrack.enabled = enabled;
        }
    }
}
