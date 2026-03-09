import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { io } from 'socket.io-client';
import { Send, PhoneCall } from 'lucide-react';

const SOCKET_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';
let socket = null;

const StaffChat = () => {
    const { user } = useAppStore();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!socket) {
            socket = io(SOCKET_URL);
        }

        socket.emit('join-room', 'staff_room');

        const msgHandler = (msg) => {
            // Check if it's our room (we can just add it, backend should broadcast to the room)
            setMessages(prev => [...prev, msg]);
        };

        socket.on('staff-receive-message', msgHandler);

        return () => {
            socket.off('staff-receive-message', msgHandler);
        };
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        const msgPayload = {
            id: Date.now() + Math.random(),
            senderId: user.id,
            senderName: user.firstName,
            role: user.role,
            text: newMessage.trim(),
            timestamp: new Date().toISOString()
        };

        socket.emit('staff-send-message', msgPayload);
        setNewMessage('');
    };

    const handleWebRTCCall = () => {
        if (window.confirm("Barcha xodimlarga qo'ng'iroq qilish (WebRTC)?")) {
            alert("WebRTC qong'iroq signali yuborildi");
            socket.emit('call-made', { room: 'staff_room', senderName: user.firstName });
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 400, background: 'var(--card-bg)', borderRadius: 16, border: '1px solid var(--card-border)', overflow: 'hidden' }}>
            <div style={{ padding: 14, background: 'linear-gradient(135deg, var(--brand-accent), var(--brand-accent2))', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: 16 }}>🧑‍💼 Xodimlar Chati</div>
                <button onClick={handleWebRTCCall} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 600 }}>
                    <PhoneCall size={16} /> Qo'ng'iroq
                </button>
            </div>

            <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {messages.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13, marginTop: 40 }}>Xodimlar guruhiga xush kelibsiz.</div>
                )}
                {messages.map((msg, i) => {
                    const isMe = msg.senderId === user?.id;
                    return (
                        <div key={i} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                            {!isMe && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4, marginLeft: 4 }}>{msg.senderName} ({msg.role})</div>}
                            <div style={{ background: isMe ? 'var(--brand-accent)' : 'var(--bg-secondary)', color: isMe ? '#fff' : 'var(--text-primary)', padding: '10px 14px', borderRadius: 14, borderBottomRightRadius: isMe ? 4 : 14, borderBottomLeftRadius: isMe ? 14 : 4, fontSize: 14 }}>
                                {msg.text}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} style={{ display: 'flex', padding: 10, background: 'var(--bg-primary)', borderTop: '1px solid var(--card-border)', gap: 8 }}>
                <input
                    value={newMessage} onChange={e => setNewMessage(e.target.value)}
                    placeholder="Xabar yozing..."
                    style={{ flex: 1, padding: '12px 16px', borderRadius: 20, border: '1px solid var(--card-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                />
                <button type="submit" disabled={!newMessage.trim()} style={{ background: 'var(--brand-accent2)', color: '#fff', border: 'none', width: 44, height: 44, borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: !newMessage.trim() ? 0.6 : 1 }}>
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
};

export default StaffChat;
