import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import api from '../utils/api';
import { Truck, Package, CheckCircle, MapPin, Camera, Image as ImageIcon, MessageSquare, X, Phone, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { io } from 'socket.io-client';
import StaffChat from './admin/StaffChat';

const SOCKET_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';

// Restaurant location
const RESTAURANT = { lat: 37.5503, lng: 127.0731 };

const haversineDistance = (c1, c2) => {
    const R = 6371;
    const dLat = (c2.lat - c1.lat) * Math.PI / 180;
    const dLng = (c2.lng - c1.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(c1.lat * Math.PI / 180) * Math.cos(c2.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const DeliveryPage = () => {
    const { t } = useTranslation();
    const { user } = useAppStore();

    // Core state
    const [orders, setOrders] = useState([]);
    const [activeOrder, setActiveOrder] = useState(null);
    const [stats, setStats] = useState({ totalDeliveries: 0, totalDistance: 0, totalEarnings: 0 });
    const [loading, setLoading] = useState(true);

    // Toggle: 'map' or 'chat'
    const [viewMode, setViewMode] = useState('map');

    // Chat state
    const [chatMessages, setChatMessages] = useState([]);
    const [newChatMsg, setNewChatMsg] = useState('');
    const [chatImage, setChatImage] = useState(null);
    const [sendingChat, setSendingChat] = useState(false);

    // Photo Delivery State
    const [deliveryPhoto, setDeliveryPhoto] = useState(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [photoSent, setPhotoSent] = useState(false);

    // Geolocation state
    const [myLocation, setMyLocation] = useState(null);
    const [totalTripKm, setTotalTripKm] = useState(0);
    const [notifiedNearby, setNotifiedNearby] = useState(false);

    // Staff Chat UI
    const [showStaffChat, setShowStaffChat] = useState(false);

    const messagesEndRef = useRef(null);
    const chatFileInputRef = useRef(null);
    const deliveryPhotoRef = useRef(null);
    const socketRef = useRef(null);
    const prevLocationRef = useRef(null);
    const geoWatchIdRef = useRef(null);

    const fetchData = () => {
        api.get('/delivery/stats').then(res => setStats(res.data)).catch(console.error);

        api.get('/delivery/active').then(res => {
            if (res.data) {
                setActiveOrder(res.data);
                fetchChat(res.data.id);
            } else {
                setActiveOrder(null);
                api.get('/delivery/orders/available')
                    .then(availRes => setOrders(availRes.data || []))
                    .catch(console.error)
                    .finally(() => setLoading(false));
            }
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    };

    const fetchChat = (orderId) => {
        api.get(`/orders/${orderId}/chat`)
            .then(res => {
                setChatMessages(res.data || []);
                const isPromptSent = res.data.some(m => m.offerAction === 'confirm_delivery_prompt');
                if (isPromptSent) setPhotoSent(true);
                setLoading(false);
            })
            .catch(console.error);
    };

    // Keep activeOrder in a ref so geolocation callback can access latest value
    const activeOrderRef = useRef(null);
    const notifiedNearbyRef = useRef(false);
    useEffect(() => { activeOrderRef.current = activeOrder; }, [activeOrder]);
    useEffect(() => { notifiedNearbyRef.current = notifiedNearby; }, [notifiedNearby]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    // Socket.IO — separate from geolocation
    useEffect(() => {
        const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
        socketRef.current = socket;
        socket.on('receive-message', (msg) => {
            setChatMessages(prev => [...prev, msg]);
        });
        return () => { socket.disconnect(); };
    }, []);

    // Geolocation — one-time persistent permission, never re-created
    useEffect(() => {
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setMyLocation(loc);

                // Track distance traveled
                if (prevLocationRef.current) {
                    const delta = haversineDistance(prevLocationRef.current, loc);
                    if (delta > 0.01) { // filter noise, min 10m
                        setTotalTripKm(prev => prev + delta);
                    }
                }
                prevLocationRef.current = loc;

                // Send location to order room using ref for latest activeOrder
                const order = activeOrderRef.current;
                if (order && socketRef.current?.connected) {
                    socketRef.current.emit('driver-location', {
                        room: `order_${order.id}`,
                        orderId: order.id,
                        location: loc
                    });
                }

                // Proximity check — auto-notify when within 300m
                if (order?.user?.location && !notifiedNearbyRef.current) {
                    const distToUser = haversineDistance(loc, order.user.location);
                    if (distToUser < 0.3) {
                        setNotifiedNearby(true);
                        api.post(`/orders/${order.id}/notify-nearby`).catch(() => {});
                    }
                }
            },
            (err) => console.error("Geolocation error:", err),
            { enableHighAccuracy: true, maximumAge: 10000, timeout: 30000 }
        );
        geoWatchIdRef.current = watchId;

        return () => {
            navigator.geolocation.clearWatch(watchId);
            geoWatchIdRef.current = null;
        };
    }, []); // Empty dependency = runs once, never re-created

    // Join room
    useEffect(() => {
        if (activeOrder && socketRef.current) {
            socketRef.current.emit('join-room', `order_${activeOrder.id}`);
        }
    }, [activeOrder]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const handleAccept = async (order) => {
        try {
            await api.post(`/delivery/orders/${order.id}/accept`);
            setTotalTripKm(0);
            setNotifiedNearby(false);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || 'Qabul qilib bo\'lmadi');
        }
    };

    const handleSendChatMessage = async (e) => {
        e.preventDefault();
        if ((!newChatMsg.trim() && !chatImage) || sendingChat || !activeOrder) return;

        setSendingChat(true);
        try {
            const formData = new FormData();
            if (chatImage) formData.append('image', chatImage);
            if (newChatMsg.trim()) formData.append('text', newChatMsg);
            await api.post(`/orders/${activeOrder.id}/chat`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setNewChatMsg('');
            setChatImage(null);
            fetchChat(activeOrder.id);
        } catch (err) { alert('Xabar yuborib bo\'lmadi'); }
        finally { setSendingChat(false); }
    };

    const handleUploadDeliveryPhoto = async (e) => {
        const file = e.target.files[0];
        if (!file || !activeOrder) return;

        setUploadingPhoto(true);
        try {
            const formData = new FormData();
            formData.append('photo', file);
            await api.post(`/orders/${activeOrder.id}/delivery-photo`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setPhotoSent(true);
            fetchChat(activeOrder.id);
            alert("Rasm yuborildi! Mijoz tasdiqlashini kuting.");
        } catch (err) { alert('Rasm yuklashda xatolik yuz berdi.'); }
        finally { setUploadingPhoto(false); }
    };

    // Estimate delivery time using distance
    const estimateTime = () => {
        if (!myLocation || !activeOrder?.user?.location) return null;
        const dist = haversineDistance(myLocation, activeOrder.user.location);
        const mins = Math.round(dist / 0.5 * 3);
        return mins < 1 ? '1' : `${mins}`;
    };

    // Trip earnings at ₩1,000 per km
    const tripEarnings = Math.round(totalTripKm * 1000);

    return (
        <div className="animate-slide-up" style={{ padding: '16px 20px', paddingBottom: '90px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header & Stats Dashboard */}
            <div style={{ flexShrink: 0 }}>
                <h2 style={{ fontSize: '22px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-primary)', fontFamily: "'Fraunces', serif" }}>
                    <div style={{ background: 'var(--brand-accent2)', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(78,205,196,0.3)' }}>
                        <Truck size={18} color="white" />
                    </div>
                    {t('delivery_dashboard')}
                </h2>

                {/* Stats Cards */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    <div style={{ flex: 1, background: 'var(--card-bg)', borderRadius: 14, padding: '10px 12px', border: '1px solid var(--card-border)' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 10, fontWeight: 700 }}>{t('total_km')}</div>
                        <div style={{ color: 'var(--brand-accent2)', fontSize: 16, fontWeight: 900, fontFamily: "'Fraunces', serif" }}>{stats.totalDistance?.toFixed(1) || 0}</div>
                    </div>
                    <div style={{ flex: 1, background: 'var(--card-bg)', borderRadius: 14, padding: '10px 12px', border: '1px solid var(--card-border)' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 10, fontWeight: 700 }}>{t('completed_deliveries')}</div>
                        <div style={{ color: 'var(--brand-accent2)', fontSize: 16, fontWeight: 900, fontFamily: "'Fraunces', serif" }}>{stats.totalDeliveries || 0}</div>
                    </div>
                    <div style={{ flex: 1.3, background: 'var(--card-bg)', borderRadius: 14, padding: '10px 12px', border: '1px solid var(--card-border)' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 10, fontWeight: 700 }}>{t('earnings')}</div>
                        <div style={{ color: 'var(--brand-accent)', fontSize: 16, fontWeight: 900, fontFamily: "'Fraunces', serif" }}>₩{(stats.totalEarnings || 0).toLocaleString()}</div>
                    </div>
                </div>

                {/* Current Trip Earning (only when active) */}
                {activeOrder && (
                    <div style={{ background: 'linear-gradient(135deg, rgba(78,205,196,0.1), rgba(78,205,196,0.02))', border: '1px solid rgba(78,205,196,0.2)', borderRadius: 14, padding: '10px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700 }}>🛵 Bu safar ({t('earning_per_km')})</div>
                            <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--brand-accent2)', display: 'flex', alignItems: 'baseline', gap: 6 }}>
                                {totalTripKm.toFixed(1)} km
                                <span style={{ fontSize: 16, color: 'var(--brand-accent)' }}>= ₩{tripEarnings.toLocaleString()}</span>
                            </div>
                        </div>
                        {estimateTime() && (
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>⏱ Taxminiy</div>
                                <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--brand-accent)', fontFamily: "'Fraunces', serif" }}>{estimateTime()} min</div>
                            </div>
                        )}
                    </div>
                )}

                {/* Toggle: Map / Chat (only when active order) */}
                {activeOrder && (
                    <div style={{ display: 'flex', gap: 6, marginBottom: 16, background: 'var(--bg-secondary)', borderRadius: 12, padding: 4 }}>
                        {[
                            { id: 'map', icon: '🗺', label: t('map_view') },
                            { id: 'chat', icon: '💬', label: t('chat_view') }
                        ].map(m => (
                            <button key={m.id} onClick={() => setViewMode(m.id)} style={{
                                flex: 1, padding: '10px', borderRadius: 10, border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                                background: viewMode === m.id ? 'var(--brand-accent)' : 'transparent',
                                color: viewMode === m.id ? '#fff' : 'var(--text-secondary)',
                                transition: 'all 0.2s'
                            }}>
                                {m.icon} {m.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>{t('loading')}</div>
            ) : activeOrder ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                    {/* Active Order Card */}
                    <div style={{ background: 'linear-gradient(135deg, var(--brand-accent), #FF3CAC)', color: 'white', padding: '16px', borderRadius: '18px', marginBottom: '12px', boxShadow: '0 8px 24px rgba(255,107,53,0.3)', flexShrink: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: '16px', fontSize: '10px', fontWeight: 800 }}>{t('active_delivery')}</span>
                            <span style={{ fontWeight: 800, fontSize: 14 }}>₩{activeOrder.totalAmount?.toLocaleString()}</span>
                        </div>
                        <div style={{ fontSize: 12, opacity: 0.9 }}>👤 {activeOrder.user?.firstName} · 📞 {activeOrder.user?.phone}</div>
                        <p style={{ margin: '4px 0 12px', fontSize: '15px', fontWeight: 700 }}>📍 {activeOrder.user?.address}</p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <a href={`tel:${activeOrder.user?.phone}`} style={{ flex: 1, background: 'rgba(255,255,255,0.2)', color: '#fff', textDecoration: 'none', padding: '10px', borderRadius: '12px', textAlign: 'center', fontWeight: 700, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                <Phone size={14} /> Qo'ng'iroq
                            </a>
                            <a href={`https://map.kakao.com/link/to/${encodeURIComponent(activeOrder.user?.address || '')},${activeOrder.user?.location?.lat || 37.5503},${activeOrder.user?.location?.lng || 127.0731}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, background: '#FBEB00', color: '#000', textDecoration: 'none', padding: '10px', borderRadius: '12px', textAlign: 'center', fontWeight: 700, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                <Navigation size={14} /> KakaoMap
                            </a>
                        </div>
                    </div>

                    {/* MAP VIEW */}
                    {viewMode === 'map' && (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {activeOrder.user?.location && myLocation && (
                                <div style={{ height: 220, width: '100%', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--card-border)', flexShrink: 0 }}>
                                    <MapContainer center={[myLocation.lat, myLocation.lng]} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                                        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                                        <Marker position={[myLocation.lat, myLocation.lng]} icon={
                                            new L.DivIcon({ className: 'courier-icon', html: '<div style="font-size:24px; background:#fff; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(0,0,0,0.2); border: 2px solid #27AE60;">🛵</div>', iconSize: [32, 32] })
                                        }>
                                            <Popup>Men shu yerdaman</Popup>
                                        </Marker>
                                        <Marker position={[activeOrder.user.location.lat, activeOrder.user.location.lng]} icon={
                                            new L.DivIcon({ className: 'home-icon', html: '<div style="font-size:24px; background:#fff; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(0,0,0,0.2); border: 2px solid #FF3CAC;">🏠</div>', iconSize: [32, 32] })
                                        }>
                                            <Popup>Mijoz manzili</Popup>
                                        </Marker>
                                    </MapContainer>
                                </div>
                            )}

                            {/* Delivery Photo & Complete */}
                            <div style={{ display: 'flex', gap: 8 }}>
                                <input type="file" accept="image/*" capture="environment" ref={deliveryPhotoRef} onChange={handleUploadDeliveryPhoto} style={{ display: 'none' }} />
                                {!photoSent ? (
                                    <button onClick={() => deliveryPhotoRef.current?.click()} disabled={uploadingPhoto} style={{ flex: 1, padding: '14px', background: '#27AE60', color: '#fff', border: 'none', borderRadius: 14, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                                        {uploadingPhoto ? '⏳ Yuklanmoqda...' : <><Camera size={16} /> Yetib keldim, rasm</>}
                                    </button>
                                ) : (
                                    <div style={{ flex: 1, padding: '14px', textAlign: 'center', color: 'var(--brand-accent2)', fontWeight: 700, fontSize: 13, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, background: 'var(--card-bg)', borderRadius: 14, border: '1px solid var(--card-border)' }}>
                                        <CheckCircle size={16} /> Mijoz tasdiqlashi kutilmoqda
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* CHAT VIEW */}
                    {viewMode === 'chat' && (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--card-bg)', borderRadius: '18px', border: '1px solid var(--card-border)', overflow: 'hidden' }}>
                            <div style={{ padding: 10, borderBottom: '1px solid var(--card-border)', background: 'rgba(39,174,96,0.05)' }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand-accent2)' }}>💬 {activeOrder.user?.firstName} bilan chat</div>
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {chatMessages.length === 0 && (
                                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 12, padding: 20 }}>Mijozga xabar yozing yoki rasm yuboring.</div>
                                )}
                                {chatMessages.map(msg => {
                                    const isMe = msg.senderId === user?.id;
                                    const isPrompt = msg.offerAction === 'confirm_delivery_prompt';
                                    if (isPrompt) return null;

                                    return (
                                        <div key={msg.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%', background: isMe ? 'var(--brand-accent2)' : 'var(--bg-secondary)', color: isMe ? '#fff' : 'var(--text-primary)', padding: 10, borderRadius: 14, borderBottomRightRadius: isMe ? 4 : 14, borderBottomLeftRadius: isMe ? 14 : 4 }}>
                                            {msg.imageUrl && <img src={msg.imageUrl} alt="" style={{ width: '100%', borderRadius: 8, marginBottom: msg.text ? 6 : 0 }} />}
                                            {msg.text && <div style={{ fontSize: 13, lineHeight: 1.4 }}>{msg.text}</div>}
                                            <div style={{ fontSize: 9, opacity: 0.6, textAlign: 'right', marginTop: 3 }}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            <div style={{ padding: 8, borderTop: '1px solid var(--card-border)', background: 'var(--bg-primary)' }}>
                                <form onSubmit={handleSendChatMessage} style={{ display: 'flex', gap: 8 }}>
                                    <input type="file" accept="image/*" ref={chatFileInputRef} onChange={e => setChatImage(e.target.files?.[0])} style={{ display: 'none' }} />
                                    <button type="button" onClick={() => chatFileInputRef.current?.click()} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--card-border)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: chatImage ? 'var(--brand-accent2)' : 'var(--text-secondary)', cursor: 'pointer', flexShrink: 0 }}>
                                        <ImageIcon size={16} />
                                    </button>
                                    <input value={newChatMsg} onChange={e => setNewChatMsg(e.target.value)} placeholder="Xabar..." style={{ flex: 1, background: 'var(--bg-secondary)', border: '1px solid var(--card-border)', borderRadius: 20, padding: '0 12px', color: 'var(--text-primary)', outline: 'none', fontSize: 13, height: 36 }} />
                                    <button type="submit" disabled={sendingChat || (!newChatMsg.trim() && !chatImage)} style={{ background: 'var(--brand-accent2)', color: '#fff', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, opacity: (sendingChat || (!newChatMsg.trim() && !chatImage)) ? 0.5 : 1 }}>↑</button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* AVAILABLE ORDERS VIEW */
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)', fontSize: '18px' }}>{t('available_orders')} ({orders.length})</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {orders.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px' }}>
                                <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{t('no_orders')}</p>
                            </div>
                        ) : (
                            orders.map(order => {
                                const distFromRestaurant = order.distance || 0;
                                const estimatedMins = Math.round(distFromRestaurant / 0.5 * 3);
                                const estimatedEarning = Math.round(distFromRestaurant * 2 * 1000); // round trip

                                return (
                                    <div key={order.id} style={{ padding: '16px', borderRadius: '18px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-main)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                                            <span style={{ fontWeight: 900, fontSize: '18px', color: 'var(--brand-accent)', fontFamily: "'Fraunces', serif" }}>
                                                ₩{(order.totalAmount || 0).toLocaleString()}
                                            </span>
                                            <span style={{ color: 'var(--brand-accent2)', background: 'rgba(78,205,196,0.1)', padding: '5px 10px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700 }}>
                                                <MapPin size={12} /> {distFromRestaurant.toFixed(1)} km
                                            </span>
                                        </div>
                                        <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 6 }}>📍 {order.user?.address}</div>
                                        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                                            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>⏱ ~{estimatedMins} min</div>
                                            <div style={{ fontSize: 11, color: 'var(--brand-accent)', fontWeight: 700 }}>💰 ~₩{estimatedEarning.toLocaleString()}</div>
                                        </div>
                                        <button onClick={() => handleAccept(order)} style={{ width: '100%', padding: '12px', borderRadius: '14px', border: 'none', background: 'var(--text-primary)', color: 'var(--bg-primary)', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                                            {t('accept')} 🛵
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* Staff Chat FAB */}
            <button onClick={() => setShowStaffChat(true)} style={{ position: 'fixed', bottom: 90, right: 20, zIndex: 99, width: 52, height: 52, borderRadius: 26, background: 'var(--brand-accent2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(78,205,196,0.4)', border: 'none', cursor: 'pointer' }}>
                <MessageSquare size={22} />
            </button>

            {/* Staff Chat Modal */}
            {showStaffChat && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                    <div style={{ width: '100%', maxWidth: 500, height: '80vh', background: 'var(--bg-primary)', borderRadius: '20px 20px 0 0', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'slideUp 0.3s ease-out' }}>
                        <div style={{ padding: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card-bg)', borderBottom: '1px solid var(--card-border)' }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>👥 {t('staff_chat')}</span>
                            <button onClick={() => setShowStaffChat(false)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}><X size={22} /></button>
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}><StaffChat /></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeliveryPage;
