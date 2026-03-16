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
import { RESTAURANT_COORD } from '../utils/constants';

const SOCKET_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';

// Fix typical Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const RESTAURANT = RESTAURANT_COORD;

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
    const [activeOrders, setActiveOrders] = useState([]);
    const [workMode, setWorkMode] = useState('active'); // active, searching
    const [stats, setStats] = useState({});
    const [myLocation, setMyLocation] = useState(null);
    const [totalTripKm, setTotalTripKm] = useState(0);
    const [customerLiveLocations, setCustomerLiveLocations] = useState({}); // { orderId: {lat, lng} }
    const [loading, setLoading] = useState(true);

    const getTimeElapsed = (date) => {
        const diff = Math.floor((new Date() - new Date(date)) / 60000);
        if (diff < 1) return 'Hozirgina';
        return `${diff} daq avval`;
    };

    // Inbox state
    const [inbox, setInbox] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);

    // Photo
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [photoSent, setPhotoSent] = useState(false);
    const deliveryPhotoRef = useRef(null);

    const fetchData = async () => {
        try {
            const [activeRes, availableRes, statsRes, inboxRes] = await Promise.all([
                api.get('/delivery/active'),
                api.get('/delivery/orders/available'),
                api.get('/delivery/stats'),
                api.get('/inbox').catch(() => ({ data: [] }))
            ]);

            const activeOrds = Array.isArray(activeRes.data) ? activeRes.data : [activeRes.data].filter(Boolean);
            setActiveOrders(activeOrds);
            
            if (activeOrds.length > 0) {
                const head = activeOrds[0];
                setPhotoSent(head.status === 'delivered_awaiting_review');
            }
            
            const availableOrds = Array.isArray(availableRes.data) ? availableRes.data : [];
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
        if (!navigator.geolocation || activeOrders.length === 0) return;
        
        const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
        let watchId;
        
        const updateLoc = (pos) => {
            const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setMyLocation(prev => {
                // We'll skip totalTripKm logic for now to simplify or keep it if needed
                activeOrders.forEach(o => {
                    socket.emit('driver-location', { room: `order_${o.id}`, location: newLoc });
                });
                if (activeOrders[0]) {
                    api.post('/delivery/location', { lat: newLoc.lat, lng: newLoc.lng, orderId: activeOrders[0].id }).catch(() => null);
                }
                return newLoc;
            });
        };

        activeOrders.forEach(o => {
            socket.emit('join-room', `order_${o.id}`);
        });

        socket.on('customer-location-updated', (data) => {
            if (data.orderId && data.location) {
                setCustomerLiveLocations(prev => ({
                    ...prev,
                    [data.orderId]: data.location
                }));
            }
        });

        navigator.geolocation.getCurrentPosition(updateLoc, console.error, { enableHighAccuracy: true });
        watchId = navigator.geolocation.watchPosition(updateLoc, console.error, { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 });

        return () => {
            navigator.geolocation.clearWatch(watchId);
            socket.disconnect();
        };
    }, [activeOrders.length]);

    const handleAccept = async (order) => {
        try {
            await api.post(`/delivery/orders/${order.id}/accept`);
            fetchData();
            setActiveTab('map');
        } catch (err) {
            alert(err.response?.data?.error || 'Qabul qilib bo\'lmadi');
        }
    };

    const handleStatusUpdate = async (orderId, status) => {
        try {
            await api.put(`/delivery/orders/${orderId}/status`, { status });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || 'Xatolik yuz berdi');
        }
    };

    const handleUploadDeliveryPhoto = async (e, orderId) => {
        const file = e.target.files[0];
        if (!file || !orderId) return;

        setUploadingPhoto(true);
        try {
            const formData = new FormData();
            formData.append('photo', file);
            await api.post(`/orders/${orderId}/delivery-photo`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            await fetchActiveOrders(); // Refresh to hide the button immediately
            setPhotoSent(true);
            alert("Rasm yuborildi! Mijoz tasdiqlashini kuting.");
        } catch (err) { 
            console.error('Photo upload error:', err);
            alert(err.response?.data?.error || 'Rasm yuklashda xatolik yuz berdi.'); 
        }
        finally { setUploadingPhoto(false); }
    };

    // Calculate Map Routing Line
    const getRoutingPositions = (order) => {
        const positions = [];
        if (myLocation) positions.push([myLocation.lat, myLocation.lng]);
        if (order?.user?.location) {
            positions.push([order.user.location.lat, order.user.location.lng]);
        }
        return positions;
    };

    const estimateTime = (order) => {
        if (!myLocation || !order?.user?.location) return null;
        const dist = haversineDistance(myLocation, order.user.location);
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
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)' }}>
            
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
                <button onClick={() => setActiveTab('orders')} style={{ flex: 1, padding: '10px', borderRadius: 12, border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: activeTab === 'orders' ? 'var(--brand-accent2)' : 'var(--bg-secondary)', color: activeTab === 'orders' ? '#fff' : 'var(--text-primary)', whiteSpace: 'nowrap', position: 'relative' }}>
                    <Truck size={16} /> Yangi{orders.length > 0 && <span style={{ position: 'absolute', top: -5, right: -5, background: 'var(--brand-accent)', color: '#fff', fontSize: 10, width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--card-bg)' }}>{orders.length}</span>}
                </button>
            </div>

            {/* TAB: MAP & DELIVERY */}
            {activeTab === 'map' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.3s ease' }}>
                    
                    {activeOrders.length === 0 ? (
                         <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
                            <div style={{ background: 'var(--bg-secondary)', width: 100, height: 100, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                                <Truck size={48} color="var(--brand-accent2)" />
                            </div>
                            <h3 style={{ color: 'var(--text-primary)', fontSize: 20, marginBottom: 8 }}>Faol buyurtma yo'q</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>"Buyurtmalar" bo'limidan yangi buyurtmalarni qabul qilishingiz mumkin.</p>
                            <button onClick={() => setActiveTab('earnings')} style={{ padding: '12px 24px', background: 'var(--brand-accent2)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, marginTop: 20, cursor: 'pointer' }}>
                                Buyurtmalarni ko'rish
                            </button>
                        </div>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 20px 20px', gap: 20, overflowY: 'auto' }} className="hide-scrollbar">
                            <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', fontFamily: "'Fraunces', serif", paddingTop: 16 }}>Mening yo'nalishim 🗺️</h2>
                            
                            {activeOrders.map((activeOrder, idx) => (
                                <div key={activeOrder.id} style={{ borderBottom: idx < activeOrders.length - 1 ? '1px dashed var(--card-border)' : 'none', paddingBottom: 20 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                        <div style={{ background: 'var(--brand-accent)', color: '#fff', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14 }}>{idx + 1}</div>
                                        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>Buyurtma #{activeOrder.id.toString().slice(0, 5)}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginLeft: 'auto' }}>{getTimeElapsed(activeOrder.createdAt)}</div>
                                    </div>

                                    {/* Action Buttons above Map/Card */}
                                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                                        {activeOrder.status === 'accepted' ? (
                                            <button onClick={() => handleStatusUpdate(activeOrder.id, 'preparing')} style={{ flex: 1, padding: '12px', background: 'var(--brand-accent2)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 13 }}>Pishirishga berish 🔪</button>
                                        ) : activeOrder.status === 'preparing' ? (
                                            <button onClick={() => handleStatusUpdate(activeOrder.id, 'ready_for_pickup')} style={{ flex: 1, padding: '12px', background: '#F39C12', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 13 }}>Tayyor bo'ldi 🍱</button>
                                        ) : activeOrder.status === 'ready_for_pickup' ? (
                                            <button onClick={() => handleStatusUpdate(activeOrder.id, 'delivering')} style={{ flex: 1, padding: '12px', background: 'var(--text-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 13 }}>Olib ketishni tasdiqlash ✅</button>
                                        ) : activeOrder.status === 'delivering' ? (
                                            <>
                                                <input type="file" accept="image/*" capture="environment" id={`photo-${activeOrder.id}`} onChange={(e) => handleUploadDeliveryPhoto(e, activeOrder.id)} style={{ display: 'none' }} />
                                                <button onClick={() => document.getElementById(`photo-${activeOrder.id}`).click()} style={{ flex: 1, padding: '12px', background: '#27AE60', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 13, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                                                    <Camera size={16} /> Yetib keldim
                                                </button>
                                            </>
                                        ) : null}
                                    </div>

                                    {/* Active Order Card */}
                                    <div style={{ background: 'linear-gradient(135deg, var(--brand-accent), #FF3CAC)', color: 'white', padding: '16px', borderRadius: '18px', marginBottom: '16px', boxShadow: '0 8px 24px rgba(255,107,53,0.3)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '16px', fontSize: '11px', fontWeight: 800 }}>
                                                {activeOrder.status === 'accepted' ? 'Qabul qilindi' : activeOrder.status === 'preparing' ? 'Tayyorlanmoqda' : activeOrder.status === 'ready_for_pickup' ? 'Tayyor' : 'Yetkazishda'}
                                            </span>
                                            <span style={{ fontWeight: 800, fontSize: 16 }}>₩{activeOrder.totalAmount?.toLocaleString()}</span>
                                        </div>
                                        <div style={{ fontSize: 13, opacity: 0.9 }}>👤 {activeOrder.user?.firstName} · 📞 {activeOrder.user?.phone}</div>
                                        <p style={{ margin: '6px 0 16px', fontSize: '15px', fontWeight: 800 }}>🏠 {activeOrder.user?.address || 'Manzil kiritilmagan'}</p>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <a href={`tel:${activeOrder.user?.phone}`} style={{ flex: 1, background: 'rgba(255,255,255,0.2)', color: '#fff', textDecoration: 'none', padding: '12px', borderRadius: '14px', textAlign: 'center', fontWeight: 800, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                                <Phone size={16} /> Qo'ng'iroq
                                            </a>
                                            <button onClick={() => api.post(`/delivery/orders/${activeOrder.id}/call-user`)} style={{ flex: 1, background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', padding: '12px', borderRadius: '14px', cursor: 'pointer', textAlign: 'center', fontWeight: 800, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                                <MessageSquare size={16} /> Bot Notify
                                            </button>
                                        </div>
                                    </div>

                                    {/* Map */}
                                    {myLocation && activeOrder.user?.location && (
                                        <div style={{ height: 250, width: '100%', borderRadius: 20, overflow: 'hidden', border: '1px solid var(--card-border)', marginBottom: 16, position: 'relative' }}>
                                            <MapContainer center={[myLocation.lat, myLocation.lng]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                                                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                                                
                                                {/* Polyline to profile address */}
                                                <Polyline positions={getRoutingPositions(activeOrder)} color="var(--brand-accent)" weight={5} dashArray="10, 10" opacity={0.8} />

                                                {/* Courier */}
                                                <Marker position={[myLocation.lat, myLocation.lng]} icon={
                                                    new L.DivIcon({ className: 'courier-icon', html: '<div style="font-size:24px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3))">🛵</div>', iconAnchor: [12, 12] })
                                                } />

                                                {/* Destination (User's Profile Address) */}
                                                <Marker position={[activeOrder.user.location.lat, activeOrder.user.location.lng]} icon={
                                                    new L.DivIcon({ className: 'home-icon', html: '<div style="font-size:24px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3))">🚩</div>', iconAnchor: [5, 24] })
                                                }>
                                                    <Popup>
                                                        <div style={{ fontWeight: 800 }}>Mijoz manzili:</div>
                                                        <div>{activeOrder.user.address}</div>
                                                    </Popup>
                                                </Marker>

                                                {/* Customer's LIVE Standing Position */}
                                                {customerLiveLocations[activeOrder.id] && (
                                                    <Marker position={[customerLiveLocations[activeOrder.id].lat, customerLiveLocations[activeOrder.id].lng]} icon={
                                                        new L.DivIcon({ className: 'live-icon', html: '<div style="font-size:20px; animation: pulse 2s infinite">👤</div>', iconAnchor: [10, 10] })
                                                    }>
                                                        <Popup>Mijozning hozirgi turgan joyi (Live)</Popup>
                                                    </Marker>
                                                )}
                                            </MapContainer>
                                            <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 400, background: 'rgba(255,255,255,0.95)', padding: '8px 12px', borderRadius: 12, fontWeight: 900, color: 'var(--brand-accent)', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                                ⏱ ~{estimateTime(activeOrder) || '?'} min
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB: CHAT LIST */}
            {activeTab === 'chat' && (
                <div style={{ animation: 'fadeIn 0.3s ease', padding: '16px 20px', flex: 1, overflowY: 'auto' }}>
                    
                    {/* Always show Help Center button */}
                    <div
                        onClick={async () => {
                            const adminChat = inbox.find(c => c.name?.includes('Yordam') || c.name?.includes('Support'));
                            if (adminChat) {
                                setSelectedChat(adminChat);
                            } else {
                                try {
                                    const res = await api.get('/inbox');
                                    const ac = (res.data || []).find(c => c.name?.includes('Yordam') || c.name?.includes('Support'));
                                    if (ac) setSelectedChat(ac);
                                    else { fetchData(); alert('Yordam markazi ochildi.'); }
                                } catch (e) { console.error(e); }
                            }
                        }}
                        style={{ display: 'flex', gap: 12, background: 'linear-gradient(135deg, var(--brand-accent2), #11998E)', padding: 14, borderRadius: 16, cursor: 'pointer', alignItems: 'center', marginBottom: 16, boxShadow: '0 4px 14px rgba(78,205,196,0.3)' }}
                    >
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                            🛡️
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 800, fontSize: 15, color: '#fff' }}>Yordam Markazi (Admin)</div>
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

            {/* TAB: EARNINGS & ORDERS *            {/* TAB: EARNINGS & STATS */}
            {activeTab === 'earnings' && (
                <div style={{ animation: 'fadeIn 0.3s ease', padding: '16px 20px', flex: 1, overflowY: 'auto' }}>
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

                        {activeOrders.length > 0 && (
                            <div style={{ marginTop: 12, borderTop: '1px dashed var(--card-border)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 700 }}>Joriy sayohat ({totalTripKm.toFixed(1)} km)</div>
                                <div style={{ fontSize: 16, color: 'var(--brand-accent)', fontWeight: 900 }}>+ ₩{(Math.round(totalTripKm * 1000)).toLocaleString()}</div>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <h4 style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 800 }}>Faol buyurtmalaringiz:</h4>
                        {activeOrders.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '24px', background: 'var(--bg-secondary)', borderRadius: 16 }}>
                                <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Hozircha faol buyurtma yo'q</p>
                            </div>
                        ) : activeOrders.map((o, idx) => (
                            <div key={o.id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--card-border)', borderRadius: 18, padding: 14 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{idx + 1}-buyurtma</div>
                                    <div style={{ color: 'var(--brand-accent2)', fontWeight: 800 }}>₩{o.totalAmount?.toLocaleString()}</div>
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{o.user?.address}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB: NEW ORDERS (SEARCHING) */}
            {activeTab === 'orders' && (
                <div style={{ animation: 'fadeIn 0.3s ease', padding: '16px 20px', flex: 1, overflowY: 'auto' }}>
                    <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', fontFamily: "'Fraunces', serif", marginBottom: 20 }}>Yangi buyurtmalar 🔍</h2>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {orders.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px 40px', background: 'var(--card-bg)', borderRadius: 24, border: '1px dashed var(--card-border)' }}>
                                <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.5 }}>📦</div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: 15, fontWeight: 700 }}>Hozircha yangi buyurtmalar yo'q</p>
                                <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 4 }}>Yangi buyurtmalar paydo bo'lishi bilan bu yerda ko'rinadi.</p>
                            </div>
                        ) : (
                            orders.map(order => {
                                const distFromRestaurant = order.distance || 0;
                                const estimatedMins = Math.round(distFromRestaurant / 0.5 * 3);
                                const estimatedEarning = Math.round(distFromRestaurant * 2 * 1000); 

                                return (
                                    <div key={order.id} className="animate-fade-in" style={{ padding: '16px', borderRadius: '20px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-main)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                                            <span style={{ fontWeight: 900, fontSize: '20px', color: 'var(--brand-accent)', fontFamily: "'Fraunces', serif" }}>
                                                ₩{(order.totalAmount || 0).toLocaleString()}
                                            </span>
                                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                <span style={{ background: order.status === 'ready_for_pickup' ? 'rgba(39,174,96,0.15)' : 'rgba(255,165,0,0.15)', color: order.status === 'ready_for_pickup' ? '#27AE60' : '#FF8C00', padding: '4px 12px', borderRadius: 10, fontSize: 11, fontWeight: 800 }}>
                                                    {order.status === 'ready_for_pickup' ? '✅ Tayyor' : '🍳 Tayyorlanmoqda'}
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 700, marginBottom: 6 }}>📍 {order.user?.address}</div>
                                        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>⏱ <span>~{estimatedMins} min</span></div>
                                            <div style={{ fontSize: 12, color: '#27AE60', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>💰 <span>~₩{estimatedEarning.toLocaleString()}</span></div>
                                        </div>
                                        <button onClick={() => handleAccept(order)} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: 'none', background: 'var(--brand-accent2)', color: '#fff', fontWeight: 800, fontSize: 16, cursor: 'pointer', transition: 'transform 0.2s' }}>
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
