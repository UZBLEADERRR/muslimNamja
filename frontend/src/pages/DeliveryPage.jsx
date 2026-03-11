import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import api from '../utils/api';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Truck, MapPin, CheckCircle, Navigation, Camera, MessageSquare, Phone, Map, Wallet } from 'lucide-react';
import DirectChat from '../components/DirectChat';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';

// Fix typical Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const RESTAURANT = { lat: 37.5503, lng: 127.0731 };

const haversineDistance = (c1, c2) => {
    const R = 6371; // km
    const dLat = (c2.lat - c1.lat) * Math.PI / 180;
    const dLng = (c2.lng - c1.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(c1.lat * Math.PI / 180) * Math.cos(c2.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const DeliveryPage = () => {
    const { t } = useTranslation();
    const { user } = useAppStore();

    // TABS: map, chat, earnings
    const [activeTab, setActiveTab] = useState('map');

    const [orders, setOrders] = useState([]);
    const [activeOrder, setActiveOrder] = useState(null);
    const [stats, setStats] = useState({});
    const [myLocation, setMyLocation] = useState(null);
    const [loading, setLoading] = useState(true);

    // Track Trip Total Distance
    const [totalTripKm, setTotalTripKm] = useState(0);

    // Inbox state
    const [inbox, setInbox] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);

    // Photo
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [photoSent, setPhotoSent] = useState(false);
    const deliveryPhotoRef = useRef(null);

    const fetchData = async () => {
        try {
            const [ordersRes, statsRes, inboxRes] = await Promise.all([
                api.get('/delivery/active'),
                api.get('/delivery/stats'),
                api.get('/inbox').catch(() => ({ data: [] }))
            ]);

            const activeOrds = Array.isArray(ordersRes.data) ? ordersRes.data : [ordersRes.data];
            const myActive = activeOrds.find(o => o.deliveryManId === user.id && ['accepted', 'preparing', 'ready_for_pickup', 'delivering', 'delivered_awaiting_review'].includes(o.status));
            
            setActiveOrder(myActive || null);
            setPhotoSent(myActive?.status === 'delivered_awaiting_review');
            
            const availableOrds = activeOrds.filter(o => o.status === 'pending');
            setOrders(availableOrds);
            
            setStats(statsRes.data || {});
            setInbox(inboxRes.data || []);
            
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) return;
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, [user]);

    // Track Location
    useEffect(() => {
        if (!navigator.geolocation || !activeOrder) return;
        
        const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
        let watchId;
        
        const updateLoc = (pos) => {
            const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setMyLocation(prev => {
                if (prev) {
                    const distMoved = haversineDistance(prev, newLoc);
                    if (distMoved > 0.05) setTotalTripKm(curr => curr + distMoved);
                }
                
                socket.emit('driver-location', { room: `order_${activeOrder.id}`, location: newLoc });
                api.post('/delivery/location', { lat: newLoc.lat, lng: newLoc.lng, orderId: activeOrder.id }).catch(() => null);
                
                return newLoc;
            });
        };

        navigator.geolocation.getCurrentPosition(updateLoc, console.error, { enableHighAccuracy: true });
        watchId = navigator.geolocation.watchPosition(updateLoc, console.error, { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 });

        return () => {
            navigator.geolocation.clearWatch(watchId);
            socket.disconnect();
        };
    }, [activeOrder]);

    const handleAccept = async (order) => {
        try {
            await api.post(`/delivery/orders/${order.id}/accept`);
            setTotalTripKm(0);
            fetchData();
            setActiveTab('map');
        } catch (err) {
            alert(err.response?.data?.error || 'Qabul qilib bo\'lmadi');
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
            alert("Rasm yuborildi! Mijoz tasdiqlashini kuting.");
        } catch (err) { alert('Rasm yuklashda xatolik yuz berdi.'); }
        finally { setUploadingPhoto(false); }
    };

    // Calculate Map Routing Line
    const getRoutingPositions = () => {
        const positions = [];
        if (myLocation) positions.push([myLocation.lat, myLocation.lng]);
        if (activeOrder && activeOrder.user?.location) {
            // Can add restaurant in the middle if needed, but direct line to user is clearer 
            // once order is picked up. Let's just draw direct to user for simplicity.
            positions.push([activeOrder.user.location.lat, activeOrder.user.location.lng]);
        }
        return positions;
    };

    const estimateTime = () => {
        if (!myLocation || !activeOrder?.user?.location) return null;
        const dist = haversineDistance(myLocation, activeOrder.user.location);
        const mins = Math.round(dist / 0.5 * 3);
        return mins < 1 ? '1' : `${mins}`;
    };

    const tripEarnings = Math.round(totalTripKm * 1000);

    if (loading) return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>{t('loading')}</div>;

    // Inside a Chat
    if (activeTab === 'chat' && selectedChat) {
        return <DirectChat conversation={selectedChat} onBack={() => { setSelectedChat(null); fetchData(); }} />;
    }

    return (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: 80, background: 'var(--bg-primary)' }}>
            
            {/* Top Toggles */}
            <div style={{ padding: '16px 20px', background: 'var(--card-bg)', borderBottom: '1px solid var(--card-border)', display: 'flex', gap: 6, position: 'sticky', top: 0, zIndex: 50, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <button onClick={() => setActiveTab('map')} style={{ flex: 1, padding: '10px', borderRadius: 12, border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: activeTab === 'map' ? 'var(--brand-accent2)' : 'var(--bg-secondary)', color: activeTab === 'map' ? '#fff' : 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                    <Map size={16} /> Yetkazish
                </button>
                <button onClick={() => setActiveTab('chat')} style={{ flex: 1, padding: '10px', borderRadius: 12, border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: activeTab === 'chat' ? 'var(--brand-accent2)' : 'var(--bg-secondary)', color: activeTab === 'chat' ? '#fff' : 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                    <MessageSquare size={16} /> Chatlar {inbox.length > 0 && `(${inbox.length})`}
                </button>
                <button onClick={() => setActiveTab('earnings')} style={{ flex: 1, padding: '10px', borderRadius: 12, border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: activeTab === 'earnings' ? 'var(--brand-accent2)' : 'var(--bg-secondary)', color: activeTab === 'earnings' ? '#fff' : 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                    <Wallet size={16} /> Daromad
                </button>
            </div>

            {/* TAB: MAP & DELIVERY */}
            {activeTab === 'map' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.3s ease' }}>
                    
                    {!activeOrder ? (
                         <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
                            <div style={{ background: 'var(--bg-secondary)', width: 100, height: 100, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                                <Truck size={48} color="var(--brand-accent2)" />
                            </div>
                            <h3 style={{ color: 'var(--text-primary)', fontSize: 20, marginBottom: 8 }}>Faol buyurtma yo'q</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>"Daromad" bo'limidan yangi buyurtmalarni qabul qilishingiz mumkin.</p>
                            <button onClick={() => setActiveTab('earnings')} style={{ padding: '12px 24px', background: 'var(--brand-accent2)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, marginTop: 20, cursor: 'pointer' }}>
                                Buyurtmalarni ko'rish
                            </button>
                        </div>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 20px' }}>
                            {/* Active Order Card */}
                            <div style={{ background: 'linear-gradient(135deg, var(--brand-accent), #FF3CAC)', color: 'white', padding: '16px', borderRadius: '18px', marginBottom: '16px', boxShadow: '0 8px 24px rgba(255,107,53,0.3)', flexShrink: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '16px', fontSize: '11px', fontWeight: 800 }}>Mijoz kutyapti</span>
                                    <span style={{ fontWeight: 800, fontSize: 16 }}>₩{activeOrder.totalAmount?.toLocaleString()}</span>
                                </div>
                                <div style={{ fontSize: 13, opacity: 0.9 }}>👤 {activeOrder.user?.firstName} · 📞 {activeOrder.user?.phone}</div>
                                <p style={{ margin: '6px 0 16px', fontSize: '15px', fontWeight: 800 }}>📍 {activeOrder.user?.address}</p>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <a href={`tel:${activeOrder.user?.phone}`} style={{ flex: 1, background: 'rgba(255,255,255,0.2)', color: '#fff', textDecoration: 'none', padding: '12px', borderRadius: '14px', textAlign: 'center', fontWeight: 800, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                        <Phone size={16} /> Qo'ng'iroq
                                    </a>
                                    <a href={`https://map.kakao.com/link/to/${encodeURIComponent(activeOrder.user?.address || '')},${activeOrder.user?.location?.lat || 37.5503},${activeOrder.user?.location?.lng || 127.0731}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, background: '#FBEB00', color: '#000', textDecoration: 'none', padding: '12px', borderRadius: '14px', textAlign: 'center', fontWeight: 800, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                        <Navigation size={16} /> KakaoMap
                                    </a>
                                </div>
                            </div>

                            {/* Map */}
                            {myLocation && activeOrder.user?.location && (
                                <div style={{ flex: 1, minHeight: 300, width: '100%', borderRadius: 20, overflow: 'hidden', border: '1px solid var(--card-border)', marginBottom: 16, position: 'relative' }}>
                                    <MapContainer center={[myLocation.lat, myLocation.lng]} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                                        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                                        
                                        {/* Polyline Route */}
                                        <Polyline positions={getRoutingPositions()} color="#27AE60" weight={5} dashArray="10, 10" opacity={0.8} />

                                        <Marker position={[myLocation.lat, myLocation.lng]} icon={
                                            new L.DivIcon({ className: 'courier-icon', html: '<div style="font-size:24px; background:#fff; border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(0,0,0,0.2); border: 3px solid #27AE60;">🛵</div>', iconSize: [36, 36] })
                                        }>
                                            <Popup>Mening Joylashuvim</Popup>
                                        </Marker>

                                        <Marker position={[activeOrder.user.location.lat, activeOrder.user.location.lng]} icon={
                                            new L.DivIcon({ className: 'home-icon', html: '<div style="font-size:24px; background:#fff; border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(0,0,0,0.2); border: 3px solid #FF3CAC;">🏠</div>', iconSize: [36, 36] })
                                        }>
                                            <Popup>Mijoz Manzili</Popup>
                                        </Marker>
                                    </MapContainer>

                                    {estimateTime() && (
                                        <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 400, background: 'rgba(255,255,255,0.9)', padding: '6px 12px', borderRadius: 12, fontWeight: 800, color: 'var(--brand-accent2)', fontSize: 13, boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                                            ⏱ ~{estimateTime()} min
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Photo Upload for Delivery Complete */}
                            <div style={{ flexShrink: 0 }}>
                                <input type="file" accept="image/*" capture="environment" ref={deliveryPhotoRef} onChange={handleUploadDeliveryPhoto} style={{ display: 'none' }} />
                                {!photoSent ? (
                                    <button onClick={() => deliveryPhotoRef.current?.click()} disabled={uploadingPhoto} style={{ width: '100%', padding: '16px', background: '#27AE60', color: '#fff', border: 'none', borderRadius: 16, fontWeight: 800, fontSize: 15, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, boxShadow: '0 4px 14px rgba(39,174,96,0.3)' }}>
                                        {uploadingPhoto ? '⏳ Yuklanmoqda...' : <><Camera size={20} /> Yetib keldim, rasmga olish</>}
                                    </button>
                                ) : (
                                    <div style={{ width: '100%', padding: '16px', textAlign: 'center', color: '#27AE60', fontWeight: 800, fontSize: 14, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, background: 'rgba(39,174,96,0.1)', borderRadius: 16, border: '1px solid rgba(39,174,96,0.3)' }}>
                                        <CheckCircle size={18} /> Rasm yuborildi. Mijoz tasdiqlashi kutilmoqda.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB: CHAT LIST */}
            {activeTab === 'chat' && (
                <div style={{ animation: 'fadeIn 0.3s ease', padding: '16px 20px', flex: 1, overflowY: 'auto' }}>
                    
                    {inbox.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
                            <div style={{ fontSize: 40, marginBottom: 10 }}>💬</div>
                            <div>Hozircha xabarlar yo'q</div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {inbox.map(conv => (
                                <div key={conv.id} onClick={() => setSelectedChat(conv)} style={{ display: 'flex', gap: 12, background: 'var(--card-bg)', padding: 14, borderRadius: 16, border: '1px solid var(--card-border)', cursor: 'pointer', alignItems: 'center' }}>
                                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: conv.id.includes('dm') ? 'linear-gradient(135deg, #F5A623, #F39C12)' : 'linear-gradient(135deg, var(--brand-accent2), #11998E)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                                        {conv.id.includes('dm') ? '🛡️' : '👤'}
                                    </div>
                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{conv.name}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', flexShrink: 0 }}>
                                                {new Date(conv.updatedAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {conv.lastMessage || 'Xabar yo\'q'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB: EARNINGS & ORDERS */}
            {activeTab === 'earnings' && (
                <div style={{ animation: 'fadeIn 0.3s ease', padding: '16px 20px', flex: 1, overflowY: 'auto' }}>
                    
                    {/* Stats */}
                    <div style={{ background: 'var(--card-bg)', borderRadius: 18, border: '1px solid var(--card-border)', padding: 16, marginBottom: 20 }}>
                        <h3 style={{ fontSize: 16, color: 'var(--text-primary)', marginBottom: 16 }}>📊 Daromad Statistikasi</h3>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <div style={{ flex: 1, background: 'var(--bg-secondary)', borderRadius: 14, padding: 12, border: '1px solid var(--card-border)' }}>
                                <div style={{ color: 'var(--text-secondary)', fontSize: 11, fontWeight: 700 }}>Masofa (km)</div>
                                <div style={{ color: 'var(--brand-accent2)', fontSize: 18, fontWeight: 900 }}>{stats.totalDistance?.toFixed(1) || 0}</div>
                            </div>
                            <div style={{ flex: 1, background: 'var(--bg-secondary)', borderRadius: 14, padding: 12, border: '1px solid var(--card-border)' }}>
                                <div style={{ color: 'var(--text-secondary)', fontSize: 11, fontWeight: 700 }}>Buyurtmalar</div>
                                <div style={{ color: 'var(--brand-accent2)', fontSize: 18, fontWeight: 900 }}>{stats.totalDeliveries || 0}</div>
                            </div>
                            <div style={{ flex: 1.2, background: 'var(--bg-secondary)', borderRadius: 14, padding: 12, border: '1px solid var(--card-border)' }}>
                                <div style={{ color: 'var(--text-secondary)', fontSize: 11, fontWeight: 700 }}>To'lov (₩)</div>
                                <div style={{ color: 'var(--brand-accent)', fontSize: 18, fontWeight: 900 }}>{(stats.totalEarnings || 0).toLocaleString()}</div>
                            </div>
                        </div>

                        {activeOrder && (
                            <div style={{ marginTop: 12, borderTop: '1px dashed var(--card-border)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 700 }}>Joriy sayohat ({totalTripKm.toFixed(1)} km)</div>
                                <div style={{ fontSize: 16, color: 'var(--brand-accent)', fontWeight: 900 }}>+ ₩{tripEarnings.toLocaleString()}</div>
                            </div>
                        )}
                    </div>

                    {/* Available Orders list */}
                    <h3 style={{ marginBottom: 16, color: 'var(--text-primary)', fontSize: 18 }}>Yangi Buyurtmalar ({orders.length})</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {orders.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', background: 'var(--card-bg)', borderRadius: 16 }}>
                                <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Buyurtmalar mavjud emas</p>
                            </div>
                        ) : (
                            orders.map(order => {
                                const distFromRestaurant = order.distance || 0;
                                const estimatedMins = Math.round(distFromRestaurant / 0.5 * 3);
                                const estimatedEarning = Math.round(distFromRestaurant * 2 * 1000); // round trip estimation

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
                                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>⏱ ~{estimatedMins} min</div>
                                            <div style={{ fontSize: 12, color: '#27AE60', fontWeight: 800 }}>💰 ~₩{estimatedEarning.toLocaleString()}</div>
                                        </div>
                                        <button onClick={() => handleAccept(order)} style={{ width: '100%', padding: '14px', borderRadius: '14px', border: 'none', background: 'var(--text-primary)', color: 'var(--bg-primary)', fontWeight: 800, cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                            Qabul Qilish 🛵
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

        </div>
    );
};

export default DeliveryPage;
