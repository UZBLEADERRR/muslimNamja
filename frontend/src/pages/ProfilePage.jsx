import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import api from '../utils/api';

const LANG_LIST = [
    { code: "en", name: "English", flag: "🇬🇧" },
    { code: "ko", name: "한국어", flag: "🇰🇷" },
    { code: "uz", name: "O'zbek", flag: "🇺🇿" },
    { code: "ru", name: "Русский", flag: "🇷🇺" },
];

const ProfilePage = () => {
    const { t, lang } = useTranslation();
    const { user, logout, setLang, setUser, token } = useAppStore();
    const [orderCount, setOrderCount] = useState(0);

    // Editable fields
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [nickname, setNickname] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [location, setLocation] = useState(null);
    const [gettingLocation, setGettingLocation] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');

    // Avatar
    const avatarRef = useRef(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    // Wallet top-up
    const [topUpAmount, setTopUpAmount] = useState('');
    const [screenshot, setScreenshot] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [topUpMsg, setTopUpMsg] = useState('');
    const [adminCard, setAdminCard] = useState('');

    useEffect(() => {
        if (user) {
            setPhone(user.phone || '');
            setAddress(user.address || '');
            setNickname(user.nickname || '');
            setIsPrivate(user.isPrivate || false);
            setLocation(user.location || null);
            api.get('/orders/my')
                .then(res => setOrderCount(res.data?.length || 0))
                .catch(() => { });

            api.get('/users/settings/adminBankCard')
                .then(res => {
                    let val = res.data?.value || res.data;
                    if (typeof val === 'string' && val.startsWith('"')) val = JSON.parse(val);
                    setAdminCard(val || '');
                })
                .catch(() => { });
        }
    }, [user]);

    const handleGetLocation = () => {
        setGettingLocation(true);
        if (!navigator.geolocation) {
            alert('Geolocation not supported');
            setGettingLocation(false);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setGettingLocation(false);
            },
            () => {
                alert('Location permission denied');
                setGettingLocation(false);
            }
        );
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        setSaveMsg('');
        try {
            const res = await api.put('/users/profile', { phone, address, location, nickname, isPrivate });
            setUser(res.data.user || { ...user, phone, address, location, nickname, isPrivate }, token);
            setSaveMsg('✅ Saqlandi!');
            setTimeout(() => setSaveMsg(''), 2000);
        } catch (err) {
            setSaveMsg('❌ ' + (err.response?.data?.error || 'Error'));
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
            const res = await api.post('/users/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
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
        setTopUpMsg('');
        try {
            const formData = new FormData();
            formData.append('screenshot', screenshot);
            formData.append('amount', topUpAmount || '0');
            const res = await api.post('/users/topup', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setTopUpMsg('✅ ' + (res.data.message || 'Yuborildi! AI tekshirmoqda...'));
            setScreenshot(null);
            setTopUpAmount('');
        } catch (err) {
            setTopUpMsg('❌ ' + (err.response?.data?.error || 'Xato'));
        } finally {
            setUploading(false);
        }
    };

    const canUploadAvatar = user && (user.walletBalance || 0) >= 15000;

    if (!user) {
        return (
            <div className="animate-slide-up" style={{ padding: 40, textAlign: "center" }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>👤</div>
                <h3 style={{ color: "var(--text-primary)", marginBottom: 12 }}>{t('profile_not_ready')}</h3>
                <p style={{ color: "var(--text-secondary)", marginBottom: 24, fontSize: 14 }}>{t('login_prompt')}</p>
                <button onClick={() => window.location.reload()} style={{ background: "var(--brand-accent)", color: "#fff", padding: "12px 24px", borderRadius: 12, border: "none", fontWeight: 700, cursor: "pointer" }}>{t('reload')}</button>
            </div>
        );
    }

    return (
        <div className="animate-slide-up" style={{ padding: 20, paddingBottom: 40 }}>
            {/* Profile Hero */}
            <div style={{ background: `linear-gradient(135deg, rgba(255,107,53,0.1), rgba(255,60,172,0.1))`, borderRadius: 24, padding: 24, marginBottom: 20, textAlign: "center", border: `1px solid rgba(255,107,53,0.2)` }}>
                {/* Avatar */}
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: 12 }}>
                    <div
                        onClick={() => canUploadAvatar && avatarRef.current?.click()}
                        style={{
                            width: 80, height: 80, borderRadius: "50%",
                            background: `linear-gradient(135deg, var(--brand-accent), #FF3CAC)`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 36, boxShadow: "var(--shadow-main)", overflow: 'hidden',
                            cursor: canUploadAvatar ? 'pointer' : 'default',
                            border: canUploadAvatar ? '3px solid var(--brand-accent)' : '3px solid transparent'
                        }}
                    >
                        {user.avatarUrl?.startsWith('data:image')
                            ? <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <span>👤</span>}
                    </div>
                    {canUploadAvatar && (
                        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: '50%', background: 'var(--brand-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff', border: '2px solid var(--bg-primary)' }}>
                            📷
                        </div>
                    )}
                    {uploadingAvatar && <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12 }}>⏳</div>}
                    <input type="file" accept="image/*" ref={avatarRef} onChange={handleAvatarUpload} style={{ display: 'none' }} />
                </div>

                {!canUploadAvatar && (
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 6 }}>
                        🔒 Profil rasm qo'yish: hamyonda kamida ₩15,000 bo'lishi kerak
                    </div>
                )}

                <div style={{ color: "var(--text-primary)", fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 20 }}>
                    {user.nickname || user.firstName} {user.lastName || ''}
                </div>
                <div style={{ color: "var(--text-secondary)", fontSize: 12, marginBottom: 12 }}>@{user.username || 'user'}</div>

                <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
                    <div style={{ textAlign: "center" }}>
                        <div style={{ color: "var(--brand-accent)", fontWeight: 900, fontSize: 18, fontFamily: "'Fraunces', serif" }}>{(user.walletBalance || 0).toLocaleString()}</div>
                        <div style={{ color: "var(--text-secondary)", fontSize: 11 }}>{t('wallet')} (₩)</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                        <div style={{ color: "var(--brand-accent)", fontWeight: 900, fontSize: 18, fontFamily: "'Fraunces', serif" }}>{orderCount}</div>
                        <div style={{ color: "var(--text-secondary)", fontSize: 11 }}>{t('orders')}</div>
                    </div>
                </div>

                {/* Private/Public Toggle */}
                <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{isPrivate ? '🔒 Shaxsiy' : '🌐 Hammaga ochiq'}</span>
                    <button onClick={() => setIsPrivate(!isPrivate)} style={{
                        width: 44, height: 24, borderRadius: 12, border: 'none',
                        background: isPrivate ? 'var(--brand-accent)' : 'var(--card-border)',
                        position: 'relative', cursor: 'pointer', transition: 'background 0.2s'
                    }}>
                        <div style={{
                            width: 18, height: 18, borderRadius: '50%', background: '#fff',
                            position: 'absolute', top: 3,
                            left: isPrivate ? 23 : 3, transition: 'left 0.2s'
                        }} />
                    </button>
                </div>
                {isPrivate && <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>Hamyoningiz boshqalarga ko'rinmaydi</div>}
            </div>

            {/* Editable Profile Fields */}
            <div style={{ background: "var(--card-bg)", borderRadius: 18, padding: 18, marginBottom: 16, border: `1px solid var(--card-border)`, boxShadow: "var(--shadow-main)" }}>
                <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 14, marginBottom: 14 }}>✏️ Ma'lumotlarni tahrirlash</div>

                {/* Nickname */}
                <label style={{ color: "var(--text-secondary)", fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 4 }}>✨ Nickname (taxallus)</label>
                <input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Taxallus kiriting..." style={inputStyle} />

                {/* Phone */}
                <label style={{ color: "var(--text-secondary)", fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 4, marginTop: 12 }}>📱 Telefon raqam</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+8210..." style={inputStyle} />

                {/* Address */}
                <label style={{ color: "var(--text-secondary)", fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 4, marginTop: 12 }}>🏠 Uy manzili</label>
                <input value={address} onChange={e => setAddress(e.target.value)} placeholder="To'liq manzil..." style={inputStyle} />

                {/* Location */}
                <label style={{ color: "var(--text-secondary)", fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6, marginTop: 12 }}>📍 Jonli lokatsiya</label>
                <button onClick={handleGetLocation} disabled={gettingLocation} style={{
                    width: '100%', padding: '12px', borderRadius: 12, border: `1px solid ${location ? 'var(--brand-accent)' : 'var(--card-border)'}`,
                    background: location ? 'rgba(255,107,53,0.1)' : 'var(--card-bg)', color: location ? 'var(--brand-accent)' : 'var(--text-primary)',
                    cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                }}>
                    {gettingLocation ? '⏳ Aniqlanmoqda...' : location ? `✅ Aniqlangan (${location.lat?.toFixed(4)}, ${location.lng?.toFixed(4)})` : '📍 Manzilni aniqlash'}
                </button>

                {/* Save button */}
                <button onClick={handleSaveProfile} disabled={saving} style={{
                    width: '100%', marginTop: 14, padding: '13px', borderRadius: 12, border: 'none',
                    background: 'var(--brand-accent)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                    opacity: saving ? 0.7 : 1
                }}>
                    {saving ? '⏳ Saqlanmoqda...' : `💾 ${t('save')}`}
                </button>
                {saveMsg && <div style={{ textAlign: 'center', marginTop: 8, fontSize: 13, color: 'var(--text-primary)' }}>{saveMsg}</div>}
            </div>

            {/* Wallet Top-Up */}
            <div style={{ background: `linear-gradient(135deg, rgba(78,205,196,0.08), rgba(78,205,196,0.03))`, borderRadius: 18, padding: 18, marginBottom: 16, border: `1px solid rgba(78,205,196,0.2)` }}>
                <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>💰 {t('wallet_balance')} to'ldirish</div>

                {adminCard && (
                    <div style={{ background: 'var(--card-bg)', padding: '12px', borderRadius: '12px', border: '1px solid var(--brand-accent2)', marginBottom: '14px' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>💳 To'lov uchun karta (Admin):</div>
                        <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: 0.5 }}>{adminCard}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>Ushbu raqamga pul o'tkazib, skrinshotni yuklang.</div>
                    </div>
                )}

                <label style={{ color: "var(--text-secondary)", fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 4 }}>Summa (₩)</label>
                <input type="number" value={topUpAmount} onChange={e => setTopUpAmount(e.target.value)} placeholder="10000" style={inputStyle} />

                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    {[5000, 10000, 20000, 50000].map(amt => (
                        <button key={amt} onClick={() => setTopUpAmount(amt.toString())} style={{
                            padding: '6px 12px', borderRadius: 10, border: `1px solid var(--card-border)`,
                            background: topUpAmount === amt.toString() ? 'var(--brand-accent2)' : 'var(--card-bg)',
                            color: topUpAmount === amt.toString() ? '#fff' : 'var(--text-secondary)',
                            fontSize: 12, fontWeight: 600, cursor: 'pointer'
                        }}>₩{amt.toLocaleString()}</button>
                    ))}
                </div>

                <label style={{ color: "var(--text-secondary)", fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 4, marginTop: 12 }}>📸 To'lov screenshoti</label>
                <input type="file" accept="image/*" onChange={e => setScreenshot(e.target.files?.[0])} style={{ color: 'var(--text-primary)', fontSize: 13, marginBottom: 10 }} />

                <button onClick={handleTopUp} disabled={uploading || !screenshot} style={{
                    width: '100%', padding: '13px', borderRadius: 12, border: 'none',
                    background: (!screenshot) ? 'var(--card-border)' : 'var(--brand-accent2)', color: '#fff',
                    fontWeight: 700, fontSize: 14, cursor: (!screenshot) ? 'not-allowed' : 'pointer'
                }}>
                    {uploading ? '⏳ AI tekshirmoqda...' : '💳 To\'lovni yuborish'}
                </button>
                {topUpMsg && <div style={{ textAlign: 'center', marginTop: 8, fontSize: 13, color: 'var(--text-primary)' }}>{topUpMsg}</div>}
            </div>

            {/* Delivery Zone */}
            <div style={{ background: "var(--card-bg)", borderRadius: 16, padding: 16, marginBottom: 14, border: `1px solid var(--card-border)`, boxShadow: "var(--shadow-main)" }}>
                <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 14, marginBottom: 10 }}>📍 {t('delivery_zone')}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: (user.distanceFromRestaurant || 0) <= 1 ? "#27AE60" : "#F5A623" }} />
                    <span style={{ color: "var(--text-primary)", fontSize: 13 }}>{user.address || 'Manzil kiritilmagan'} · {(user.distanceFromRestaurant || 0).toFixed(1)}km</span>
                    <span style={{ marginLeft: "auto", color: (user.distanceFromRestaurant || 0) <= 1 ? "#27AE60" : "#F5A623", fontSize: 12, fontWeight: 700 }}>
                        {(user.distanceFromRestaurant || 0) <= 1 ? t('free_zone') : `₩3,000`}
                    </span>
                </div>
            </div>

            {/* Language Selector */}
            <div style={{ background: "var(--card-bg)", borderRadius: 16, padding: 16, marginBottom: 14, border: `1px solid var(--card-border)`, boxShadow: "var(--shadow-main)" }}>
                <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>🌐 {t('language')}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {LANG_LIST.map(l => (
                        <button key={l.code} onClick={() => setLang(l.code)} style={{
                            padding: "7px 12px", borderRadius: 20,
                            border: `1.5px solid ${lang === l.code ? 'var(--brand-accent)' : 'var(--card-border)'}`,
                            background: lang === l.code ? `rgba(255,107,53,0.1)` : "transparent",
                            color: lang === l.code ? 'var(--brand-accent)' : 'var(--text-secondary)',
                            fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.2s"
                        }}>{l.flag} {l.name}</button>
                    ))}
                </div>
            </div>

            <button onClick={logout} style={{ width: "100%", background: "transparent", border: `1.5px solid var(--card-border)`, color: "#e74c3c", borderRadius: 14, padding: "14px 0", fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 10 }}>
                {t('logout')}
            </button>
        </div>
    );
};

const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: 12,
    border: '1px solid var(--card-border)', background: 'var(--bg-secondary)',
    color: 'var(--text-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box'
};

export default ProfilePage;
