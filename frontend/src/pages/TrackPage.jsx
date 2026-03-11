import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import api from '../utils/api';
import { CheckCircle, Image, Phone, MessageSquare } from 'lucide-react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';

// Restaurant coordinates
const RESTAURANT = { lat: 37.5503, lng: 127.0731 };

const haversineDistance = (c1, c2) => {
    const R = 6371;
    const dLat = (c2.lat - c1.lat) * Math.PI / 180;
    const dLng = (c2.lng - c1.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(c1.lat * Math.PI / 180) * Math.cos(c2.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const TrackPage = () => {
    const { t } = useTranslation();
    const { user } = useAppStore();
    const [activeOrder, setActiveOrder] = useState(null);
    const [driverLocation, setDriverLocation] = useState(null);
    const [loading, setLoading] = useState(true);

    // Chat state
    const [chatMessages, setChatMessages] = useState([]);
    const [newChatMsg, setNewChatMsg] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [sending, setSending] = useState(false);
    const [showChat, setShowChat] = useState(false);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const socketRef = useRef(null);

    const fetchOrder = async () => {
        try {
            const res = await api.get('/orders/my');
            const orders = res.data || [];
            const active = orders.find(o => o.status !== 'completed' && o.status !== 'cancelled');
            setActiveOrder(active || null);

            if (active && (active.status === 'delivering' || active.status === 'delivered_awaiting_review')) {
                fetchChat(active.id);
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchChat = async (orderId) => {
        try {
            const res = await api.get(`/orders/${orderId}/chat`);
            setChatMessages(res.data || []);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        if (!user) { setLoading(false); return; }

        fetchOrder();
        const interval = setInterval(fetchOrder, 12000);

        // Socket.IO
        const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
        socketRef.current = socket;

        socket.on('location-updated', (loc) => {
            setDriverLocation(loc);
        });
        socket.on('receive-message', (msg) => {
            setChatMessages(prev => [...prev, msg]);
        });

        return () => {
            clearInterval(interval);
            socket.disconnect();
        };
    }, [user]);

    // Join room
    useEffect(() => {
        if (activeOrder && socketRef.current) {
            socketRef.current.emit('join-room', `order_${activeOrder.id}`);
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
        } catch (err) { alert('Xabar yuborib bo\'lmadi'); }
        finally { setSending(false); }
    };

    const confirmDelivery = async () => {
        if (!window.confirm("Rostdan ham taomni qabul qildingizmi?")) return;
        try {
            await api.post(`/orders/${activeOrder.id}/confirm-delivery`);
            alert("Tasdiqlandi! Yoqimli ishtaha! 🍽️");
            setChatMessages([]);
            fetchOrder();
        } catch (err) { alert('Tasdiqlashda xatolik'); }
    };

    const getStatusStep = (status) => {
        const map = { 'pending': 0, 'accepted': 1, 'preparing': 2, 'ready_for_pickup': 3, 'delivering': 4, 'delivered_awaiting_review': 5, 'completed': 6 };
        return map[status] || 0;
    };

    const steps = [
        { icon: '📋', label: t('order_accepted'), key: 'accepted' },
        { icon: '🧑‍🍳', label: t('order_preparing'), key: 'preparing' },
        { icon: '🥡', label: 'Tayyor', key: 'ready_for_pickup' },
        { icon: '🛵', label: t('driver_on_way'), key: 'delivering' },
        { icon: '🏠', label: t('order_delivered'), key: 'delivered' },
    ];

    // Estimate delivery time
    const estimateTime = () => {
        if (!driverLocation || !user?.location) return null;
        const dist = haversineDistance(driverLocation, user.location);
        const mins = Math.round(dist / 0.5 * 3); // ~0.5km per 3 min on scooter
        return mins < 1 ? '1 min' : `~${mins} min`;
    };

    const isNearby = () => {
        if (!driverLocation || !user?.location) return false;
        return haversineDistance(driverLocation, user.location) < 0.3;
    };

    if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>{t('loading')}</div>;

    if (!activeOrder) {
        return (
            <div className="animate-slide-up" style={{ padding: 20, textAlign: 'center', paddingTop: 60, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: 160, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                    <div style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', border: '2px solid rgba(255,107,53,0.1)', animation: 'pulse-ring 2s ease infinite' }} />
                    <div style={{ position: 'absolute', width: '70%', height: '70%', borderRadius: '50%', border: '2px solid rgba(255,107,53,0.3)', animation: 'pulse-ring 2s ease infinite 0.5s' }} />
                    <div style={{ zIndex: 10, background: 'var(--card-bg)', padding: 20, borderRadius: '50%', boxShadow: '0 8px 32px rgba(255,107,53,0.2)' }}>
                        <div style={{ fontSize: 48 }}>📍</div>
                    </div>
                </div>
                <style>{`@keyframes pulse-ring { 0% { transform: scale(0.3); opacity: 1; } 80%,100% { transform: scale(1.1); opacity: 0; } }`}</style>
                <h3 style={{ color: "var(--text-primary)", fontFamily: "'Fraunces', serif", fontSize: 22, marginBottom: 8 }}>{t('live_tracking')}</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: 14, maxWidth: 250, lineHeight: 1.5 }}>{t('no_active_order')}</p>
            </div>
        );
    }

    const currentStep = getStatusStep(activeOrder.status);
    const isDelivering = ['delivering', 'delivered_awaiting_review'].includes(activeOrder.status);
    const etaText = estimateTime();

    return (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
            <div style={{ padding: '16px 20px', flexShrink: 0 }}>
                <h2 style={{ color: "var(--text-primary)", fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 900, margin: '0 0 4px' }}>
                    {t('live_tracking')} 📍
                </h2>
                <p style={{ color: "var(--text-secondary)", fontSize: 12, margin: 0 }}>
                    #{(activeOrder.id || '').toString().slice(0, 8)} · ₩{(activeOrder.totalAmount || 0).toLocaleString()}
                </p>
            </div>

            {/* Driver Nearby Alert */}
            {isNearby() && (
                <div style={{ margin: '0 20px 12px', padding: '12px 16px', background: 'rgba(39,174,96,0.1)', border: '1px solid rgba(39,174,96,0.3)', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 10, animation: 'fadeIn 0.5s ease' }}>
                    <span style={{ fontSize: 24 }}>🎉</span>
                    <div>
                        <div style={{ color: '#27AE60', fontWeight: 800, fontSize: 14 }}>{t('driver_nearby')}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 11 }}>Kuryer tez orada yetib keladi!</div>
                    </div>
                </div>
            )}

            {/* ETA Banner */}
            {etaText && isDelivering && (
                <div style={{ margin: '0 20px 12px', padding: '14px 18px', background: 'linear-gradient(135deg, var(--brand-accent), #FF3CAC)', borderRadius: 16, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: 11, opacity: 0.9 }}>{t('estimated_time')}</div>
                        <div style={{ fontSize: 24, fontWeight: 900, fontFamily: "'Fraunces', serif" }}>{etaText}</div>
                    </div>
                    <div style={{ fontSize: 40 }}>🛵</div>
                </div>
            )}

            {/* Progress Steps - Coupang Eats Style */}
            <div style={{ margin: '0 20px 16px', background: 'var(--card-bg)', borderRadius: 20, padding: '16px 20px', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-main)' }}>
                {/* Progress Bar */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, gap: 0 }}>
                    {steps.map((s, i) => {
                        const done = i < currentStep;
                        const active = i === currentStep - 1 || (currentStep === 0 && i === 0);
                        return (
                            <React.Fragment key={i}>
                                <div style={{
                                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                                    background: done ? 'var(--brand-accent)' : active ? 'rgba(255,107,53,0.2)' : 'var(--bg-secondary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                                    color: done ? '#fff' : 'inherit', border: active ? '2px solid var(--brand-accent)' : 'none',
                                    transition: 'all 0.3s'
                                }}>
                                    {done ? '✓' : s.icon}
                                </div>
                                {i < steps.length - 1 && (
                                    <div style={{ flex: 1, height: 3, background: done ? 'var(--brand-accent)' : 'var(--bg-secondary)', borderRadius: 2, transition: 'all 0.3s' }} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 15 }}>
                        {steps[Math.min(currentStep - 1, steps.length - 1)]?.label || t('preparing')}
                    </div>
                    <div style={{ color: 'var(--brand-accent)', fontSize: 12, marginTop: 4 }}>{t('in_progress')}</div>
                </div>
            </div>

            {/* Order Items Quick View */}
            <div style={{ margin: '0 20px 16px', background: 'var(--card-bg)', borderRadius: 16, padding: 14, border: '1px solid var(--card-border)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>🛍 {t('items')}</div>
                {activeOrder.items?.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, color: 'var(--text-primary)' }}>
                        <span>{item.productName || 'Item'} × {item.quantity}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>₩{((item.price || 0) * item.quantity).toLocaleString()}</span>
                    </div>
                ))}
            </div>

            {/* Chat Toggle Button (when delivering) */}
            {isDelivering && (
                <>
                    <div style={{ padding: '0 20px 8px', display: 'flex', gap: 10 }}>
                        <button onClick={() => setShowChat(!showChat)} style={{
                            flex: 1, padding: '12px', borderRadius: 14, border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                            background: showChat ? 'var(--brand-accent)' : 'var(--card-bg)', color: showChat ? '#fff' : 'var(--text-primary)',
                            border: `1px solid ${showChat ? 'var(--brand-accent)' : 'var(--card-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                        }}>
                            <MessageSquare size={16} /> Kuryer bilan chat
                        </button>
                        {activeOrder.driver?.phone && (
                            <a href={`tel:${activeOrder.driver.phone}`} style={{
                                padding: '12px 20px', borderRadius: 14, background: '#27AE60', color: '#fff', textDecoration: 'none',
                                fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6
                            }}>
                                <Phone size={16} /> Qo'ng'iroq
                            </a>
                        )}
                    </div>

                    {/* Confirm delivery button */}
                    {activeOrder.status === 'delivered_awaiting_review' && (
                        <div style={{ padding: '0 20px 12px' }}>
                            <button onClick={confirmDelivery} style={{
                                width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                                background: '#27AE60', color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                            }}>
                                <CheckCircle size={18} /> {t('confirm_received')}
                            </button>
                        </div>
                    )}

                    {/* Chat Area */}
                    {showChat && (
                        <div style={{ flex: 1, margin: '0 20px 12px', display: 'flex', flexDirection: 'column', background: 'var(--card-bg)', borderRadius: 20, border: '1px solid var(--card-border)', overflow: 'hidden' }}>
                            <div style={{ padding: 10, borderBottom: '1px solid var(--card-border)', background: 'rgba(255,107,53,0.05)' }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>💬 Kuryer bilan aloqa</div>
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 250 }}>
                                {chatMessages.length === 0 && (
                                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 12, padding: 16 }}>Kuryer yo'lga chiqdi. Savollar bo'lsa yozing.</div>
                                )}
                                {chatMessages.map(msg => {
                                    const isMe = msg.senderId === user?.id;
                                    const isPrompt = msg.offerAction === 'confirm_delivery_prompt';

                                    if (isPrompt) {
                                        return (
                                            <div key={msg.id} style={{ background: 'rgba(39,174,96,0.1)', border: '1px solid rgba(39,174,96,0.3)', borderRadius: 12, padding: 14, textAlign: 'center', margin: '6px 0' }}>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>{msg.text}</div>
                                                <button onClick={confirmDelivery} style={{ padding: '8px 20px', background: '#27AE60', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                    <CheckCircle size={14} /> Ha, oldim
                                                </button>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={msg.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%', background: isMe ? 'var(--brand-accent)' : 'var(--bg-secondary)', color: isMe ? '#fff' : 'var(--text-primary)', padding: 10, borderRadius: 14, borderBottomRightRadius: isMe ? 4 : 14, borderBottomLeftRadius: isMe ? 14 : 4 }}>
                                            {!isMe && <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 3 }}>🛵 Kuryer</div>}
                                            {msg.imageUrl && <img src={msg.imageUrl} alt="" style={{ width: '100%', borderRadius: 8, marginBottom: msg.text ? 6 : 0 }} />}
                                            {msg.text && <div style={{ fontSize: 13, lineHeight: 1.4 }}>{msg.text}</div>}
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            <div style={{ padding: 8, borderTop: '1px solid var(--card-border)', background: 'var(--bg-primary)' }}>
                                <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: 8 }}>
                                    <input type="file" accept="image/*" ref={fileInputRef} onChange={e => setImageFile(e.target.files?.[0])} style={{ display: 'none' }} />
                                    <button type="button" onClick={() => fileInputRef.current?.click()} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--card-border)', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', color: imageFile ? 'var(--brand-accent)' : 'var(--text-secondary)', cursor: 'pointer', flexShrink: 0 }}>
                                        <Image size={16} />
                                    </button>
                                    <input value={newChatMsg} onChange={e => setNewChatMsg(e.target.value)} placeholder="Xabar..." style={{ flex: 1, background: 'var(--bg-secondary)', border: '1px solid var(--card-border)', borderRadius: 20, padding: '0 12px', color: 'var(--text-primary)', outline: 'none', fontSize: 13 }} />
                                    <button type="submit" disabled={sending || (!newChatMsg.trim() && !imageFile)} style={{ background: 'var(--brand-accent)', color: '#fff', border: 'none', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, opacity: (sending || (!newChatMsg.trim() && !imageFile)) ? 0.5 : 1 }}>↑</button>
                                </form>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default TrackPage;
