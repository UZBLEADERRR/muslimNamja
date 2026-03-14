import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import api from '../utils/api';
import { CheckCircle, MapPin, Navigation, Package, Store, MapPinned } from 'lucide-react';
import { RESTAURANT_ADDRESS, RESTAURANT_COORD } from '../utils/constants';
import { io } from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import DirectChat from '../components/DirectChat';

// Fix typical Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

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
    const location = useLocation();
    
    // Auto-switch to chat tab if URL has ?tab=chat
    const urlTab = new URLSearchParams(location.search).get('tab');
    const [activeTab, setActiveTab] = useState(urlTab === 'chat' ? 'chat' : 'tracking');
    
    useEffect(() => {
        if (urlTab === 'chat') {
            setActiveTab('chat');
        } else if (urlTab === 'tracking') {
            setActiveTab('tracking');
        }
    }, [urlTab]);

    const [activeOrders, setActiveOrders] = useState([]);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [driverLocation, setDriverLocation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paymentRequests, setPaymentRequests] = useState([]);

    // Chat List
    const [inbox, setInbox] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);

    const fetchOrder = async () => {
        try {
            const res = await api.get('/orders/my');
            const orders = res.data || [];
            const actives = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
            setActiveOrders(actives);
            if (actives.length > 0 && !selectedOrderId) {
                setSelectedOrderId(actives[0].id);
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchPayments = async () => {
        try {
            const res = await api.get('/users/history');
            const pending = (res.data?.paymentRequests || []).filter(p => p.status === 'pending');
            setPaymentRequests(pending);
        } catch (err) { console.error(err); }
    };

    const fetchInbox = async () => {
        try {
            const res = await api.get('/inbox');
            setInbox(res.data || []);
        } catch (err) { console.error('Inbox fetch error:', err); }
    };

    const activeOrder = activeOrders.find(o => o.id === selectedOrderId) || activeOrders[0];

    useEffect(() => {
        if (!user) { setLoading(false); return; }

        fetchOrder();
        fetchInbox();
        fetchPayments();
        const interval = setInterval(() => {
            fetchOrder();
            fetchPayments();
            if (activeTab === 'chat' && !selectedChat) fetchInbox();
        }, 12000);

        const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
        
        if (activeOrder) {
            socket.emit('join-room', `order_${activeOrder.id}`);
            // Fetch initial driver location for any active order status
            api.get(`/orders/${activeOrder.id}/location`)
                .then(res => { if (res.data) setDriverLocation(res.data); })
                .catch(() => null);
                
            // Also try tracking endpoint
            api.get(`/orders/${activeOrder.id}/tracking`)
                .then(res => { if (res.data?.driverLocation) setDriverLocation(res.data.driverLocation); })
                .catch(() => null);

            socket.on('location-updated', (loc) => {
                setDriverLocation(loc);
            });

            // Share CUSTOMER'S location with driver
            // Optimized: Ask once per mount, or use stored location
            const shareLocation = (coords) => {
                socket.emit('customer-location', { 
                    room: `order_${activeOrder.id}`, 
                    location: coords 
                });
            };

            if (activeOrder.status === 'delivering' || activeOrder.status === 'ready_for_pickup') {
                if (user?.location) {
                    shareLocation(user.location);
                } else if (navigator.geolocation) {
                    // Ask once and store in session state to avoid re-asking on this mount
                    navigator.geolocation.getCurrentPosition(
                        (pos) => {
                            const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                            shareLocation(coords);
                        },
                        (err) => console.error("One-time location error:", err),
                        { enableHighAccuracy: false, timeout: 10000 }
                    );
                }
            }
        }

        return () => {
            socket.disconnect();
        };
    }, [user, activeTab, selectedChat, activeOrder?.id]);

    const confirmDelivery = async (orderId) => {
        const idToConfirm = orderId || selectedOrderId;
        if (!idToConfirm) return;
        
        if (!window.confirm("Rostdan ham taomni qabul qildingizmi?")) return;
        try {
            await api.post(`/orders/${idToConfirm}/confirm-delivery`);
            alert("Tasdiqlandi! Yoqimli ishtaha! 🍽️");
            fetchOrder();
        } catch (err) { 
            console.error('Confirmation error:', err);
            alert(err.response?.data?.error || 'Tasdiqlashda xatolik'); 
        }
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
        <div className="animate-slide-up hide-scrollbar" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto', paddingBottom: 100, background: 'var(--bg-primary)' }}>
            
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
                    {paymentRequests.length > 0 && (
                        <div style={{ padding: '20px 20px 0' }}>
                            <div style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: 16, marginBottom: 12 }}>⏳ To'lov so'rovlari</div>
                            {paymentRequests.map(pr => (
                                <div key={pr.id} style={{ background: 'var(--card-bg)', borderRadius: 16, padding: 14, border: '1px solid var(--brand-accent2)', marginBottom: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Deposit so'rovi</div>
                                        <div style={{ color: 'var(--brand-accent2)', fontWeight: 800 }}>₩{pr.amount?.toLocaleString()}</div>
                                    </div>
                                    {pr.imageUrl && (
                                        <img 
                                            src={pr.imageUrl.startsWith('http') ? pr.imageUrl : `${SOCKET_URL}${pr.imageUrl}`} 
                                            alt="screenshot" 
                                            style={{ width: '100%', borderRadius: 20, marginBottom: 12, maxHeight: 400, objectFit: 'contain', background: '#000', border: '1px solid rgba(255,255,255,0.1)' }} 
                                        />
                                    )}
                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Kutilmoqda... Admin tasdiqlashi bilan hamyoningiz to'ldiriladi.</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeOrders.length === 0 ? (
                        <div style={{ padding: 20, textAlign: 'center', paddingTop: 60, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            {paymentRequests.length === 0 && (
                                <>
                                    <div style={{ position: 'relative', width: 160, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                                        <div style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', border: '2px solid rgba(255,107,53,0.1)', animation: 'pulse-ring 2s ease infinite' }} />
                                        <div style={{ position: 'absolute', width: '70%', height: '70%', borderRadius: '50%', border: '2px solid rgba(255,107,53,0.3)', animation: 'pulse-ring 2s ease infinite 0.5s' }} />
                                        <div style={{ zIndex: 10, background: 'var(--card-bg)', padding: 20, borderRadius: '50%', boxShadow: '0 8px 32px rgba(255,107,53,0.2)' }}>
                                            <div style={{ fontSize: 48 }}>📍</div>
                                        </div>
                                    </div>
                                    <h3 style={{ color: "var(--text-primary)", fontFamily: "'Fraunces', serif", fontSize: 22, marginBottom: 8 }}>{t('live_tracking')}</h3>
                                    <p style={{ color: "var(--text-secondary)", fontSize: 14, maxWidth: 250, lineHeight: 1.5 }}>{t('no_active_order')}</p>
                                </>
                            )}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 30, paddingBottom: 40 }}>
                            {activeOrders.map((order, idx) => {
                                const isNearby = () => {
                                    if (!driverLocation || !user?.location) return false;
                                    const d = haversineDistance(driverLocation, user.location);
                                    return d < 0.3; // 300 meters
                                };

                                const estimateTime = () => {
                                    if (!driverLocation || !user?.location) return null;
                                    const d = haversineDistance(driverLocation, user.location);
                                    const mins = Math.ceil((d / 20) * 60) + 2; 
                                    return `${mins} min`;
                                };

                                const getDestinationAddress = () => {
                                    if (order.deliveryType === 'pickup') return RESTAURANT_ADDRESS;
                                    if (order.deliveryType === 'meetup') return order.meetupLocation || 'Meetup joyi';
                                    return user?.address || 'Manzil ko\'rsatilmagan';
                                };

                                const getDestinationCoord = () => {
                                    if (order.deliveryType === 'pickup') return RESTAURANT_COORD;
                                    return user?.location || RESTAURANT_COORD;
                                };

                                return (
                                    <div key={order.id} style={{ display: 'flex', flexDirection: 'column', borderBottom: idx < activeOrders.length - 1 ? '8px solid var(--bg-secondary)' : 'none', paddingBottom: 20 }}>
                                        <div style={{ padding: '20px 20px 16px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                                <h2 style={{ color: "var(--text-primary)", fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 900, margin: 0 }}>{t('live_tracking')} {idx + 1} 📍</h2>
                                                <span style={{ background: 'var(--brand-accent)', color: '#fff', padding: '4px 10px', borderRadius: 10, fontSize: 10, fontWeight: 800 }}>Faol</span>
                                            </div>
                                            <p style={{ color: "var(--text-secondary)", fontSize: 12, margin: 0 }}>#{order.id?.toString().slice(0, 8)} · ₩{(order.totalAmount || 0).toLocaleString()} · {t(order.deliveryType)}</p>
                                        </div>

                                        {/* Destination Address */}
                                        <div style={{ margin: '0 20px 20px', padding: 16, background: 'var(--card-bg)', borderRadius: 20, border: '1px solid var(--card-border)', boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                                                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--brand-accent2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                                    {order.deliveryType === 'pickup' ? <Store size={20} /> : <MapPinned size={20} />}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{order.deliveryType === 'pickup' ? "Olib ketish manzili" : "Yetkazish manzili"}</div>
                                                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>{getDestinationAddress()}</div>
                                                </div>
                                            </div>
                                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', paddingLeft: 52 }}>
                                                {order.deliveryType === 'pickup' ? "Iltimos, tayyor bo'lgach ushbu manzildan olib keting." : "Kuryer ushbu manzilga yetkazib beradi."}
                                            </div>
                                        </div>

                                        {/* ETA / Nearby */}
                                        {isNearby() && (
                                            <div style={{ margin: '0 20px 12px', padding: '12px 16px', background: 'rgba(39,174,96,0.1)', border: '1px solid rgba(39,174,96,0.3)', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <span style={{ fontSize: 24 }}>🎉</span>
                                                <div>
                                                    <div style={{ color: '#27AE60', fontWeight: 800, fontSize: 14 }}>{t('driver_nearby')}</div>
                                                    <div style={{ color: 'var(--text-secondary)', fontSize: 11 }}>Kuryer tez orada yetib keladi!</div>
                                                </div>
                                            </div>
                                        )}

                                        {estimateTime() && ['delivering', 'delivered_awaiting_review'].includes(order.status) && (
                                            <div style={{ margin: '0 20px 12px', padding: '14px 18px', background: 'linear-gradient(135deg, var(--brand-accent), #FF3CAC)', borderRadius: 16, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontSize: 11, opacity: 0.9 }}>{t('estimated_time')}</div>
                                                    <div style={{ fontSize: 24, fontWeight: 900, fontFamily: "'Fraunces', serif" }}>{estimateTime()}</div>
                                                </div>
                                                <div style={{ fontSize: 40 }}>🛵</div>
                                            </div>
                                        )}

                                        {/* Map */}
                                        {user?.location && (
                                            <div style={{ margin: '0 20px 16px', height: 250, borderRadius: 20, overflow: 'hidden', border: '1px solid var(--card-border)', background: '#eee' }}>
                                                <MapContainer center={driverLocation && idx === 0 ? [driverLocation.lat, driverLocation.lng] : [getDestinationCoord().lat, getDestinationCoord().lng]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false} dragging={false} touchZoom={false} scrollWheelZoom={false}>
                                                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                                                    
                                                    {driverLocation && idx === 0 && (
                                                        <Polyline positions={[
                                                            [driverLocation.lat, driverLocation.lng],
                                                            [getDestinationCoord().lat, getDestinationCoord().lng]
                                                        ]} color="#e74c3c" weight={4} dashArray="8, 8" opacity={0.7} />
                                                    )}

                                                    {driverLocation && idx === 0 && (
                                                        <Marker position={[driverLocation.lat, driverLocation.lng]} icon={
                                                            new L.DivIcon({ className: 'courier-icon', html: '<div style="font-size:20px; background:#fff; border-radius:50%; width:30px; height:30px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(0,0,0,0.2); border: 2px solid #27AE60;">🛵</div>', iconSize: [30, 30] })
                                                        } />
                                                    )}

                                                    <Marker position={[getDestinationCoord().lat, getDestinationCoord().lng]} icon={
                                                        new L.DivIcon({ className: 'home-icon', html: `<div style="font-size:20px; background:#fff; border-radius:50%; width:30px; height:30px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(0,0,0,0.2); border: 2px solid ${order.deliveryType === 'pickup' ? 'var(--brand-accent2)' : '#FF3CAC'};">${order.deliveryType === 'pickup' ? '🍱' : '🏠'}</div>`, iconSize: [30, 30] })
                                                    } />
                                                </MapContainer>
                                            </div>
                                        )}

                                        {/* Progress Steps */}
                                        <div style={{ margin: '0 20px 16px', background: 'var(--card-bg)', borderRadius: 20, padding: '16px 20px', border: '1px solid var(--card-border)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                                                {steps.map((s, i) => {
                                                    const currentStep = getStatusStep(order.status);
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
                                                <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 15 }}>{steps[Math.min(getStatusStep(order.status) - 1, steps.length - 1)]?.label || t('preparing')}</div>
                                                <div style={{ color: 'var(--brand-accent)', fontSize: 12, marginTop: 4 }}>{t('in_progress')}</div>
                                            </div>
                                        </div>

                                        {/* Confirm Delivery Button */}
                                        {order.status === 'delivered_awaiting_review' && (
                                            <div style={{ margin: '0 20px 16px' }}>
                                                <button onClick={() => confirmDelivery(order.id)} style={{ width: '100%', padding: '16px', borderRadius: 16, border: 'none', background: '#27AE60', color: '#fff', fontWeight: 800, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 15px rgba(39,174,96,0.3)' }}>
                                                    <CheckCircle size={20} /> {t('confirm_received')} (Yoqimli ishtaha!)
                                                </button>
                                            </div>
                                        )}

                                        {/* Items */}
                                        <div style={{ margin: '0 20px 0', background: 'var(--card-bg)', borderRadius: 16, padding: 14, border: '1px solid var(--card-border)' }}>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>🛍 {t('items')} ({order.items?.length})</div>
                                            {order.items?.map((item, i) => (
                                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, color: 'var(--text-primary)' }}>
                                                    <span>{item.productName || 'Item'} × {item.quantity}</span>
                                                    <span style={{ color: 'var(--text-secondary)' }}>₩{((item.price || 0) * item.quantity).toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* TAB: CHAT LIST */}
            {activeTab === 'chat' && (
                <div style={{ animation: 'fadeIn 0.3s ease', padding: '16px 20px', flex: 1 }}>
                    <h2 style={{ color: "var(--text-primary)", fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 900, marginBottom: 16 }}>Suhbatlar</h2>
                    
                    {/* Always show Help Center button */}
                    <div
                        onClick={async () => {
                            // Find or create a DM with admin
                            if (inbox.find(c => c.name?.includes('Yordam'))) {
                                setSelectedChat(inbox.find(c => c.name?.includes('Yordam')));
                            } else {
                                try {
                                    const res = await api.get('/inbox');
                                    const adminChat = (res.data || []).find(c => c.name?.includes('Yordam') || c.name?.includes('Support'));
                                    if (adminChat) {
                                        setSelectedChat(adminChat);
                                    } else {
                                        // Create new by fetching inbox which auto-adds admin
                                        fetchInbox();
                                        alert('Yordam markazi ochildi. Iltimos, qayta urinib ko\'ring.');
                                    }
                                } catch (e) { console.error(e); }
                            }
                        }}
                        style={{ display: 'flex', gap: 12, background: 'linear-gradient(135deg, var(--brand-accent), #FF3CAC)', padding: 14, borderRadius: 16, cursor: 'pointer', alignItems: 'center', marginBottom: 16, boxShadow: '0 4px 14px rgba(255,107,53,0.3)' }}
                    >
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                            🛡️
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 800, fontSize: 15, color: '#fff' }}>Yordam Markazi (Support)</div>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>Admin bilan bog'laning</div>
                        </div>
                    </div>

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
