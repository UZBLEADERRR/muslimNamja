import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import api from '../utils/api';
import { CheckCircle, MapPin, Navigation } from 'lucide-react';
import { io } from 'socket.io-client';
import DirectChat from '../components/DirectChat';

const SOCKET_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';

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
    
    const [activeTab, setActiveTab] = useState('tracking'); // 'tracking' or 'chat'
    const [activeOrder, setActiveOrder] = useState(null);
    const [driverLocation, setDriverLocation] = useState(null);
    const [loading, setLoading] = useState(true);

    // Chat List
    const [inbox, setInbox] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);

    const fetchOrder = async () => {
        try {
            const res = await api.get('/orders/my');
            const orders = res.data || [];
            const active = orders.find(o => o.status !== 'completed' && o.status !== 'cancelled');
            setActiveOrder(active || null);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchInbox = async () => {
        try {
            const res = await api.get('/inbox');
            setInbox(res.data || []);
        } catch (err) { console.error('Inbox fetch error:', err); }
    };

    useEffect(() => {
        if (!user) { setLoading(false); return; }

        fetchOrder();
        fetchInbox();
        const interval = setInterval(() => {
            fetchOrder();
            if (activeTab === 'chat' && !selectedChat) fetchInbox();
        }, 12000);

        // Global Socket for location updates
        const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
        
        socket.on('location-updated', (loc) => {
            setDriverLocation(loc);
        });

        return () => {
            clearInterval(interval);
            socket.disconnect();
        };
    }, [user, activeTab, selectedChat]);

    const confirmDelivery = async () => {
        if (!window.confirm("Rostdan ham taomni qabul qildingizmi?")) return;
        try {
            await api.post(`/orders/${activeOrder.id}/confirm-delivery`);
            alert("Tasdiqlandi! Yoqimli ishtaha! 🍽️");
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

    const estimateTime = () => {
        if (!driverLocation || !user?.location) return null;
        const dist = haversineDistance(driverLocation, user.location);
        const mins = Math.round(dist / 0.5 * 3); 
        return mins < 1 ? '1 min' : `~${mins} min`;
    };

    const isNearby = () => {
        if (!driverLocation || !user?.location) return false;
        return haversineDistance(driverLocation, user.location) < 0.3;
    };

    if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>{t('loading')}</div>;

    // View: Inside a Chat
    if (activeTab === 'chat' && selectedChat) {
        return <DirectChat conversation={selectedChat} onBack={() => { setSelectedChat(null); fetchInbox(); }} />;
    }

    return (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: 80, background: 'var(--bg-primary)' }}>
            
            {/* Top Toggle Bars */}
            <div style={{ padding: '16px 20px', background: 'var(--card-bg)', borderBottom: '1px solid var(--card-border)', display: 'flex', gap: 10, position: 'sticky', top: 0, zIndex: 50 }}>
                <button onClick={() => setActiveTab('tracking')} style={{ flex: 1, padding: '12px', borderRadius: 14, border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: activeTab === 'tracking' ? 'var(--brand-accent)' : 'var(--bg-secondary)', color: activeTab === 'tracking' ? '#fff' : 'var(--text-primary)' }}>
                    <MapPin size={18} /> Kuzatish
                </button>
                <button onClick={() => setActiveTab('chat')} style={{ flex: 1, padding: '12px', borderRadius: 14, border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: activeTab === 'chat' ? 'var(--brand-accent)' : 'var(--bg-secondary)', color: activeTab === 'chat' ? '#fff' : 'var(--text-primary)' }}>
                    <Navigation size={18} /> Chatlar {inbox.length > 0 && <span style={{ background: activeTab === 'chat' ? '#fff' : 'var(--brand-accent)', color: activeTab === 'chat' ? 'var(--brand-accent)' : '#fff', padding: '2px 8px', borderRadius: 10, fontSize: 11 }}>{inbox.length}</span>}
                </button>
            </div>

            {/* TAB: TRACKING */}
            {activeTab === 'tracking' && (
                <div style={{ animation: 'fadeIn 0.3s ease', display: 'flex', flexDirection: 'column' }}>
                    {!activeOrder ? (
                        <div style={{ padding: 20, textAlign: 'center', paddingTop: 60, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
                    ) : (
                        <div style={{ paddingTop: 16 }}>
                            <div style={{ padding: '0 20px', marginBottom: 16 }}>
                                <h2 style={{ color: "var(--text-primary)", fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 900, margin: '0 0 4px' }}>{t('live_tracking')} 📍</h2>
                                <p style={{ color: "var(--text-secondary)", fontSize: 12, margin: 0 }}>#{activeOrder.id?.toString().slice(0, 8)} · ₩{(activeOrder.totalAmount || 0).toLocaleString()}</p>
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
                            {estimateTime() && ['delivering', 'delivered_awaiting_review'].includes(activeOrder.status) && (
                                <div style={{ margin: '0 20px 12px', padding: '14px 18px', background: 'linear-gradient(135deg, var(--brand-accent), #FF3CAC)', borderRadius: 16, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: 11, opacity: 0.9 }}>{t('estimated_time')}</div>
                                        <div style={{ fontSize: 24, fontWeight: 900, fontFamily: "'Fraunces', serif" }}>{estimateTime()}</div>
                                    </div>
                                    <div style={{ fontSize: 40 }}>🛵</div>
                                </div>
                            )}

                            {/* Progress Steps */}
                            <div style={{ margin: '0 20px 16px', background: 'var(--card-bg)', borderRadius: 20, padding: '16px 20px', border: '1px solid var(--card-border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                                    {steps.map((s, i) => {
                                        const currentStep = getStatusStep(activeOrder.status);
                                        const done = i < currentStep;
                                        const active = i === currentStep - 1 || (currentStep === 0 && i === 0);
                                        return (
                                            <React.Fragment key={i}>
                                                <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: done ? 'var(--brand-accent)' : active ? 'rgba(255,107,53,0.2)' : 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: done ? '#fff' : 'inherit', border: active ? '2px solid var(--brand-accent)' : 'none' }}>
                                                    {done ? '✓' : s.icon}
                                                </div>
                                                {i < steps.length - 1 && <div style={{ flex: 1, height: 3, background: done ? 'var(--brand-accent)' : 'var(--bg-secondary)' }} />}
                                            </React.Fragment>
                                        );
                                    })}
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 15 }}>{steps[Math.min(getStatusStep(activeOrder.status) - 1, steps.length - 1)]?.label || t('preparing')}</div>
                                    <div style={{ color: 'var(--brand-accent)', fontSize: 12, marginTop: 4 }}>{t('in_progress')}</div>
                                </div>
                            </div>

                            {/* Confirm Delivery Button */}
                            {activeOrder.status === 'delivered_awaiting_review' && (
                                <div style={{ margin: '0 20px 16px' }}>
                                    <button onClick={confirmDelivery} style={{ width: '100%', padding: '16px', borderRadius: 16, border: 'none', background: '#27AE60', color: '#fff', fontWeight: 800, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 15px rgba(39,174,96,0.3)' }}>
                                        <CheckCircle size={20} /> {t('confirm_received')} (Yoqimli ishtaha!)
                                    </button>
                                </div>
                            )}

                            {/* Items */}
                            <div style={{ margin: '0 20px 16px', background: 'var(--card-bg)', borderRadius: 16, padding: 14, border: '1px solid var(--card-border)' }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>🛍 {t('items')} ({activeOrder.items?.length})</div>
                                {activeOrder.items?.map((item, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, color: 'var(--text-primary)' }}>
                                        <span>{item.productName || 'Item'} × {item.quantity}</span>
                                        <span style={{ color: 'var(--text-secondary)' }}>₩{((item.price || 0) * item.quantity).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB: CHAT LIST */}
            {activeTab === 'chat' && (
                <div style={{ animation: 'fadeIn 0.3s ease', padding: '16px 20px', flex: 1 }}>
                    <h2 style={{ color: "var(--text-primary)", fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 900, marginBottom: 16 }}>Suhbatlar</h2>
                    
                    {inbox.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
                            <div style={{ fontSize: 40, marginBottom: 10 }}>💬</div>
                            <div>Hozircha xabarlar yo'q</div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {inbox.map(conv => (
                                <div key={conv.id} onClick={() => setSelectedChat(conv)} style={{ display: 'flex', gap: 12, background: 'var(--card-bg)', padding: 14, borderRadius: 16, border: '1px solid var(--card-border)', cursor: 'pointer', alignItems: 'center' }}>
                                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: conv.type === 'dm' ? 'linear-gradient(135deg, var(--brand-accent), #FF3CAC)' : 'linear-gradient(135deg, #27AE60, #2ECC71)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                                        {conv.type === 'dm' ? '🛡️' : '🛵'}
                                    </div>
                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{conv.name}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', flexShrink: 0 }}>
                                                {new Date(conv.updatedAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {conv.lastMessage}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TrackPage;
