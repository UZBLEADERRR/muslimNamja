import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import api from '../utils/api';
import { Image, CheckCircle, PhoneCall, Video } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { io } from 'socket.io-client';
import VideoCallModal from '../components/VideoCallModal';

const SOCKET_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';
let socket = null;

const TrackPage = () => {
    const { t } = useTranslation();
    const { user } = useAppStore();
    const [activeOrder, setActiveOrder] = useState(null);
    const [trackingData, setTrackingData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Chat state
    const [chatMessages, setChatMessages] = useState([]);
    const [newChatMsg, setNewChatMsg] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);
    // Video Call State
    const [incomingCall, setIncomingCall] = useState(null);

    const fetchOrder = () => {
        api.get('/orders/my')
            .then(async res => {
                const orders = res.data || [];
                const active = orders.find(o => o.status !== 'completed' && o.status !== 'cancelled');
                setActiveOrder(active || null);

                if (active) {
                    try {
                        const trackRes = await api.get(`/orders/${active.id}/tracking`);
                        setTrackingData(trackRes.data);
                    } catch (err) {
                        console.error('Failed to fetch tracking stats');
                    }

                    if (active.status === 'delivering') {
                        fetchChat(active.id);
                    }
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    const fetchChat = (orderId) => {
        api.get(`/orders/${orderId}/chat`)
            .then(res => setChatMessages(res.data || []))
            .catch(err => console.error(err));
    };

    useEffect(() => {
        if (!socket) {
            socket = io(SOCKET_URL);

            socket.on('location-updated', (loc) => {
                setTrackingData(prev => prev ? { ...prev, driverLocation: loc } : null);
            });

            socket.on('receive-message', (msg) => {
                setChatMessages(prev => [...prev, msg]);
            });

            // WebRTC handlers
            socket.on('call-made', data => {
                setIncomingCall(data.senderName || 'Kuryer');
            });
        }

        if (user) {
            fetchOrder();
            // Polling is reduced since websockets handle real-time now
            const interval = setInterval(fetchOrder, 15000);
            return () => clearInterval(interval);
        } else {
            setLoading(false);
        }
    }, [user]);

    // Join room when activeOrder changes
    useEffect(() => {
        if (activeOrder && socket) {
            socket.emit('join-room', `order_${activeOrder.id}`);
        }
    }, [activeOrder]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newChatMsg.trim() && !imageFile) || sending || !activeOrder) return;

        setSending(true);
        try {
            const formData = new FormData();
            if (imageFile) formData.append('image', imageFile);
            if (newChatMsg.trim()) formData.append('text', newChatMsg);

            await api.post(`/orders/${activeOrder.id}/chat`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setNewChatMsg('');
            setImageFile(null);
            fetchChat(activeOrder.id);
        } catch (err) {
            alert('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const confirmDelivery = async () => {
        if (!window.confirm("Rostdan ham taomni qabul qildingizmi?")) return;
        try {
            await api.post(`/orders/${activeOrder.id}/confirm-delivery`);
            alert("Tasdiqlandi! Yoqimli ishtaha!");
            setChatMessages([]);
            fetchOrder(); // Will clear active order since it's completed
        } catch (err) {
            alert('Tasdiqlashda xatolik');
        }
    };

    const getStepIndex = (status) => {
        const map = { 'pending': 0, 'preparing': 1, 'delivering': 2, 'completed': 3 };
        return map[status] || 0;
    };

    const steps = [
        { icon: "🧑‍🍳", label: t('preparing') },
        { icon: "📦", label: t('picked_up') },
        { icon: "🛵", label: t('on_the_way') },
        { icon: "🏠", label: t('arrived') },
    ];

    if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>{t('loading')}</div>;

    if (!activeOrder) {
        return (
            <div className="animate-slide-up" style={{ padding: 20, textAlign: 'center', paddingTop: 60, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                    {/* Pulsating Radar Rings */}
                    <div style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', border: '2px solid rgba(255,107,53,0.1)', animation: 'pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite' }} />
                    <div style={{ position: 'absolute', width: '70%', height: '70%', borderRadius: '50%', border: '2px solid rgba(255,107,53,0.3)', animation: 'pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite 0.5s' }} />
                    <div style={{ position: 'absolute', width: '40%', height: '40%', borderRadius: '50%', border: '2px solid rgba(255,107,53,0.6)', animation: 'pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite 1s' }} />
                    <div style={{ zIndex: 10, background: 'var(--card-bg)', padding: 16, borderRadius: '50%', boxShadow: '0 8px 32px rgba(255,107,53,0.3)' }}>
                        <div style={{ fontSize: 48 }}>📍</div>
                    </div>
                </div>

                <style>
                    {`
                        @keyframes pulse-ring {
                            0% { transform: scale(0.3); opacity: 1; }
                            80% { transform: scale(1.1); opacity: 0; }
                            100% { transform: scale(1.1); opacity: 0; }
                        }
                    `}
                </style>

                <h3 style={{ color: "var(--text-primary)", fontFamily: "'Fraunces', serif", fontSize: 24, marginBottom: 8 }}>{t('live_tracking')}</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: 14, maxWidth: 250, lineHeight: 1.5 }}>
                    Hozircha faol buyurtmalar yo'q. Atrofingizdagi eng maza taomlarni qidiring!
                </p>
            </div>
        );
    }

    const currentStep = getStepIndex(activeOrder.status);
    const isDelivering = activeOrder.status === 'delivering';

    return (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px 20px 0' }}>
            <div style={{ flexShrink: 0 }}>
                <h2 style={{ color: "var(--text-primary)", fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 900, marginBottom: 4 }}>
                    {t('live_tracking')} 📍
                </h2>
                <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 20 }}>
                    Order #{(activeOrder.id || '').toString().slice(0, 8)} · ₩{(activeOrder.totalAmount || 0).toLocaleString()}
                </p>

                {/* Tracking Data Info */}
                {trackingData && trackingData.queuePosition > 0 && activeOrder.status === 'delivering' && (
                    <div style={{ background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.3)', padding: 12, borderRadius: 12, marginBottom: 16, animation: 'fadeIn 0.5s ease' }}>
                        <div style={{ color: 'var(--brand-accent)', fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                            🏃 Kuryer boshqa manzilda
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                            Sizdan avvalgi <b style={{ color: 'var(--text-primary)', fontSize: 14 }}>{trackingData.queuePosition}</b> ta mijoz bor. Biroz kuting...
                        </div>
                    </div>
                )}
                {trackingData && trackingData.driverLocation && activeOrder.status === 'delivering' && (
                    <div style={{ height: 180, width: '100%', borderRadius: 16, overflow: 'hidden', marginBottom: 20, zIndex: 0, border: '1px solid var(--card-border)', background: 'var(--card-bg)' }}>
                        <MapContainer center={[trackingData.driverLocation.lat, trackingData.driverLocation.lng]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                            <Marker position={[trackingData.driverLocation.lat, trackingData.driverLocation.lng]} icon={
                                new L.DivIcon({ className: 'courier-icon', html: '<div style="font-size:28px; background:#fff; border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(0,0,0,0.2); border: 2px solid #27AE60;">🛵</div>', iconSize: [36, 36] })
                            }>
                                <Popup>Kuryer shu yerda</Popup>
                            </Marker>
                        </MapContainer>
                    </div>
                )}

                {/* Progress Visual */}
                <div style={{ background: "linear-gradient(135deg, rgba(39,174,96,0.1) 0%, rgba(39,174,96,0.02) 100%)", borderRadius: 20, height: 120, marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", border: `1px solid rgba(39,174,96,0.2)` }}>
                    <div style={{ textAlign: "center", zIndex: 1, padding: '12px 24px', background: "var(--glass-header)", borderRadius: 16, backdropFilter: "blur(10px)", border: "1px solid var(--card-border)" }}>
                        <div style={{ fontSize: 32, marginBottom: 4 }}>{currentStep >= 2 ? '🛵' : '👨‍🍳'}</div>
                        <div style={{ color: "var(--text-primary)", fontSize: 14, fontWeight: 700 }}>
                            {activeOrder.status === 'pending' ? t('preparing') + '...' :
                                activeOrder.status === 'preparing' ? t('preparing') + '...' :
                                    activeOrder.status === 'delivering' ? t('on_the_way') + '!' : t('arrived')}
                        </div>
                    </div>
                </div>
            </div>

            {/* Chat Area (Visible only when delivering) */}
            {isDelivering ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--card-bg)', borderRadius: '20px 20px 0 0', border: '1px solid var(--card-border)', borderBottom: 'none', overflow: 'hidden' }}>
                    <div style={{ padding: 12, borderBottom: '1px solid var(--card-border)', background: 'rgba(255,107,53,0.05)' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>💬 Kuryer bilan aloqa</div>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {chatMessages.length === 0 && (
                            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 12, padding: 20 }}>
                                Kuryer yo'lga chiqdi. Savollaringiz bo'lsa yozishingiz mumkin.
                            </div>
                        )}
                        {chatMessages.map(msg => {
                            const isMe = msg.senderId === user.id;
                            const isPrompt = msg.offerAction === 'confirm_delivery_prompt';

                            if (isPrompt) {
                                return (
                                    <div key={msg.id} style={{ background: 'rgba(39,174,96,0.1)', border: '1px solid rgba(39,174,96,0.3)', borderRadius: 12, padding: 16, textAlign: 'center', margin: '10px 0' }}>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>{msg.text}</div>
                                        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                                            <button onClick={confirmDelivery} style={{ padding: '8px 24px', background: '#27AE60', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <CheckCircle size={16} /> Ha, oldim
                                            </button>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div key={msg.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '85%', background: isMe ? 'var(--brand-accent)' : 'var(--bg-secondary)', color: isMe ? '#fff' : 'var(--text-primary)', padding: 10, borderRadius: 14, borderBottomRightRadius: isMe ? 4 : 14, borderBottomLeftRadius: isMe ? 14 : 4 }}>
                                    {!isMe && <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 4 }}>Kuryer</div>}
                                    {msg.imageUrl && (
                                        <img src={msg.imageUrl} alt="photo" style={{ width: '100%', borderRadius: 8, marginBottom: msg.text ? 6 : 0 }} />
                                    )}
                                    {msg.text && <div style={{ fontSize: 13, lineHeight: 1.4 }}>{msg.text}</div>}
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    <div style={{ padding: 10, borderTop: '1px solid var(--card-border)', background: 'var(--bg-primary)' }}>
                        <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: 8 }}>
                            <input type="file" accept="image/*" ref={fileInputRef} onChange={e => setImageFile(e.target.files[0])} style={{ display: 'none' }} />
                            <button type="button" onClick={() => fileInputRef.current?.click()} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--card-border)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: imageFile ? 'var(--brand-accent)' : 'var(--text-secondary)', cursor: 'pointer', flexShrink: 0 }}>
                                <Image size={18} />
                            </button>
                            <input
                                value={newChatMsg} onChange={e => setNewChatMsg(e.target.value)}
                                placeholder="Xabar yozing..."
                                style={{ flex: 1, background: 'var(--bg-secondary)', border: '1px solid var(--card-border)', borderRadius: 20, padding: '0 12px', color: 'var(--text-primary)', outline: 'none' }}
                            />
                            <button type="submit" disabled={sending || (!newChatMsg.trim() && !imageFile)} style={{ background: 'var(--brand-accent)', color: '#fff', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, opacity: (sending || (!newChatMsg.trim() && !imageFile)) ? 0.5 : 1 }}>
                                ↑
                            </button>
                        </form>
                    </div>
                </div>
            ) : (
                /* Static Details (Visible when not delivering, e.g. pending/preparing) */
                <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 20 }}>
                    <div style={{ background: "var(--card-bg)", borderRadius: 18, padding: 18, border: `1px solid var(--card-border)`, marginBottom: 14 }}>
                        {steps.map((s, i) => {
                            const done = i <= currentStep;
                            const active = i === currentStep;
                            return (
                                <div key={i} style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: i < 3 ? 16 : 0 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: done ? 'var(--brand-accent)' : active ? `rgba(255,107,53,0.2)` : 'rgba(255,255,255,0.05)', display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: done ? '#fff' : 'inherit', border: active ? `2px solid var(--brand-accent)` : 'none' }}>
                                        {done && i < currentStep ? "✓" : s.icon}
                                    </div>
                                    <div>
                                        <div style={{ color: done || active ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: active ? 700 : 500, fontSize: 14 }}>{s.label}</div>
                                        {active && <div style={{ color: "var(--brand-accent)", fontSize: 11 }}>{t('in_progress')}</div>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {incomingCall && (
                <VideoCallModal
                    callerName={incomingCall}
                    isReceiving={true}
                    onEndCall={() => setIncomingCall(null)}
                />
            )}
        </div>
    );
};

export default TrackPage;
