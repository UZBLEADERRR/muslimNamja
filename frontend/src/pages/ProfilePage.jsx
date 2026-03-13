import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import api from '../utils/api';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';

const LANG_LIST = [
    { code: "en", name: "English", flag: "🇬🇧" },
    { code: "ko", name: "한국어", flag: "🇰🇷" },
    { code: "uz", name: "O'zbek", flag: "🇺🇿" },
    { code: "ru", name: "Русский", flag: "🇷🇺" },
];

const Modal = ({ title, onClose, children }) => (
    <div style={{
        position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'flex-end',
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s ease'
    }}>
        <div style={{
            background: 'var(--card-bg)', width: '100%', borderTopLeftRadius: 24, borderTopRightRadius: 24,
            padding: 24, border: '1px solid var(--card-border)', borderBottom: 'none',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.3)', animation: 'slideUp 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 18 }}>{title}</h3>
                <button onClick={onClose} style={{
                    background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: 'none',
                    width: 32, height: 32, borderRadius: 16, fontSize: 16, cursor: 'pointer'
                }}>✕</button>
            </div>
            {children}
        </div>
    </div>
);

const tg = window.Telegram?.WebApp;

const ProfilePage = () => {
    const { t, lang } = useTranslation();
    const { user, logout, setLang, setUser, token } = useAppStore();

    // Data states
    const [history, setHistory] = useState({ orders: [], paymentRequests: [] });
    const [adminCard, setAdminCard] = useState('');
    const [loading, setLoading] = useState(true);

    // Edit Profile Modal
    const [showEdit, setShowEdit] = useState(false);
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [nickname, setNickname] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [location, setLocation] = useState(null);
    const [saving, setSaving] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);
    // Extra address details
    const [floor, setFloor] = useState('');
    const [apartment, setApartment] = useState('');
    const [addressNote, setAddressNote] = useState('');

    // Top-up Modal
    const [showTopUp, setShowTopUp] = useState(false);
    const [topUpAmount, setTopUpAmount] = useState('');
    const [screenshot, setScreenshot] = useState(null);
    const [uploading, setUploading] = useState(false);

    // Settings Modal
    const [showSettings, setShowSettings] = useState(false);

    // Avatar
    const avatarRef = useRef(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [refreshingBalance, setRefreshingBalance] = useState(false);


    // Tabs
    const [activeTab, setActiveTab] = useState('orders');

    useEffect(() => {
        if (user) {
            setPhone(user.phone || '');
            setAddress(user.address || '');
            setNickname(user.nickname || '');
            setIsPrivate(user.isPrivate || false);
            setLocation(user.location || null);
            // Load extra address details
            const details = user.addressDetails || {};
            setFloor(details.floor || '');
            setApartment(details.apartment || '');
            setAddressNote(details.note || '');

            Promise.all([
                api.get('/users/history').catch(() => ({ data: { orders: [], paymentRequests: [] } })),
                api.get('/users/settings/adminBankCard').catch(() => ({ data: '' }))
            ]).then(([histRes, cardRes]) => {
                setHistory(histRes.data || { orders: [], paymentRequests: [] });
                let val = cardRes.data?.value || cardRes.data;
                if (typeof val === 'string' && val.startsWith('"')) val = JSON.parse(val);
                setAdminCard(val || '');
                setLoading(false);

                // Check for ?action=topup from CartPage
                const params = new URLSearchParams(window.location.search);
                if (params.get('action') === 'topup') {
                    setShowTopUp(true);
                }
            });
        }
    }, [user]);

    // Real-time wallet balance sync via Socket.IO
    useEffect(() => {
        if (!user) return;
        const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
        socket.emit('join-room', `user_${user.id}`);
        
        socket.on('balance-updated', (data) => {
            if (data?.balance !== undefined) {
                setUser({ ...user, walletBalance: data.balance }, token);
            }
        });

        // Also poll every 30s as fallback
        const interval = setInterval(async () => {
            try {
                const res = await api.get('/users/me');
                if (res.data?.walletBalance !== undefined && res.data.walletBalance !== user.walletBalance) {
                    setUser({ ...user, walletBalance: res.data.walletBalance }, token);
                }
            } catch (e) { /* ignore */ }
        }, 30000);

        return () => {
            socket.disconnect();
            clearInterval(interval);
        };
    }, [user?.id]);

    // Handle Telegram Back Button specifically for modals
    useEffect(() => {
        if (!tg) return;
        const activeModal = showEdit || showTopUp || showSettings;
        if (activeModal) {
            tg.BackButton?.show();
            const handleBack = () => {
                setShowEdit(false);
                setShowTopUp(false);
                setShowSettings(false);
            };
            tg.onEvent('backButtonClicked', handleBack);
            return () => tg.offEvent('backButtonClicked', handleBack);
        } else {
            tg.BackButton?.hide();
        }
    }, [showEdit, showTopUp, showSettings]);

    // Approximate center for Sejong University (Seoul Campus area)
    const STORE_LOCATION = { lat: 37.5503, lng: 127.0731 };

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            alert("Sizning qurilmangiz joylashuvni qo'llab-quvvatlamaydi.");
            return;
        }
        setGettingLocation(true);
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const dist = calculateDistance(STORE_LOCATION.lat, STORE_LOCATION.lng, lat, lng);
            if (dist > 3) {
                alert(`Sizning manzil do'kondon juda uzoqda (${dist.toFixed(1)} km). Yetkazib berish 3km doirasida mumkin!`);
                setGettingLocation(false);
                return;
            }
            setLocation({ lat, lng });

            // AI reverse geocode
            try {
                const res = await api.post('/ai/reverse-geocode', { lat, lng });
                if (res.data?.address) {
                    setAddress(res.data.address);
                    alert(`✅ Joylashuv aniqlandi va manzil avtomatik to'ldirildi!\nMasofa: ${dist.toFixed(1)} km\n\nIltimos, qavat va uy raqamini ham kiriting.`);
                } else {
                    alert(`✅ Joylashuv aniqlandi! Masofa: ${dist.toFixed(1)} km\n\nManzilni qo'lda kiriting.`);
                }
            } catch (e) {
                console.error('Reverse geocode failed:', e);
                alert(`✅ Joylashuv aniqlandi! Masofa: ${dist.toFixed(1)} km\n\nAI manzil aniqlay olmadi. Qo'lda kiriting.`);
            }
            setGettingLocation(false);
        }, (err) => {
            setGettingLocation(false);
            alert("Joylashuvni aniqlash uchun ruxsat bering!");
        });
    };

    const handleSaveProfile = async () => {
        let finalDist = 0;
        if (!location) {
            alert("Iltimos, yetkazib berish uchun 'Lokatsiya oling' orqali joylashuvingizni aniqlang!");
            return;
        } else {
            finalDist = calculateDistance(STORE_LOCATION.lat, STORE_LOCATION.lng, location.lat, location.lng);
            if (finalDist > 3) {
                alert(`Sizning manzil do'kondon ${finalDist.toFixed(1)} km uzoqlikda! 3km doirasida bo'lishi shart.`);
                return;
            }
        }

        setSaving(true);
        try {
            const addressDetails = { floor: floor || '', apartment: apartment || '', note: addressNote || '' };
            const res = await api.put('/users/profile', { phone, address, location, nickname, isPrivate, distanceFromRestaurant: finalDist, addressDetails });
            setUser(res.data.user || { ...user, phone, address, location, nickname, isPrivate, distanceFromRestaurant: finalDist, addressDetails }, token);
            setShowEdit(false);
            alert('✅ Saqlandi!');
        } catch (err) {
            alert('❌ Xatolik yuz berdi');
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingAvatar(true);
        try {
            const formData = new FormData();
            formData.append('avatar', file);
            const res = await api.post('/users/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setUser({ ...user, avatarUrl: res.data.avatarUrl }, token);
        } catch (err) {
            alert(err.response?.data?.error || "Rasm yuklashda xatolik");
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleTopUp = async () => {
        if (!screenshot) return alert('Screenshot yuklang');
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('screenshot', screenshot);
            formData.append('amount', topUpAmount || '0');
            const res = await api.post('/users/topup', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            alert('✅ ' + (res.data.message || 'Yuborildi! AI tekshirmoqda...'));
            setShowTopUp(false);
            setScreenshot(null);
            setTopUpAmount('');
            // Refresh history
            const histRes = await api.get('/users/history');
            setHistory(histRes.data);
            setActiveTab('payments');
        } catch (err) {
            alert('❌ ' + (err.response?.data?.error || 'Xato'));
        } finally {
            setUploading(false);
        }
    };

    if (!user) {
        return (
            <div className="animate-slide-up" style={{ padding: 40, textAlign: "center" }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>👤</div>
                <h3 style={{ color: "var(--text-primary)", marginBottom: 12 }}>{t('profile_not_ready')}</h3>
                <button onClick={() => window.location.reload()} style={{ background: "var(--brand-accent)", color: "#fff", padding: "12px 24px", borderRadius: 12, border: "none", fontWeight: 700, cursor: "pointer" }}>{t('reload')}</button>
            </div>
        );
    }

    const canUploadAvatar = (user.walletBalance || 0) >= 15000;
    const displayName = user.nickname || user.firstName + (user.lastName ? ' ' + user.lastName : '');

    return (
        <div className="animate-slide-up" style={{ padding: 16, paddingBottom: 100, maxWidth: 600, margin: '0 auto' }}>

            {/* Premium Header Card */}
            <div style={{
                background: `linear-gradient(135deg, rgba(255,107,53,0.15), rgba(255,60,172,0.15))`,
                borderRadius: 24, padding: 24, marginBottom: 16, border: `1px solid rgba(255,107,53,0.2)`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden'
            }}>
                {/* Decorative background blur */}
                <div style={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, background: 'var(--brand-accent)', filter: 'blur(80px)', opacity: 0.2, zIndex: 0 }} />

                <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div
                        onClick={() => canUploadAvatar && avatarRef.current?.click()}
                        style={{
                            width: 84, height: 84, borderRadius: 42, background: `linear-gradient(135deg, var(--brand-accent), #FF3CAC)`,
                            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36,
                            boxShadow: "0 8px 24px rgba(255, 107, 53, 0.3)", overflow: 'hidden',
                            cursor: canUploadAvatar ? 'pointer' : 'default', border: '3px solid var(--bg-primary)', marginBottom: 12
                        }}
                    >
                        {user.avatarUrl?.startsWith('data:image') ? <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>👤</span>}
                    </div>
                    <input type="file" accept="image/*" ref={avatarRef} onChange={handleAvatarUpload} style={{ display: 'none' }} />

                    <div style={{ color: "var(--text-primary)", fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 24, textAlign: 'center' }}>
                        {displayName}
                    </div>
                    <div style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 16 }}>@{user.username || 'user'}</div>

                    <div style={{ background: 'var(--card-bg)', padding: '12px 24px', borderRadius: 20, boxShadow: 'var(--shadow-main)', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 16, background: 'rgba(78,205,196,0.1)', color: 'var(--brand-accent2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>💰</div>
                        <div>
                            <div style={{ color: "var(--text-secondary)", fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Hamyon ({t('wallet')})</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ color: "var(--text-primary)", fontWeight: 900, fontSize: 20, fontFamily: "'Fraunces', serif" }}>₩{(user.walletBalance || 0).toLocaleString()}</div>
                                <button 
                                    disabled={refreshingBalance}
                                    onClick={async () => {
                                        setRefreshingBalance(true);
                                        try {
                                            const res = await api.get('/users/me');
                                            setUser({ ...user, walletBalance: res.data.walletBalance }, token);
                                        } catch (e) { }
                                        setTimeout(() => setRefreshingBalance(false), 600);
                                    }} 
                                    style={{ 
                                        background: 'none', border: 'none', cursor: 'pointer', fontSize: 14,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        animation: refreshingBalance ? 'spin 0.6s linear infinite' : 'none'
                                    }}
                                >🔄</button>
                                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
                <button onClick={() => setShowEdit(true)} style={actionBtnStyle}>
                    <span style={{ fontSize: 22, marginBottom: 4 }}>✏️</span> Tahrirlash
                </button>
                <button onClick={() => setShowTopUp(true)} style={{ ...actionBtnStyle, background: 'var(--brand-accent)', color: '#fff', border: 'none' }}>
                    <span style={{ fontSize: 22, marginBottom: 4 }}>💳</span> {t('wallet_balance')}
                </button>
                <button onClick={() => setShowSettings(true)} style={actionBtnStyle}>
                    <span style={{ fontSize: 22, marginBottom: 4 }}>⚙️</span> Sozlamalar
                </button>
            </div>

            {/* History Section Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <button onClick={() => setActiveTab('orders')} style={tabBtnStyle(activeTab === 'orders')}>📦 Buyurtmalar</button>
                <button onClick={() => setActiveTab('payments')} style={tabBtnStyle(activeTab === 'payments')}>🧾 To'lovlar</button>
            </div>

            {/* History Content */}
            {loading ? <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-secondary)' }}>⏳ Yuklanmoqda...</div> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {activeTab === 'orders' && history.orders.map((o, i) => (
                        <div key={o.id} style={{ ...historyCardStyle, animation: `fadeIn 0.3s ease ${i * 40}ms both`, borderLeft: o.giftInfo?.isGift ? '3px solid #FF3CAC' : 'none' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 14 }}>
                                    #{(o.id || '').slice(0, 8)} {o.giftInfo?.isGift && <span style={{ fontSize: 12, background: 'rgba(255,60,172,0.1)', color: '#FF3CAC', padding: '2px 6px', borderRadius: 6, marginLeft: 6 }}>🎁 SOVG'A</span>}
                                </span>
                                <span style={{ fontSize: 12, fontWeight: 700, color: o.status === 'completed' ? '#00F5A0' : o.status === 'cancelled' ? '#FF4560' : 'var(--brand-accent)' }}>
                                    {o.status.toUpperCase()}
                                </span>
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
                                {o.items?.map(it => `${it.productName || 'Item'} x${it.quantity}`).join(', ') || 'Buyurtma'}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{new Date(o.createdAt).toLocaleString()}</span>
                                <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>₩{o.totalAmount?.toLocaleString()}</span>
                            </div>
                        </div>
                    ))}
                    {activeTab === 'orders' && history.orders.length === 0 && (
                        <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-secondary)', background: 'var(--card-bg)', borderRadius: 16 }}>Hali hech narsa xarid qilmadingiz</div>
                    )}

                    {activeTab === 'payments' && history.paymentRequests.map((p, i) => (
                        <div key={p.id} style={{ ...historyCardStyle, animation: `fadeIn 0.3s ease ${i * 40}ms both`, borderLeft: p.type ? (p.type === 'spend' ? '3px solid #FF4560' : '3px solid #00F5A0') : 'none' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                {p.type ? (
                                    <span style={{ fontWeight: 800, color: p.type === 'spend' ? '#FF4560' : '#00F5A0', fontSize: 13 }}>
                                        {p.type === 'spend' ? '💸 O\'tkazildi' : '💳 Qabul qilindi'}
                                    </span>
                                ) : (
                                    <span style={{ fontWeight: 800, color: p.status === 'approved' ? '#00F5A0' : p.status === 'rejected' ? '#FF4560' : 'var(--brand-accent2)' }}>
                                        {p.status === 'approved' ? '✅ Qabul qilindi' : p.status === 'rejected' ? '❌ Rad etildi' : '⏳ Kutilmoqda'}
                                    </span>
                                )}
                                <span style={{ fontWeight: 900, color: 'var(--text-primary)' }}>
                                    {p.type === 'spend' ? '-' : '+'}₩{p.amount?.toLocaleString()}
                                </span>
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                                {p.description || (p.type ? 'P2P O\'tkazma' : 'Hamyon to\'ldirish')}
                            </div>
                            {p.imageUrl && (
                                <div style={{ marginBottom: 10, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--card-border)' }}>
                                    <img src={p.imageUrl} alt="receipt" style={{ width: '100%', maxHeight: 200, objectFit: 'contain', background: '#000' }} />
                                </div>
                            )}
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{new Date(p.createdAt).toLocaleString()}</div>

                        </div>
                    ))}
                    {activeTab === 'payments' && history.paymentRequests.length === 0 && (
                        <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-secondary)', background: 'var(--card-bg)', borderRadius: 16 }}>Hali hech qanday to'lov so'rovi yo'q</div>
                    )}
                </div>
            )}

            {/* Modals */}
            {showEdit && (
                <Modal title="✏️ Profilni tahrirlash" onClose={() => setShowEdit(false)}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Taxallus (Nickname)</div>
                            <input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Taxallusiz..." style={inputStyle} />
                        </div>
                        <div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Telefon</div>
                            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+8210..." style={inputStyle} />
                        </div>
                        <div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Doimiy Manzil</div>
                            <input value={address} onChange={e => setAddress(e.target.value)} placeholder="To'liq manzil..." style={inputStyle} />

                            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)', padding: '10px', borderRadius: 12, border: '1px solid var(--card-border)' }}>
                                <div style={{ fontSize: 12, color: location ? '#00F5A0' : 'var(--text-secondary)' }}>
                                    {location ? `📍 Aniqlandi (${calculateDistance(STORE_LOCATION.lat, STORE_LOCATION.lng, location.lat, location.lng).toFixed(1)} km)` : 'Gps kiritilmagan'}
                                </div>
                                <button type="button" onClick={handleGetLocation} disabled={gettingLocation} style={{ background: 'var(--brand-accent2)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: gettingLocation ? 0.6 : 1 }}>
                                    {gettingLocation ? '⏳ Aniqlanmoqda...' : '📍 Lokatsiya oling'}
                                </button>
                            </div>
                        </div>
                        <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Qavat (etaj)</div>
                                <input value={floor} onChange={e => setFloor(e.target.value)} placeholder="masalan: 3" style={inputStyle} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Uy/Xona raqami</div>
                                <input value={apartment} onChange={e => setApartment(e.target.value)} placeholder="masalan: 305" style={inputStyle} />
                            </div>
                        </div>
                        <div style={{ marginTop: 8 }}>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Qo'shimcha ma'lumot</div>
                            <input value={addressNote} onChange={e => setAddressNote(e.target.value)} placeholder="masalan: Kirish eshigi chap tomonda" style={inputStyle} />
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', background: 'var(--bg-secondary)', padding: "12px 14px", borderRadius: 12, border: '1px solid var(--card-border)' }}>
                            <input type="checkbox" checked={isPrivate} onChange={e => setIsPrivate(e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--brand-accent)' }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 600 }}>Shaxsiy profil</div>
                                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Hamyon ko'rsatkichingiz boshqalardan yashiriladi</div>
                            </div>
                        </label>
                        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                            <button onClick={() => setShowEdit(false)} style={{ ...btnStyle, background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--card-border)', flex: 1 }}>Bekor qilish</button>
                            <button onClick={handleSaveProfile} disabled={saving} style={{ ...btnStyle, flex: 2 }}>{saving ? '⏳...' : 'Saqlash'}</button>
                        </div>
                    </div>
                </Modal>
            )}

            {showTopUp && (
                <Modal title="💳 Hamyonni to'ldirish" onClose={() => setShowTopUp(false)}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {adminCard && (
                            <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '16px', border: '1px solid var(--brand-accent2)', textAlign: 'center' }}>
                                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>To'lov uchun karta:</div>
                                <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--brand-accent2)', letterSpacing: 1 }}>{adminCard}</div>
                            </div>
                        )}
                        <div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>O'tkazilgan Summa (₩)</div>
                            <input type="number" value={topUpAmount} onChange={e => setTopUpAmount(e.target.value)} placeholder="10000" style={inputStyle} />
                            <div style={{ display: 'flex', gap: 8, marginTop: 8, overflowX: 'auto', paddingBottom: 4 }} className="hide-scrollbar">
                                {[5000, 10000, 20000, 50000].map(amt => (
                                    <button key={amt} onClick={() => setTopUpAmount(amt.toString())} style={{
                                        padding: '6px 14px', borderRadius: 12, border: `1px solid ${topUpAmount === amt.toString() ? 'var(--brand-accent2)' : 'var(--card-border)'}`,
                                        background: topUpAmount === amt.toString() ? 'var(--brand-accent2)' : 'transparent', color: topUpAmount === amt.toString() ? '#fff' : 'var(--text-secondary)',
                                        fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap'
                                    }}>₩{amt.toLocaleString()}</button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Skrinshot yuklash</div>
                            <label style={{
                                display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', 
                                background: 'var(--bg-secondary)', borderRadius: 12, border: '2px dashed var(--card-border)',
                                cursor: 'pointer', transition: 'all 0.2s', borderStyle: screenshot ? 'solid' : 'dashed',
                                borderColor: screenshot ? 'var(--brand-accent2)' : 'var(--card-border)'
                            }}>
                                <span style={{ fontSize: 20 }}>{screenshot ? '✅' : '📷'}</span>
                                <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
                                    {screenshot ? screenshot.name : 'To\'lov skrinshotini tanlang'}
                                </span>
                                <input type="file" accept="image/*" onChange={e => setScreenshot(e.target.files?.[0])} style={{ display: 'none' }} />
                            </label>
                        </div>
                        <button onClick={handleTopUp} disabled={uploading || !screenshot} style={{ ...btnStyle, background: 'var(--brand-accent2)', marginTop: 10, opacity: (!screenshot || uploading) ? 0.5 : 1 }}>
                            {uploading ? '⏳ Jo\'natilmoqda...' : 'Yuborish'}
                        </button>
                    </div>
                </Modal>
            )}

            {showSettings && (
                <Modal title="⚙️ Sozlamalar" onClose={() => setShowSettings(false)}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Tilni o'zgartirish</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                            {LANG_LIST.map(l => (
                                <button key={l.code} onClick={() => setLang(l.code)} style={{
                                    padding: "12px", borderRadius: 12, border: `1px solid ${lang === l.code ? 'var(--brand-accent)' : 'var(--card-border)'}`,
                                    background: lang === l.code ? 'rgba(255,107,53,0.1)' : 'var(--bg-secondary)', color: lang === l.code ? 'var(--brand-accent)' : 'var(--text-primary)',
                                    fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.2s"
                                }}>{l.flag} {l.name}</button>
                            ))}
                        </div>
                        <button onClick={() => { setShowSettings(false); logout(); }} style={{ ...btnStyle, background: 'rgba(255,69,96,0.1)', color: '#FF4560' }}>
                            {t('logout')}
                        </button>
                    </div>
                </Modal>
            )}

            <style>{`
                @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    );
};

const inputStyle = { width: '100%', padding: '14px 16px', borderRadius: 14, border: '1px solid var(--card-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif" };
const btnStyle = { width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: 'var(--brand-accent)', color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" };
const actionBtnStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--card-bg)', color: 'var(--text-primary)', border: '1px solid var(--card-border)', borderRadius: 16, padding: '16px 8px', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--shadow-main)', fontFamily: "'DM Sans', sans-serif" };
const historyCardStyle = { background: 'var(--card-bg)', borderRadius: 16, padding: '16px', border: '1px solid var(--card-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' };
const tabBtnStyle = (active) => ({ flex: 1, padding: '10px', borderRadius: 12, border: 'none', background: active ? 'var(--bg-secondary)' : 'transparent', color: active ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s' });

export default ProfilePage;
