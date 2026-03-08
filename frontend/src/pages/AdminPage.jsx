import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import api from '../utils/api';

const AdminPage = () => {
    const { t, lang } = useTranslation();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState({ orders: [], stats: {} });
    const [users, setUsers] = useState({ users: [], total: 0 });
    const [loading, setLoading] = useState(false);

    const fetchData = async (tab) => {
        setLoading(true);
        try {
            if (tab === 'dashboard' || tab === 'products') {
                const res = await api.get('/admin/products');
                setProducts(res.data || []);
            }
            if (tab === 'dashboard') {
                const res = await api.get('/admin/orders');
                setOrders(res.data || { orders: [], stats: {} });
            }
            if (tab === 'users') {
                const res = await api.get('/admin/users');
                setUsers(res.data || { users: [], total: 0 });
            }
        } catch (err) {
            console.error('Admin fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(activeTab); }, [activeTab]);

    const handleSeed = async () => {
        try {
            const res = await api.post('/admin/seed');
            alert(res.data.message);
            fetchData('products');
        } catch (err) {
            alert(err.response?.data?.error || 'Seed failed');
        }
    };

    const handleDeleteProduct = async (id) => {
        if (!confirm('Delete this product?')) return;
        try {
            await api.delete(`/admin/products/${id}`);
            setProducts(prev => prev.filter(p => p.id !== id));
        } catch (err) {
            alert('Failed to delete');
        }
    };

    const handleRoleChange = async (userId, role) => {
        try {
            await api.post('/admin/role', { userId, role });
            fetchData('users');
        } catch (err) {
            alert('Failed to update role');
        }
    };

    const getName = (product) => {
        if (typeof product.name === 'object') return product.name[lang] || product.name.en || Object.values(product.name)[0];
        return product.name;
    };

    const stats = orders.stats || {};

    return (
        <div className="animate-slide-up" style={{ padding: '20px', paddingBottom: '40px' }}>
            <h2 style={{ fontSize: '24px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-primary)', fontFamily: "'Fraunces', serif" }}>
                <div style={{ background: 'var(--brand-accent)', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(255,107,53,0.3)' }}>
                    <span style={{ fontSize: 20 }}>🛡️</span>
                </div>
                {t('admin_panel')}
            </h2>

            {/* Tabs */}
            <div className="hide-scrollbar" style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginBottom: '24px', paddingBottom: '4px' }}>
                {['dashboard', 'products', 'users', 'finance'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={{
                        padding: '10px 20px', borderRadius: '16px', textTransform: 'capitalize', whiteSpace: 'nowrap',
                        background: activeTab === tab ? 'var(--brand-accent)' : 'var(--card-bg)',
                        color: activeTab === tab ? '#fff' : 'var(--text-secondary)',
                        border: activeTab === tab ? 'none' : '1px solid var(--card-border)',
                        fontWeight: 700, fontSize: '13px', transition: 'all 0.3s ease',
                        boxShadow: activeTab === tab ? '0 4px 12px rgba(255,107,53,0.3)' : 'none'
                    }}>
                        {t(tab)}
                    </button>
                ))}
            </div>

            {loading && <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-secondary)' }}>{t('loading')}</div>}

            {/* Dashboard */}
            {activeTab === 'dashboard' && !loading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <StatCard label={t('active_orders')} value={stats.pending || 0} color="var(--brand-accent)" />
                        <StatCard label={t('delivered')} value={stats.completed || 0} color="var(--brand-accent2)" />
                    </div>
                    <StatCard label={t('products')} value={products.length} color="#8E44AD" />

                    <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', marginTop: 8 }}>{t('recent_activity')}</h3>
                    {orders.orders?.slice(0, 5).map((order, i) => (
                        <div key={order.id || i} style={{ padding: '14px 16px', borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-main)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 13 }}>Order #{(order.id || '').toString().slice(0, 8)}</span>
                                <span style={{ color: order.status === 'completed' ? '#27AE60' : 'var(--brand-accent)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>{order.status}</span>
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>₩{(order.totalAmount || 0).toLocaleString()} · {new Date(order.createdAt).toLocaleDateString()}</div>
                        </div>
                    ))}
                    {(!orders.orders || orders.orders.length === 0) && (
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: 13 }}>No orders yet</p>
                    )}
                </div>
            )}

            {/* Products */}
            {activeTab === 'products' && !loading && (
                <div>
                    <button onClick={handleSeed} style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)', padding: '14px', borderRadius: '16px', width: '100%', marginBottom: '16px', fontWeight: 700, cursor: 'pointer', border: 'none' }}>
                        🌱 {t('seed_menu')}
                    </button>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {products.length === 0 && <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>{t('no_products')}</p>}
                        {products.map(p => (
                            <div key={p.id} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '16px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-main)' }}>
                                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                    <span style={{ fontSize: 24 }}>{p.imageUrl || '🍽️'}</span>
                                    <div>
                                        <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 14 }}>{getName(p)}</div>
                                        <div style={{ color: 'var(--brand-accent)', fontSize: 12, fontWeight: 600 }}>₩{p.price?.toLocaleString()} · {p.category}</div>
                                    </div>
                                </div>
                                <button onClick={() => handleDeleteProduct(p.id)} style={{ background: 'rgba(231,76,60,0.1)', color: '#E74C3C', border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>{t('delete')}</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Users */}
            {activeTab === 'users' && !loading && (
                <div>
                    <div style={{ padding: '20px', borderRadius: '20px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', marginBottom: '16px', textAlign: 'center', boxShadow: 'var(--shadow-main)' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{t('registered_users')}</div>
                        <div style={{ color: 'var(--brand-accent)', fontSize: 32, fontWeight: 900, fontFamily: "'Fraunces', serif" }}>{users.total}</div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {users.users?.map(u => (
                            <div key={u.id} style={{ padding: '14px 16px', borderRadius: 14, background: 'var(--card-bg)', border: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-main)' }}>
                                <div>
                                    <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 13 }}>{u.firstName} {u.lastName || ''}</div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: 11 }}>@{u.username || '—'} · {u.phone || 'No phone'}</div>
                                </div>
                                <select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)} style={{
                                    background: u.role === 'admin' ? 'var(--brand-accent)' : u.role === 'delivery' ? 'var(--brand-accent2)' : 'var(--card-bg)',
                                    color: u.role !== 'user' ? '#fff' : 'var(--text-primary)',
                                    border: '1px solid var(--card-border)', borderRadius: 8, padding: '4px 8px', fontSize: 11, fontWeight: 700
                                }}>
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                    <option value="delivery">Delivery</option>
                                </select>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Finance */}
            {activeTab === 'finance' && <FinanceTab t={t} />}
        </div>
    );
};

const StatCard = ({ label, value, color }) => (
    <div style={{ flex: 1, padding: '18px', borderRadius: '18px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-main)', textAlign: 'center' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
        <div style={{ color, fontSize: 28, fontWeight: 900, fontFamily: "'Fraunces', serif" }}>{value}</div>
    </div>
);

const FinanceTab = ({ t }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchProfit = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get('/admin/profit');
            setData(res.data);
        } catch (err) {
            setError('Failed to fetch finance report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '20px', borderRadius: '20px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-main)' }}>
                <button onClick={fetchProfit} disabled={loading} style={{ background: 'var(--brand-accent)', color: '#fff', border: 'none', padding: '14px', borderRadius: '14px', width: '100%', fontWeight: 700, cursor: 'pointer' }}>
                    {loading ? t('analyzing') : t('generate_report')}
                </button>
            </div>

            {data && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <StatCard label={t('revenue')} value={`${(data.totalRevenue || 0).toLocaleString()}₩`} color="#27AE60" />
                        <StatCard label={t('expenses')} value={`${((data.totalIngredientCost || 0) + (data.totalDeliveryPay || 0)).toLocaleString()}₩`} color="#E74C3C" />
                    </div>
                    <StatCard label={t('net_profit')} value={`${(data.netProfit || 0).toLocaleString()}₩`} color="var(--brand-accent)" />

                    {data.aiSummary && (
                        <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(78,205,196,0.1)', border: '1px solid var(--brand-accent2)' }}>
                            <div style={{ fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)', fontSize: '13px' }}>{t('ai_conclusion')}</div>
                            <div style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--text-secondary)' }}>{data.aiSummary}</div>
                        </div>
                    )}
                </div>
            )}
            {error && <p style={{ color: '#E74C3C', textAlign: 'center', fontSize: '13px' }}>{error}</p>}
        </div>
    );
};

export default AdminPage;
