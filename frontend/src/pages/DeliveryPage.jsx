import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import api from '../utils/api';
import { Truck, Package, CheckCircle, MapPin, Camera, Image as ImageIcon, MessageSquare, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { io } from 'socket.io-client';
import StaffChat from './admin/StaffChat';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';
let socket = null;

const DeliveryPage = () => {
    const { t } = useTranslation();
    const { user } = useAppStore();

    // Core state
    const [orders, setOrders] = useState([]);
    const [activeOrder, setActiveOrder] = useState(null);
    const [stats, setStats] = useState({ totalDeliveries: 0, totalDistance: 0, totalEarnings: 0 });
    const [loading, setLoading] = useState(true);

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

    // Staff Chat UI
    const [showStaffChat, setShowStaffChat] = useState(false);

    const messagesEndRef = useRef(null);
    const chatFileInputRef = useRef(null);
    const deliveryPhotoRef = useRef(null);

    const fetchData = () => {
        // Fetch stats
        api.get('/delivery/stats').then(res => setStats(res.data)).catch(console.error);

        // Fetch active order OR available orders
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
                // Check if delivery prompt is already sent
                const isPromptSent = res.data.some(m => m.offerAction === 'confirm_delivery_prompt');
                if (isPromptSent) setPhotoSent(true);
                setLoading(false);
            })
            .catch(console.error);
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!socket) {
            socket = io(SOCKET_URL);
            socket.on('receive-message', (msg) => {
                setChatMessages(prev => [...prev, msg]);
            });
        }

        // Start watching geolocation
        const geoId = navigator.geolocation.watchPosition(
            (pos) => {
                const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setMyLocation(loc);
                if (activeOrder && socket) {
                    socket.emit('driver-location', { orderId: activeOrder.id, location: loc });
                }
            },
            (err) => console.error("Geolocation error:", err),
            { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
        );

        return () => navigator.geolocation.clearWatch(geoId);
    }, [activeOrder]);

    // Join room 
    useEffect(() => {
        if (activeOrder && socket) {
            socket.emit('join-room', `order_${activeOrder.id}`);
        }
    }, [activeOrder]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const handleAccept = async (order) => {
        try {
            await api.post(`/delivery/orders/${order.id}/accept`);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to accept');
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
        } catch (err) {
            alert('Failed to send message');
        } finally {
            setSendingChat(false);
        }
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
        } catch (err) {
            alert('Rasm yuklashda xatolik yuz berdi.');
        } finally {
            setUploadingPhoto(false);
        }
    };

    return (
        <div className="animate-slide-up" style={{ padding: '20px', paddingBottom: '90px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header & Stats Dashboard */}
            <div style={{ flexShrink: 0 }}>
                <h2 style={{ fontSize: '22px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-primary)', fontFamily: "'Fraunces', serif" }}>
                    <div style={{ background: 'var(--brand-accent2)', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(78,205,196,0.3)' }}>
                        <Truck size={18} color="white" />
                    </div>
                    {t('delivery_dashboard')}
                </h2>

                <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                    <div style={{ flex: 1, background: 'var(--card-bg)', borderRadius: 16, padding: 12, border: '1px solid var(--card-border)' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 11, fontWeight: 700 }}>Umumiy Km</div>
                        <div style={{ color: 'var(--brand-accent2)', fontSize: 16, fontWeight: 900, fontFamily: "'Fraunces', serif" }}>{stats.totalDistance.toFixed(1)}</div>
                    </div>
                    <div style={{ flex: 1, background: 'var(--card-bg)', borderRadius: 16, padding: 12, border: '1px solid var(--card-border)' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 11, fontWeight: 700 }}>Tugallangan</div>
                        <div style={{ color: 'var(--brand-accent2)', fontSize: 16, fontWeight: 900, fontFamily: "'Fraunces', serif" }}>{stats.totalDeliveries}</div>
                    </div>
                    <div style={{ flex: 1.5, background: 'var(--card-bg)', borderRadius: 16, padding: 12, border: '1px solid var(--card-border)' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 11, fontWeight: 700 }}>Hamyon</div>
                        <div style={{ color: 'var(--brand-accent)', fontSize: 16, fontWeight: 900, fontFamily: "'Fraunces', serif" }}>₩{stats.totalEarnings.toLocaleString()}</div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>{t('loading')}</div>
            ) : activeOrder ? (
                /* ACTIVE ORDER VIEW */
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                    {/* Order Details Card */}
                    <div style={{ background: 'linear-gradient(135deg, var(--brand-accent), #FF3CAC)', color: 'white', padding: '20px', borderRadius: '20px', marginBottom: '16px', boxShadow: '0 8px 24px rgba(255,107,53,0.3)', flexShrink: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: 800, letterSpacing: 1 }}>{t('active_delivery')}</span>
                            <span style={{ fontWeight: 800, fontSize: 14 }}>₩{activeOrder.totalAmount?.toLocaleString()}</span>
                        </div>

                        <div style={{ fontSize: 12, opacity: 0.9 }}>{activeOrder.user?.firstName}</div>
                        <p style={{ margin: '4px 0 16px', fontSize: '16px', fontWeight: 700, fontFamily: "'Fraunces', serif" }}>{activeOrder.user?.address}</p>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <a href={`tel:${activeOrder.user?.phone}`} style={{ flex: 1, background: 'rgba(255,255,255,0.2)', color: '#fff', textDecoration: 'none', padding: '10px', borderRadius: '12px', textAlign: 'center', fontWeight: 700, fontSize: '12px' }}>
                                📞 Aloqa
                            </a>
                            <a href={`https://map.kakao.com/link/to/${activeOrder.user?.address},${activeOrder.user?.location?.lat || 37.5503},${activeOrder.user?.location?.lng || 127.0731}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, background: '#FBEB00', color: '#000', textDecoration: 'none', padding: '10px', borderRadius: '12px', textAlign: 'center', fontWeight: 700, fontSize: '12px' }}>
                                🗺 KakaoMap
                            </a>
                        </div>
                    </div>

                    {/* Map for Driver */}
                    {activeOrder.user?.location && myLocation && (
                        <div style={{ height: 180, width: '100%', borderRadius: 16, overflow: 'hidden', marginBottom: 16, zIndex: 0, border: '1px solid var(--card-border)', flexShrink: 0 }}>
                            <MapContainer center={[myLocation.lat, myLocation.lng]} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                                <Marker position={[myLocation.lat, myLocation.lng]} icon={
                                    new L.DivIcon({ className: 'courier-icon', html: '<div style="font-size:24px; background:#fff; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(0,0,0,0.2); border: 2px solid #27AE60;">🛵</div>', iconSize: [32, 32] })
                                }>
                                    <Popup>Siz shu yerdasiz</Popup>
                                </Marker>
                                <Marker position={[activeOrder.user.location.lat, activeOrder.user.location.lng]} icon={
                                    new L.DivIcon({ className: 'home-icon', html: '<div style="font-size:24px; background:#fff; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(0,0,0,0.2); border: 2px solid #FF3CAC;">🏠</div>', iconSize: [32, 32] })
                                }>
                                    <Popup>Mijoz manzili</Popup>
                                </Marker>
                            </MapContainer>
                        </div>
                    )}

                    {/* AI / Chat System (User Context) */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--card-bg)', borderRadius: '20px', border: '1px solid var(--card-border)', overflow: 'hidden' }}>
                        <div style={{ padding: 10, borderBottom: '1px solid var(--card-border)', background: 'rgba(39,174,96,0.05)' }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-accent2)' }}>💬 Mijoz bilan chat</div>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {chatMessages.map(msg => {
                                const isMe = msg.senderId === user.id;
                                const isPrompt = msg.offerAction === 'confirm_delivery_prompt';
                                if (isPrompt) return null; // Don't show system prompt to driver

                                return (
                                    <div key={msg.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '85%', background: isMe ? 'var(--brand-accent2)' : 'var(--bg-secondary)', color: isMe ? '#fff' : 'var(--text-primary)', padding: 10, borderRadius: 14, borderBottomRightRadius: isMe ? 4 : 14, borderBottomLeftRadius: isMe ? 14 : 4 }}>
                                        {msg.imageUrl && (
                                            <img src={msg.imageUrl} alt="photo" style={{ width: '100%', borderRadius: 8, marginBottom: msg.text ? 6 : 0 }} />
                                        )}
                                        {msg.text && <div style={{ fontSize: 13, lineHeight: 1.4 }}>{msg.text}</div>}
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Delivery Photo / Chat Input */}
                        <div style={{ padding: 10, borderTop: '1px solid var(--card-border)', background: 'var(--bg-primary)' }}>
                            {photoSent ? (
                                <div style={{ textAlign: 'center', padding: 10, color: 'var(--brand-accent2)', fontWeight: 700, fontSize: 13, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                                    <CheckCircle size={16} /> Mijoz tasdiqlashi kutilmoqda...
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {/* Arrival Photo Button */}
                                    <input type="file" accept="image/*" capture="environment" ref={deliveryPhotoRef} onChange={handleUploadDeliveryPhoto} style={{ display: 'none' }} />
                                    <button onClick={() => deliveryPhotoRef.current?.click()} disabled={uploadingPhoto} style={{ width: '100%', padding: '12px', background: '#27AE60', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                                        {uploadingPhoto ? '⏳ Yuklanmoqda...' : <><Camera size={16} /> Yetib keldim, rasmni yuklash</>}
                                    </button>

                                    {/* Text Chat Input */}
                                    <form onSubmit={handleSendChatMessage} style={{ display: 'flex', gap: 8 }}>
                                        <input type="file" accept="image/*" ref={chatFileInputRef} onChange={e => setChatImage(e.target.files[0])} style={{ display: 'none' }} />
                                        <button type="button" onClick={() => chatFileInputRef.current?.click()} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--card-border)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: chatImage ? 'var(--brand-accent2)' : 'var(--text-secondary)', cursor: 'pointer', flexShrink: 0 }}>
                                            <ImageIcon size={18} />
                                        </button>
                                        <input
                                            value={newChatMsg} onChange={e => setNewChatMsg(e.target.value)}
                                            placeholder="Xabar..."
                                            style={{ flex: 1, background: 'var(--bg-secondary)', border: '1px solid var(--card-border)', borderRadius: 20, padding: '0 12px', color: 'var(--text-primary)', outline: 'none', fontSize: 14 }}
                                        />
                                        <button type="submit" disabled={sendingChat || (!newChatMsg.trim() && !chatImage)} style={{ background: 'var(--brand-accent2)', color: '#fff', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, opacity: (sendingChat || (!newChatMsg.trim() && !chatImage)) ? 0.5 : 1 }}>
                                            ↑
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                /* AVAILABLE ORDERS VIEW */
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)', fontSize: '18px' }}>{t('available_orders')} ({orders.length})</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {orders.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px' }}>
                                <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{t('no_orders')}</p>
                            </div>
                        ) : (
                            orders.map(order => (
                                <div key={order.id} style={{ padding: '20px', borderRadius: '20px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-main)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 900, fontSize: '20px', color: 'var(--brand-accent)', fontFamily: "'Fraunces', serif" }}>
                                            ₩{(order.totalAmount || 0).toLocaleString()}
                                        </span>
                                        <span style={{ color: 'var(--brand-accent2)', background: 'rgba(78,205,196,0.1)', padding: '6px 12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700 }}>
                                            <MapPin size={14} /> {(order.distance || 0).toFixed(1)} km
                                        </span>
                                    </div>
                                    <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 12, opacity: 0.9 }}>
                                        {order.user?.address}
                                    </div>
                                    <button
                                        onClick={() => handleAccept(order)}
                                        style={{ width: '100%', padding: '14px', borderRadius: '14px', border: 'none', background: 'var(--text-primary)', color: 'var(--bg-primary)', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                                    >
                                        {t('accept')}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Staff Chat FAB */}
            <button
                onClick={() => setShowStaffChat(true)}
                style={{
                    position: 'fixed', bottom: 90, right: 20, zIndex: 99,
                    width: 56, height: 56, borderRadius: 28,
                    background: 'var(--brand-accent2)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 14px rgba(78,205,196,0.4)', border: 'none', cursor: 'pointer'
                }}
            >
                <MessageSquare size={24} />
            </button>

            {/* Staff Chat Modal */}
            {showStaffChat && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', zIndex: 100,
                    display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
                }}>
                    <div style={{
                        width: '100%', maxWidth: 500, height: '80vh',
                        background: 'var(--bg-primary)', borderRadius: '20px 20px 0 0',
                        display: 'flex', flexDirection: 'column', overflow: 'hidden',
                        animation: 'slideUp 0.3s ease-out'
                    }}>
                        <div style={{ padding: 10, display: 'flex', justifyContent: 'flex-end', background: 'var(--card-bg)' }}>
                            <button onClick={() => setShowStaffChat(false)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            <StaffChat />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeliveryPage;
