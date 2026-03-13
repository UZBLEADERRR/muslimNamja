import React, { useEffect, useRef, useState } from 'react';
import { PhoneOff, Video, Mic, MicOff, VideoOff } from 'lucide-react';

const VideoCallModal = ({ 
    callerName, 
    onEndCall, 
    isReceiving = false, 
    socket, 
    roomName, 
    signalData,
    targetId
}) => {
    const [stream, setStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [callStatus, setCallStatus] = useState('connecting');
    const myVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerRef = useRef(null);
    const streamRef = useRef(null);

    useEffect(() => {
        if (!socket) {
            setCallStatus('error');
            return;
        }

        let cancelled = false;

        const startCall = async () => {
            try {
                // Try video+audio first, fallback to audio-only
                let currentStream;
                try {
                    currentStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                } catch (videoErr) {
                    console.warn('Video failed, trying audio only:', videoErr);
                    try {
                        currentStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
                    } catch (audioErr) {
                        throw audioErr;
                    }
                }

                if (cancelled) {
                    currentStream.getTracks().forEach(t => t.stop());
                    return;
                }

                setStream(currentStream);
                streamRef.current = currentStream;
                if (myVideoRef.current) {
                    myVideoRef.current.srcObject = currentStream;
                }

                // Dynamically import simple-peer to handle buffer polyfill
                let Peer;
                try {
                    // Use the pre-built browser bundle which includes buffer polyfill
                    const module = await import('simple-peer/simplepeer.min.js');
                    Peer = module.default || module;
                } catch (importErr) {
                    console.warn('simplepeer.min.js import failed, trying default:', importErr);
                    const module = await import('simple-peer');
                    Peer = module.default || module;
                }

                if (cancelled) return;

                const peer = new Peer({
                    initiator: !isReceiving,
                    trickle: false,
                    stream: currentStream,
                    config: {
                        iceServers: [
                            { urls: 'stun:stun.l.google.com:19302' },
                            { urls: 'stun:stun1.l.google.com:19302' },
                        ]
                    }
                });

                peer.on('signal', data => {
                    if (!isReceiving) {
                        socket.emit('webrtc-offer', { room: roomName, signalData: data, callerName: callerName || 'Foydalanuvchi', targetId });
                    } else {
                        socket.emit('webrtc-answer', { room: roomName, signalData: data });
                    }
                });

                peer.on('stream', remoteStream => {
                    setCallStatus('connected');
                    if (remoteVideoRef.current) {
                        remoteVideoRef.current.srcObject = remoteStream;
                    }
                });

                peer.on('connect', () => {
                    setCallStatus('connected');
                });

                peer.on('error', (err) => {
                    console.error('Peer error:', err);
                    setCallStatus('error');
                });

                peer.on('close', () => {
                    setCallStatus('ended');
                });

                if (isReceiving && signalData) {
                    peer.signal(signalData);
                }

                peerRef.current = peer;
                setCallStatus(isReceiving ? 'connected' : 'ringing');

            } catch (err) {
                console.error("Media access error:", err);
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    alert("Kamera va mikrofonga ruxsat berilmadi. Iltimos, brauzer sozlamalaridan ruxsat bering va qayta urinib ko'ring.");
                } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                    alert("Kamera yoki mikrofon topilmadi. Qurilmangizda kamera borligiga ishonch hosil qiling.");
                } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                    alert("Kamera yoki mikrofon boshqa ilova tomonidan ishlatilmoqda. Boshqa ilovalarni yoping va qayta urinib ko'ring.");
                } else {
                    alert(`Kamera yoki mikrofonga ulanishda xatolik: ${err?.message || 'Nomalum xatolik'}`);
                }
                onEndCall();
            }
        };

        startCall();

        return () => {
            cancelled = true;
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (peerRef.current) {
                peerRef.current.destroy();
            }
        };
    }, []);

    // Listen for answer or termination if we are the caller/receiver
    useEffect(() => {
        if (!socket) return;
        
        const handleAnswer = (data) => {
            if (peerRef.current && !peerRef.current.destroyed) {
                peerRef.current.signal(data.signalData);
            }
        };

        const handleCallRejected = () => {
            setCallStatus('ended');
            setTimeout(onEndCall, 1500);
        };

        const handleCallCancelled = () => {
            setCallStatus('ended');
            setTimeout(onEndCall, 1000);
        };

        socket.on('webrtc-answer', handleAnswer);
        socket.on('call-accepted', () => setCallStatus('connected'));
        socket.on('call-rejected', handleCallRejected);
        socket.on('call-cancelled', handleCallCancelled);
        socket.on('call-ended', () => handleEndCall());

        return () => {
            socket.off('webrtc-answer', handleAnswer);
            socket.off('call-accepted');
            socket.off('call-rejected', handleCallRejected);
            socket.off('call-cancelled', handleCallCancelled);
            socket.off('call-ended');
        };
    }, [socket, isReceiving]);

    const toggleMute = () => {
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = isMuted;
                setIsMuted(!isMuted);
            }
        }
    };

    const toggleVideo = () => {
        if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = isVideoOff;
                setIsVideoOff(!isVideoOff);
            }
        }
    };

    const handleEndCall = () => {
        if (socket) {
            if (callStatus === 'ringing') {
                socket.emit('cancel-call', { room: roomName });
            } else {
                socket.emit('hangup-call', { room: roomName });
            }
        }
        
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (peerRef.current) {
            peerRef.current.destroy();
        }
        onEndCall();
    };

    const statusText = {
        connecting: "Ulanmoqda...",
        ringing: `${callerName || 'Abonent'} ga qo'ng'iroq qilinmoqda...`,
        connected: `${callerName || 'Abonent'} bilan suhbat`,
        error: "Xatolik yuz berdi",
        ended: "Qo'ng'iroq tugadi"
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: '#000', zIndex: 9999, display: 'flex', flexDirection: 'column'
        }}>
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* Remote Video */}
                <video
                    playsInline autoPlay ref={remoteVideoRef}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />

                {/* No remote video placeholder */}
                {callStatus !== 'connected' && (
                    <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand-accent, #FF6B35), #FF3CAC)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>📞</div>
                        <div style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{statusText[callStatus]}</div>
                        {callStatus === 'ringing' && (
                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Javob kutilmoqda...</div>
                        )}
                    </div>
                )}

                {/* Local Video Thumbnail */}
                <div style={{
                    position: 'absolute', top: 20, right: 20, width: 100, height: 150,
                    borderRadius: 12, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.5)',
                    background: '#333'
                }}>
                    <video playsInline muted autoPlay ref={myVideoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>

                {/* Call Info Overlay */}
                <div style={{
                    position: 'absolute', top: 20, left: 20, background: 'rgba(0,0,0,0.5)',
                    padding: '8px 16px', borderRadius: 20, color: '#fff', fontSize: 14, fontWeight: 700
                }}>
                    {statusText[callStatus]}
                </div>
            </div>

            {/* Controls */}
            <div style={{ padding: '30px 20px', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', display: 'flex', justifyContent: 'center', gap: 20, position: 'absolute', bottom: 0, width: '100%', boxSizing: 'border-box' }}>
                <button onClick={toggleMute} style={{ width: 56, height: 56, borderRadius: 28, border: 'none', background: isMuted ? '#fff' : 'rgba(255,255,255,0.2)', color: isMuted ? '#000' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                </button>
                <button onClick={handleEndCall} style={{ width: 64, height: 64, borderRadius: 32, border: 'none', background: '#E74C3C', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 15px rgba(231,76,60,0.5)' }}>
                    <PhoneOff size={28} />
                </button>
                <button onClick={toggleVideo} style={{ width: 56, height: 56, borderRadius: 28, border: 'none', background: isVideoOff ? '#fff' : 'rgba(255,255,255,0.2)', color: isVideoOff ? '#000' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                </button>
            </div>
        </div>
    );
};

export default VideoCallModal;
