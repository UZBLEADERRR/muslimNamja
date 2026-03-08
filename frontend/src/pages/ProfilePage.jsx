import React, { useState, useEffect } from 'react';
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
    const { user, logout, setLang } = useAppStore();
    const [orderCount, setOrderCount] = useState(0);

    useEffect(() => {
        if (user) {
            api.get('/orders/my')
                .then(res => setOrderCount(res.data?.length || 0))
                .catch(() => { });
        }
    }, [user]);

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
        <div className="animate-slide-up" style={{ padding: 20 }}>
            {/* Profile Hero */}
            <div style={{ background: `linear-gradient(135deg, rgba(255,107,53,0.1), rgba(255,60,172,0.1))`, borderRadius: 24, padding: 24, marginBottom: 20, textAlign: "center", border: `1px solid rgba(255,107,53,0.2)` }}>
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: `linear-gradient(135deg, var(--brand-accent), #FF3CAC)`, margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, boxShadow: "var(--shadow-main)" }}>👤</div>
                <div style={{ color: "var(--text-primary)", fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 20 }}>{user.firstName} {user.lastName || ''}</div>
                <div style={{ color: "var(--text-secondary)", fontSize: 12, marginBottom: 12 }}>@{user.username || 'user'}</div>
                <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
                    <div style={{ textAlign: "center" }}><div style={{ color: "var(--brand-accent)", fontWeight: 900, fontSize: 18, fontFamily: "'Fraunces', serif" }}>{(user.walletBalance || 0).toLocaleString()}</div><div style={{ color: "var(--text-secondary)", fontSize: 11 }}>{t('wallet')} (₩)</div></div>
                    <div style={{ textAlign: "center" }}><div style={{ color: "var(--brand-accent)", fontWeight: 900, fontSize: 18, fontFamily: "'Fraunces', serif" }}>{orderCount}</div><div style={{ color: "var(--text-secondary)", fontSize: 11 }}>{t('orders')}</div></div>
                </div>
            </div>

            {/* Delivery Zone */}
            <div style={{ background: "var(--card-bg)", borderRadius: 16, padding: 16, marginBottom: 14, border: `1px solid var(--card-border)`, boxShadow: "var(--shadow-main)" }}>
                <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 14, marginBottom: 10 }}>📍 {t('delivery_zone')}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#27AE60" }} />
                    <span style={{ color: "var(--text-primary)", fontSize: 13 }}>{user.address || 'Sejong Campus'} · {(user.distanceFromRestaurant || 0).toFixed(1)}km</span>
                    <span style={{ marginLeft: "auto", color: "#27AE60", fontSize: 12, fontWeight: 700 }}>{t('free_zone')}</span>
                </div>
            </div>

            {/* Language Selector */}
            <div style={{ background: "var(--card-bg)", borderRadius: 16, padding: 16, marginBottom: 14, border: `1px solid var(--card-border)`, boxShadow: "var(--shadow-main)" }}>
                <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>🌐 {t('language')}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {LANG_LIST.map(l => (
                        <button
                            key={l.code}
                            onClick={() => setLang(l.code)}
                            style={{
                                padding: "7px 12px", borderRadius: 20,
                                border: `1.5px solid ${lang === l.code ? 'var(--brand-accent)' : 'var(--card-border)'}`,
                                background: lang === l.code ? `rgba(255,107,53,0.1)` : "transparent",
                                color: lang === l.code ? 'var(--brand-accent)' : 'var(--text-secondary)',
                                fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.2s"
                            }}>
                            {l.flag} {l.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Referral */}
            <div style={{ background: `linear-gradient(135deg, rgba(78,205,196,0.1), rgba(78,205,196,0.05))`, border: `1px solid rgba(78,205,196,0.2)`, borderRadius: 16, padding: 16, marginBottom: 14 }}>
                <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>🎁 {t('referral')}</div>
                <div style={{ color: "var(--text-secondary)", fontSize: 12, marginBottom: 12 }}>{t('referral_desc')}</div>
                <div style={{ background: "rgba(0,0,0,0.1)", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: 16, letterSpacing: 2 }}>{user.username ? user.username.toUpperCase() + '25' : 'SEJONG25'}</span>
                    <button onClick={() => navigator.clipboard?.writeText(user.username ? user.username.toUpperCase() + '25' : 'SEJONG25')} style={{ background: "var(--brand-accent2)", color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{t('copy')}</button>
                </div>
            </div>

            <button onClick={logout} style={{ width: "100%", background: "transparent", border: `1.5px solid var(--card-border)`, color: "#e74c3c", borderRadius: 14, padding: "14px 0", fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 10 }}>
                {t('logout')}
            </button>
        </div>
    );
};

export default ProfilePage;
