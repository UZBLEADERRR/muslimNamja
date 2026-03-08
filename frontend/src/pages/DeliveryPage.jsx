import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import api from '../utils/api';
import { Truck, Package, CheckCircle, MapPin } from 'lucide-react';

const DeliveryPage = () => {
    const { t } = useTranslation();
    const [orders, setOrders] = useState([]);
    const [activeOrder, setActiveOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/delivery/available')
            .then(res => setOrders(res.data || []))
            .catch(err => console.error('Fetch delivery orders:', err))
            .finally(() => setLoading(false));
    }, []);

    const handleAccept = async (order) => {
        try {
            await api.post(`/delivery/accept/${order.id}`);
            setActiveOrder(order);
            setOrders(prev => prev.filter(o => o.id !== order.id));
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to accept');
        }
    };

    const handleComplete = async () => {
        if (!activeOrder) return;
        try {
            await api.post(`/delivery/complete/${activeOrder.id}`);
            setActiveOrder(null);
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to complete');
        }
    };

    return (
        <div className="animate-slide-up" style={{ padding: '20px', paddingBottom: '40px' }}>
            <h2 style={{ fontSize: '24px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-primary)', fontFamily: "'Fraunces', serif" }}>
                <div style={{ background: 'var(--brand-accent2)', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(78,205,196,0.3)' }}>
                    <Truck size={20} color="white" />
                </div>
                {t('delivery_dashboard')}
            </h2>

            {activeOrder && (
                <div style={{ background: 'linear-gradient(135deg, var(--brand-accent), #FF3CAC)', color: 'white', padding: '24px', borderRadius: '24px', marginBottom: '32px', boxShadow: '0 8px 24px rgba(255,107,53,0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, letterSpacing: 1 }}>{t('active_delivery')}</span>
                    </div>

                    <h3 style={{ margin: '0 0 6px 0', fontSize: '14px', opacity: 0.9 }}>{t('delivery_to')}</h3>
                    <p style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 700, fontFamily: "'Fraunces', serif" }}>{activeOrder.user?.address || 'Address'}</p>

                    <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                        <a href={`tel:${activeOrder.user?.phone}`} style={{ flex: 1, background: 'rgba(255,255,255,0.2)', color: '#fff', textDecoration: 'none', padding: '12px', borderRadius: '14px', textAlign: 'center', fontWeight: 700, fontSize: '13px' }}>
                            {t('call_customer')}
                        </a>
                    </div>

                    <button onClick={handleComplete} style={{ width: '100%', background: '#fff', color: 'var(--brand-accent)', border: 'none', padding: '14px', borderRadius: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                        <CheckCircle size={18} /> {t('complete_delivery')}
                    </button>
                </div>
            )}

            <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)', fontSize: '18px' }}>{t('available_orders')} ({orders.length})</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>{t('loading')}</div>
                ) : orders.length === 0 && !activeOrder ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{t('no_orders')}</p>
                    </div>
                ) : (
                    orders.map(order => (
                        <div key={order.id} style={{ padding: '20px', borderRadius: '20px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-main)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                                <span style={{ fontWeight: 900, fontSize: '20px', color: 'var(--brand-accent)', fontFamily: "'Fraunces', serif" }}>₩{(order.totalAmount || 0).toLocaleString()}</span>
                                <span style={{ color: 'var(--brand-accent2)', background: 'rgba(78,205,196,0.1)', padding: '6px 12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700 }}>
                                    <MapPin size={14} /> {(order.distance || 0).toFixed(1)} km
                                </span>
                            </div>
                            <button
                                onClick={() => handleAccept(order)}
                                disabled={!!activeOrder}
                                style={{ width: '100%', padding: '14px', borderRadius: '14px', border: 'none', background: !!activeOrder ? 'var(--card-border)' : 'var(--text-primary)', color: 'var(--bg-primary)', fontWeight: 700, cursor: !!activeOrder ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
                            >
                                {t('accept')}
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DeliveryPage;
