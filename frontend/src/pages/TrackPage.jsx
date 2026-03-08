import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import api from '../utils/api';

const TrackPage = () => {
    const { t } = useTranslation();
    const { user } = useAppStore();
    const [activeOrder, setActiveOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            api.get('/orders/my')
                .then(res => {
                    const orders = res.data || [];
                    // Find the most recent non-completed order
                    const active = orders.find(o => o.status !== 'completed' && o.status !== 'cancelled');
                    setActiveOrder(active || null);
                })
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [user]);

    const getStepIndex = (status) => {
        const map = { 'pending': 0, 'preparing': 1, 'delivering': 2, 'completed': 3 };
        return map[status] || 0;
    };

    const steps = [
        { icon: "🧑‍🍳", label: t('preparing') },
        { icon: "📦", label: t('picked_up') },
        { icon: "🛵", label: t('on_the_way') },
        { icon: "🏠", label: t('arrived') },
    ];

    if (loading) {
        return (
            <div className="animate-slide-up" style={{ padding: 20, textAlign: 'center', paddingTop: 60 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📍</div>
                <p style={{ color: "var(--text-secondary)" }}>{t('loading')}</p>
            </div>
        );
    }

    if (!activeOrder) {
        return (
            <div className="animate-slide-up" style={{ padding: 20, textAlign: 'center', paddingTop: 60 }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>📦</div>
                <h3 style={{ color: "var(--text-primary)", fontFamily: "'Fraunces', serif", marginBottom: 8 }}>{t('live_tracking')}</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>{t('no_orders')}</p>
            </div>
        );
    }

    const currentStep = getStepIndex(activeOrder.status);

    return (
        <div className="animate-slide-up" style={{ padding: 20 }}>
            <h2 style={{ color: "var(--text-primary)", fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 900, marginBottom: 4 }}>
                {t('live_tracking')} 📍
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 20 }}>
                Order #{(activeOrder.id || '').toString().slice(0, 8)} · ₩{(activeOrder.totalAmount || 0).toLocaleString()}
            </p>

            {/* Map-like Area */}
            <div style={{ background: "linear-gradient(135deg, rgba(39,174,96,0.1) 0%, rgba(39,174,96,0.02) 100%)", borderRadius: 20, height: 180, marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", border: `1px solid rgba(39,174,96,0.2)` }}>
                <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(circle at 30% 60%, rgba(39,174,96,0.2) 0%, transparent 60%), radial-gradient(circle at 70% 30%, rgba(39,174,96,0.1) 0%, transparent 50%)` }} />
                <div style={{ textAlign: "center", zIndex: 1, padding: 20, background: "var(--glass-header)", borderRadius: 20, backdropFilter: "blur(10px)", border: "1px solid var(--card-border)", boxShadow: "var(--shadow-main)" }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>{currentStep >= 2 ? '🛵' : '👨‍🍳'}</div>
                    <div style={{ color: "var(--text-primary)", fontSize: 14, fontWeight: 700 }}>
                        {activeOrder.status === 'pending' ? t('preparing') + '...' :
                            activeOrder.status === 'preparing' ? t('preparing') + '...' :
                                activeOrder.status === 'delivering' ? t('on_the_way') + '!' : t('arrived')}
                    </div>
                    <div style={{ color: "var(--brand-accent2)", fontSize: 13, fontWeight: 800 }}>
                        {activeOrder.distance ? `${activeOrder.distance.toFixed(1)}km` : ''}
                    </div>
                </div>
            </div>

            {/* Progress Steps */}
            <div style={{ background: "var(--card-bg)", borderRadius: 18, padding: 18, border: `1px solid var(--card-border)`, boxShadow: "var(--shadow-main)", marginBottom: 14 }}>
                {steps.map((s, i) => {
                    const done = i <= currentStep;
                    const active = i === currentStep;
                    return (
                        <div key={i} style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: i < 3 ? 16 : 0 }}>
                            <div style={{ width: 40, height: 40, borderRadius: "50%", background: done ? 'var(--brand-accent)' : active ? `rgba(255,107,53,0.2)` : 'rgba(255,255,255,0.05)', display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, border: active ? `2px solid var(--brand-accent)` : "none", color: done ? '#fff' : 'inherit' }}>
                                {done && i < currentStep ? "✓" : s.icon}
                            </div>
                            <div>
                                <div style={{ color: done || active ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: active ? 700 : 500, fontSize: 14 }}>{s.label}</div>
                                {active && <div style={{ color: "var(--brand-accent)", fontSize: 11, fontWeight: 600 }}>{t('in_progress')}</div>}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Order Items */}
            <div style={{ background: "var(--card-bg)", borderRadius: 18, padding: 16, border: `1px solid var(--card-border)`, boxShadow: "var(--shadow-main)" }}>
                <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 14, marginBottom: 12 }}>{t('your_cart')}</div>
                {(activeOrder.items || []).map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < activeOrder.items.length - 1 ? '1px solid var(--card-border)' : 'none' }}>
                        <span style={{ color: 'var(--text-primary)', fontSize: 13 }}>{item.productName || 'Item'} x{item.quantity || 1}</span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>₩{((item.price || 0) * (item.quantity || 1)).toLocaleString()}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TrackPage;
