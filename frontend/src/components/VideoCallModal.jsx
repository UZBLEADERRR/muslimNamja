import React, { useEffect, useRef, useState } from 'react';
import { PhoneOff, Video, Mic, MicOff, VideoOff } from 'lucide-react';
import Peer from 'simple-peer';

const VideoCallModal = ({ 
    callerName, 
    onEndCall, 
    isReceiving = false, 
    socket, 
    roomName, 
    signalData 
}) => {
    const [stream, setStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const myVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerRef = useRef(null);
    const streamRef = useRef(null);

    useEffect(() => {
        if (!socket) return;

        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(currentStream => {
                setStream(currentStream);
                streamRef.current = currentStream;
                if (myVideoRef.current) {
                    myVideoRef.current.srcObject = currentStream;
                }

                const peer = new Peer({
                    initiator: !isReceiving,
                    trickle: false,
                    stream: currentStream
                });

                peer.on('signal', data => {
                    if (!isReceiving) {
                        // We are calling
                        socket.emit('webrtc-offer', { room: roomName, signalData: data, callerName: 'Ajoyib Inson' });
                    } else {
                        // We are answering
                        socket.emit('webrtc-answer', { room: roomName, signalData: data });
                    }
                });

                peer.on('stream', remoteStream => {
                    if (remoteVideoRef.current) {
                        remoteVideoRef.current.srcObject = remoteStream;
                    }
                });

                if (isReceiving && signalData) {
                    peer.signal(signalData);
                }

                peerRef.current = peer;
                
            })
            .catch(err => {
                console.error("Camera access denied", err);
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    alert("Kamera va mikrofonga ruxsat berilmadi. Iltimos, brauzer sozlamalaridan ruxsat bering va qayta urinib ko'ring.");
                } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                    alert("Kamera yoki mikrofon topilmadi. Qurilmangizda kamera borligiga ishonch hosil qiling.");
                } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                    alert("Kamera yoki mikrofon boshqa ilova tomonidan ishlatilmoqda. Boshqa ilovalarni yoping va qayta urinib ko'ring.");
                } else {
                    alert(`Kamera yoki mikrofonga ulanishda xatolik: ${err.message}`);
                }
                onEndCall();
            });

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (peerRef.current) {
                peerRef.current.destroy();
            }
        };
    }, []);

    // Listen for answer if we are the caller
    useEffect(() => {
        if (!socket || isReceiving) return;
        
        const handleAnswer = (data) => {
            if (peerRef.current && !peerRef.current.destroyed) {
                peerRef.current.signal(data.signalData);
            }
        };

        socket.on('webrtc-answer', handleAnswer);
        return () => socket.off('webrtc-answer', handleAnswer);
    }, [socket, isReceiving]);

    const toggleMute = () => {
        if (stream) {
            stream.getAudioTracks()[0].enabled = isMuted;
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (stream) {
            stream.getVideoTracks()[0].enabled = isVideoOff;
            setIsVideoOff(!isVideoOff);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: '#000', zIndex: 9999, display: 'flex', flexDirection: 'column'
        }}>
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* Remote Video (Mocked as full screen) */}
                <video
                    playsInline autoPlay ref={remoteVideoRef}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />

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
                    {isReceiving ? `${callerName} bilan suhbat...` : `Qo'ng'iroq qilinmoqda...`}
                </div>
            </div>

            {/* Controls */}
            <div style={{ padding: '30px 20px', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', display: 'flex', justifyContent: 'center', gap: 20, position: 'absolute', bottom: 0, width: '100%' }}>
                <button onClick={toggleMute} style={{ width: 56, height: 56, borderRadius: 28, border: 'none', background: isMuted ? '#fff' : 'rgba(255,255,255,0.2)', color: isMuted ? '#000' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                </button>
                <button onClick={onEndCall} style={{ width: 64, height: 64, borderRadius: 32, border: 'none', background: '#E74C3C', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 15px rgba(231,76,60,0.5)' }}>
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
