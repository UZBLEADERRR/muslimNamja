import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import api from '../utils/api';
import { io } from 'socket.io-client';
import { Send, PhoneCall, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import VideoCallModal from './VideoCallModal';

const SOCKET_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';

const DirectChat = ({ conversation, onBack }) => {
    const { user } = useAppStore();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [sending, setSending] = useState(false);
    
    const messagesEndRef = useRef(null);
    const socketRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        // Fetch messages for this conversation
        const fetchMessages = async () => {
            try {
                const endpoint = conversation.type === 'dm' 
                    ? `/inbox/${conversation.targetId}`
                    : `/orders/${conversation.targetId}/chat`;
                const res = await api.get(endpoint);
                setMessages(res.data || []);
            } catch (err) {
                console.error("Failed to load conversation", err);
            }
        };

        fetchMessages();

        // Connect socket for real-time
        const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
        socketRef.current = socket;

        // Group chats (Orders) vs DMs
        if (conversation.type === 'order') {
            socket.emit('join-room', `order_${conversation.targetId}`);
        } else {
            // DMs: we can join a hybrid room string, e.g. lower of the two IDs first
            const ids = [user.id, conversation.targetId].sort();
            socket.emit('join-room', `dm_${ids[0]}_${ids[1]}`);
        }

        socket.on('receive-message', (msg) => {
            setMessages(prev => [...prev, msg]);
        });

        return () => socket.disconnect();
    }, [conversation.targetId, conversation.type, user.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !imageFile) || sending) return;

        setSending(true);
        try {
            const formData = new FormData();
            if (newMessage.trim()) formData.append('text', newMessage.trim());
            if (imageFile) formData.append('image', imageFile);

            const endpoint = conversation.type === 'dm'
                ? `/inbox/${conversation.targetId}`
                : `/orders/${conversation.targetId}/chat`;
            
            const res = await api.post(endpoint, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Emit to socket so others see it instantly
            if (socketRef.current?.connected) {
                const roomName = conversation.type === 'order' 
                    ? `order_${conversation.targetId}` 
                    : `dm_${[user.id, conversation.targetId].sort().join('_')}`;
                
                socketRef.current.emit('send-message', {
                    room: roomName,
                    ...res.data
                });
            }

            setNewMessage('');
            setImageFile(null);
            
            // Re-fetch to ensure sync
            const newRes = await api.get(endpoint);
            setMessages(newRes.data || []);
            
        } catch (err) {
            console.error(err);
        } finally {
            setSending(false);
        }
    };

    const [activeCall, setActiveCall] = useState(null); // { isReceiving, callerName, signalData, roomName }

    const handleCall = () => {
        // We act as initiator
        const roomName = conversation.type === 'order' 
            ? `order_${conversation.targetId}` 
            : `dm_${[user.id, conversation.targetId].sort().join('_')}`;
        
        setActiveCall({
            isReceiving: false,
            callerName: conversation.name,
            signalData: null,
            roomName: roomName
        });
    };

    // Listen for incoming calls
    useEffect(() => {
        if (!socketRef.current) return;
        const socket = socketRef.current;

        const handleIncomingCall = (data) => {
            // data = { room, signalData, callerName }
            const expectedRoom = conversation.type === 'order' 
                ? `order_${conversation.targetId}` 
                : `dm_${[user.id, conversation.targetId].sort().join('_')}`;

            if (data.room === expectedRoom && !activeCall) {
                if (window.confirm(`${data.callerName || 'Kimdir'} sizga qo'ng'iroq qilmoqda. Qabul qilasizmi?`)) {
                    setActiveCall({
                        isReceiving: true,
                        callerName: data.callerName || 'Abonent',
                        signalData: data.signalData,
                        roomName: expectedRoom
                    });
                }
            }
        };

        socket.on('webrtc-offer', handleIncomingCall);
        return () => socket.off('webrtc-offer', handleIncomingCall);
    }, [conversation.targetId, conversation.type, user.id, activeCall]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)' }}>
            {activeCall && (
                <VideoCallModal 
                    socket={socketRef.current}
                    roomName={activeCall.roomName}
                    isReceiving={activeCall.isReceiving}
                    callerName={activeCall.callerName}
                    signalData={activeCall.signalData}
                    onEndCall={() => setActiveCall(null)}
                />
            )}
            {/* Header */}
            <div style={{ padding: '12px 16px', background: 'var(--card-bg)', borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--brand-accent)', cursor: 'pointer', padding: 0, display: 'flex' }}>
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>{conversation.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Online</div>
                    </div>
                </div>
                <button onClick={handleCall} style={{ background: 'rgba(255,107,53,0.1)', color: 'var(--brand-accent)', border: 'none', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <PhoneCall size={18} />
                </button>
            </div>

            {/* Messages Area */}
            <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, backgroundImage: 'url("https://ww.namnak.com/user/dt/1402/11/chat-bg-png-1707043868.png")', backgroundSize: 'cover', backgroundBlendMode: 'overlay', backgroundColor: 'rgba(15, 23, 42, 0.95)' }}>
                {messages.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#fff', fontSize: 13, marginTop: 40, background: 'rgba(0,0,0,0.4)', padding: '8px 16px', borderRadius: 20, alignSelf: 'center' }}>
                        Xabarlar yo'q. Yozishni boshlang!
                    </div>
                )}
                
                {messages.map((msg, i) => {
                    const isMe = msg.senderId === user?.id;
                    const isSys = msg.isSystem;

                    if (isSys) {
                        return (
                            <div key={i} style={{ alignSelf: 'center', background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '6px 14px', borderRadius: 20, fontSize: 11, textAlign: 'center', maxWidth: '80%' }}>
                                {msg.text}
                            </div>
                        );
                    }

                    return (
                        <div key={i} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '75%', display: 'flex', flexDirection: 'column' }}>
                            {!isMe && msg.sender?.firstName && <span style={{ fontSize: 11, color: 'var(--brand-accent)', marginLeft: 8, marginBottom: 4, fontWeight: 700 }}>{msg.sender.firstName}</span>}
                            <div style={{ 
                                background: isMe ? 'linear-gradient(135deg, var(--brand-accent), var(--brand-accent2))' : 'var(--card-bg)', 
                                color: isMe ? '#ffffff' : 'var(--text-primary)', 
                                padding: '10px 14px', 
                                borderRadius: 16, 
                                borderBottomRightRadius: isMe ? 4 : 16, 
                                borderBottomLeftRadius: !isMe ? 4 : 16, 
                                fontSize: 14, 
                                boxShadow: '0 2px 5px rgba(0,0,0,0.1)' 
                            }}>
                                {msg.imageUrl && (
                                    <img src={msg.imageUrl} alt="attached" style={{ width: '100%', borderRadius: 10, marginBottom: msg.text ? 8 : 0, maxHeight: 200, objectFit: 'cover' }} />
                                )}
                                {msg.text && <div>{msg.text}</div>}
                                
                                <div style={{ fontSize: 9, color: isMe ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)', textAlign: 'right', marginTop: 4 }}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            {imageFile && (
                <div style={{ padding: '8px 16px', background: 'var(--card-bg)', borderTop: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontSize: 12, color: 'var(--brand-accent)' }}>Rasm tanlandi</div>
                    <button onClick={() => setImageFile(null)} style={{ background: 'var(--bg-secondary)', border: 'none', color: 'var(--text-primary)', borderRadius: 10, padding: '4px 8px', fontSize: 11 }}>O'chirish</button>
                </div>
            )}
            <form onSubmit={handleSendMessage} style={{ display: 'flex', padding: '12px 16px', background: 'var(--card-bg)', borderTop: '1px solid var(--card-border)', gap: 12, alignItems: 'center' }}>
                <button type="button" onClick={() => fileInputRef.current?.click()} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }}>
                    <ImageIcon size={24} />
                </button>
                <input type="file" ref={fileInputRef} onChange={e => setImageFile(e.target.files?.[0])} accept="image/*" style={{ display: 'none' }} />
                
                <input
                    value={newMessage} onChange={e => setNewMessage(e.target.value)}
                    placeholder="Xabar yozing..."
                    style={{ flex: 1, padding: '12px 16px', borderRadius: 24, border: 'none', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', fontSize: 14 }}
                />
                <button type="submit" disabled={(!newMessage.trim() && !imageFile) || sending} style={{ background: (!newMessage.trim() && !imageFile) ? 'var(--bg-secondary)' : 'var(--brand-accent)', color: (!newMessage.trim() && !imageFile) ? 'var(--text-secondary)' : '#fff', border: 'none', width: 44, height: 44, borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
};

export default DirectChat;
