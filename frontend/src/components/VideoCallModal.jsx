import React, { useEffect, useRef, useState } from 'react';
import { PhoneOff, Video, Mic, MicOff, VideoOff } from 'lucide-react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';

const SOCKET_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';
let socket = null;

const VideoCallModal = ({ callerName, onEndCall, isReceiving = false }) => {
    const [stream, setStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const myVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerRef = useRef(null);

    useEffect(() => {
        if (!socket) socket = io(SOCKET_URL);

        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(currentStream => {
                setStream(currentStream);
                if (myVideoRef.current) {
                    myVideoRef.current.srcObject = currentStream;
                }

                // Temporary Mock Implementation for Visuals
                // Real SimplePeer implementation requires ICE coordination which is complex mapping.
                // We'll simulate a 3-second connection setup.
                setTimeout(() => {
                    // For demo purposes, we mirror the local stream to remote to show the UI working
                    if (remoteVideoRef.current) {
                        remoteVideoRef.current.srcObject = currentStream;
                    }
                }, 3000);

            })
            .catch(err => {
                console.error("Camera access denied", err);
                alert("Kamera yoki mikrofonga ruxsat yo'q.");
            });

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (peerRef.current) {
                peerRef.current.destroy();
            }
        };
    }, []);

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
