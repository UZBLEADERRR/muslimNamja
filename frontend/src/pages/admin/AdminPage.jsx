import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n';
import api from '../../utils/api';
import { colors } from './adminStyles';
import OverviewTab from './OverviewTab';
import OperationsTab from './OperationsTab';
import AITab from './AITab';
import UsersTab from './UsersTab';
import SettingsTab from './SettingsTab';

const tg = window.Telegram?.WebApp;

const AdminPage = () => {
    const { t, lang } = useTranslation();
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(false);

    // Data states
    const [dashStats, setDashStats] = useState(null);
    const [orders, setOrders] = useState({ orders: [], stats: {} });
    const [products, setProducts] = useState([]);
    const [usersData, setUsersData] = useState({ users: [], total: 0 });
    const [fullStats, setFullStats] = useState(null);
    const [profitData, setProfitData] = useState(null);
    const [aiInventory, setAiInventory] = useState(null);
    const [paymentRequests, setPaymentRequests] = useState([]);
    const [auditLog, setAuditLog] = useState([]);

    // Settings states
    const [bankCard, setBankCard] = useState('');
    const [meetupSpots, setMeetupSpots] = useState([]);
    const [adBanners, setAdBanners] = useState([]);
    const [broadcastMsg, setBroadcastMsg] = useState('');
    const [broadcasting, setBroadcasting] = useState(false);
    const [isStoreOpen, setIsStoreOpen] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'overview') {
                const [resDash, resOrd] = await Promise.all([
                    api.get('/admin/dashboard').catch(() => ({ data: {} })),
                    api.get('/admin/orders')
                ]);
                setDashStats(resDash.data);
                setOrders(resOrd.data || { orders: [], stats: {} });
            } else if (activeTab === 'operations') {
                const [resOrd, resProd] = await Promise.all([
                    api.get('/admin/orders'),
                    api.get('/admin/products')
                ]);
                setOrders(resOrd.data || { orders: [], stats: {} });
                setProducts(resProd.data || []);
            } else if (activeTab === 'ai') {
                const [resProd, resProfit] = await Promise.all([
                    api.get('/admin/products'),
                    api.get('/admin/profit').catch(() => ({ data: null }))
                ]);
                setProducts(resProd.data || []);
                setProfitData(resProfit.data);
            } else if (activeTab === 'users') {
                const [resUsers, resStats, resPay] = await Promise.all([
                    api.get('/admin/users'),
                    api.get('/admin/stats'),
                    api.get('/admin/payment-requests')
                ]);
                setUsersData(resUsers.data || { users: [], total: 0 });
                setFullStats(resStats.data);
                setPaymentRequests(resPay.data || []);
            } else if (activeTab === 'settings') {
                const resAudit = await api.get('/admin/audit-log').catch(() => ({ data: [] }));
                setAuditLog(resAudit.data || []);
            }

            // Always fetch common settings
            const [cardRes, storeRes, spotRes, adRes] = await Promise.all([
                api.get('/admin/settings/adminBankCard').catch(() => ({ data: '' })),
                api.get('/admin/settings/isStoreOpen').catch(() => ({ data: null })),
                api.get('/admin/settings/meetupSpots').catch(() => ({ data: null })),
                api.get('/admin/settings/adBanners').catch(() => ({ data: null })),
            ]);
            if (cardRes.data) {
                let v = cardRes.data;
                if (typeof v === 'string' && v.startsWith('"')) v = JSON.parse(v);
                setBankCard(v);
            }
            if (storeRes.data !== null && storeRes.data !== undefined) setIsStoreOpen(storeRes.data === 'true');
            if (spotRes.data?.value) { try { setMeetupSpots(JSON.parse(spotRes.data.value)); } catch (e) { } }
            if (adRes.data) { try { setAdBanners(JSON.parse(adRes.data)); } catch (e) { } }
        } catch (err) {
            console.error('Admin fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [activeTab]);

    // Handle Telegram Back Button
    useEffect(() => {
        if (tg) {
            if (activeTab === 'overview') {
                tg.BackButton?.hide();
            } else {
                tg.BackButton?.show();
            }
            const handleBack = () => setActiveTab('overview');
            tg.onEvent('backButtonClicked', handleBack);
            return () => {
                tg.offEvent('backButtonClicked', handleBack);
            };
        }
    }, [activeTab]);

    // Handlers
    const handleUpdateOrderStatus = async (id, status) => {
        try { await api.put(`/admin/orders/${id}`, { status }); fetchData(); } catch { alert("Xatolik"); }
    };
    const handleDeleteProduct = async (id) => {
        if (!confirm("O'chirasizmi?")) return;
        try { await api.delete(`/admin/products/${id}`); setProducts(p => p.filter(x => x.id !== id)); } catch { alert("Xatolik"); }
    };
    const handleAddProduct = async (data) => {
        try {
            const fd = new FormData();
            fd.append('name', JSON.stringify({ uz: data.nameUz, ko: data.nameKo }));
            fd.append('description', JSON.stringify({ uz: data.descUz || '', ko: data.descKo || '' }));
            fd.append('price', data.price);
            fd.append('category', data.category);
            fd.append('minOrderQuantity', data.minOrderQuantity || 1);
            if (data.stock) fd.append('stock', data.stock);
            if (data.ingredientCost) fd.append('ingredientCost', data.ingredientCost);
            if (data.image) fd.append('image', data.image);
            await api.post('/admin/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            fetchData();
        } catch { alert("Qo'shishda xatolik"); }
    };
    const handleSeed = async () => {
        try { const r = await api.post('/admin/seed'); alert(r.data.message); fetchData(); } catch (e) { alert(e.response?.data?.error || 'Xatolik'); }
    };
    const handleUpdateExpense = async (id, val) => {
        try { await api.put(`/admin/products/${id}`, { ingredientCost: parseFloat(val) }); fetchData(); } catch { alert("Xatolik"); }
    };
    const handleRoleChange = async (userId, role) => {
        try { await api.post('/admin/role', { userId, role }); fetchData(); } catch { alert("Xatolik"); }
    };
    const handlePaymentAction = async (id, action) => {
        try { await api.put(`/admin/payment-requests/${id}`, { action }); alert(`To'lov ${action === 'approve' ? 'tasdiqlandi' : 'rad etildi'}!`); fetchData(); } catch { alert("Xatolik"); }
    };
    const handleBalanceChange = async (userId, amount) => {
        try { await api.post(`/admin/users/${userId}/balance`, { amount }); alert('Balans yangilandi!'); fetchData(); } catch { alert("Xatolik"); }
    };
    const saveBankCard = async () => {
        try { await api.post('/admin/settings', { key: 'adminBankCard', value: bankCard }); alert('Saqlandi!'); } catch { alert("Xatolik"); }
    };
    const handleAddSpot = async (name) => {
        const u = [...meetupSpots, name]; setMeetupSpots(u);
        await api.post('/admin/settings', { key: 'meetupSpots', value: JSON.stringify(u) });
    };
    const handleRemoveSpot = async (spot) => {
        const u = meetupSpots.filter(s => s !== spot); setMeetupSpots(u);
        await api.post('/admin/settings', { key: 'meetupSpots', value: JSON.stringify(u) });
    };
    const handleBroadcast = async () => {
        if (!broadcastMsg.trim()) return;
        setBroadcasting(true);
        try { const r = await api.post('/admin/broadcast', { message: broadcastMsg }); alert(r.data.message); setBroadcastMsg(''); } catch { alert("Xatolik"); }
        finally { setBroadcasting(false); }
    };
    const handleToggleStore = async () => {
        const v = !isStoreOpen; setIsStoreOpen(v);
        try { await api.post('/admin/settings', { key: 'isStoreOpen', value: String(v) }); } catch { alert('Xatolik'); setIsStoreOpen(!v); }
    };
    const handleAddAd = async (text, image) => {
        try {
            const fd = new FormData(); fd.append('text', text || '');
            if (image) fd.append('image', image);
            const r = await api.post('/admin/ads', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setAdBanners(r.data.banners);
        } catch { alert("Xatolik"); }
    };
    const handleDeleteAd = async (id) => {
        if (!confirm("O'chirasizmi?")) return;
        try { const r = await api.delete(`/admin/ads/${id}`); setAdBanners(r.data.banners); } catch { alert("Xatolik"); }
    };
    const fetchAiInventory = async () => {
        setLoading(true);
        try { const r = await api.get('/admin/ai-inventory'); setAiInventory(r.data); } catch { alert("AI xatolik"); }
        finally { setLoading(false); }
    };
    const handleQuickAction = (action) => {
        if (action === 'broadcast') setActiveTab('settings');
        else if (action === 'payments') setActiveTab('users');
        else if (action === 'alerts') setActiveTab('ai');
        else if (action === 'report') setActiveTab('operations');
    };

    const tabs = [
        { id: 'overview', icon: '⚡', label: 'Bosh' },
        { id: 'operations', icon: '📦', label: 'Operatsiya' },
        { id: 'ai', icon: '🧠', label: 'AI' },
        { id: 'users', icon: '👥', label: 'Userlar' },
        { id: 'settings', icon: '⚙️', label: 'Sozlama' },
    ];

    return (
        <div style={{ background: colors.bg, minHeight: '100vh', paddingBottom: 80 }}>
            {/* Header */}
            <div style={{
                position: 'sticky', top: 0, zIndex: 100, padding: '14px 16px',
                background: 'rgba(8,12,20,0.95)', backdropFilter: 'blur(12px)',
                borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {activeTab !== 'overview' && (
                        <button onClick={() => setActiveTab('overview')} style={{
                            width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.1)', cursor: 'pointer',
                            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
                        }}>
                            ←
                        </button>
                    )}
                    {activeTab === 'overview' && (
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${colors.accent}, ${colors.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🛡️</div>
                    )}
                    <div>
                        <div style={{ color: colors.text, fontWeight: 800, fontSize: 15 }}>Muslim Namja Admin</div>
                        <div style={{ color: colors.subtext, fontSize: 10, fontWeight: 600 }}>{new Date().toLocaleTimeString()} · 🟢 Online</div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div style={{ padding: '16px 14px' }}>
                {loading && activeTab !== 'ai' && <div style={{ textAlign: 'center', padding: 30, color: colors.subtext }}>⏳ Yuklanmoqda...</div>}

                {activeTab === 'overview' && !loading && <OverviewTab dashStats={dashStats} orders={orders} onQuickAction={handleQuickAction} onUpdateOrderStatus={handleUpdateOrderStatus} />}
                {activeTab === 'operations' && !loading && <OperationsTab orders={orders} products={products} onUpdateOrderStatus={handleUpdateOrderStatus} onDeleteProduct={handleDeleteProduct} onAddProduct={handleAddProduct} onSeed={handleSeed} onUpdateExpense={handleUpdateExpense} lang={lang} />}
                {activeTab === 'ai' && <AITab products={products} aiInventory={aiInventory} onFetchAiInventory={fetchAiInventory} loading={loading} profitData={profitData} fullStats={fullStats} />}
                {activeTab === 'users' && !loading && <UsersTab usersData={usersData} paymentRequests={paymentRequests} onRoleChange={handleRoleChange} onPaymentAction={handlePaymentAction} onBalanceChange={handleBalanceChange} fullStats={fullStats} />}
                {activeTab === 'settings' && !loading && <SettingsTab bankCard={bankCard} onSaveBankCard={saveBankCard} onBankCardChange={setBankCard} meetupSpots={meetupSpots} onAddSpot={handleAddSpot} onRemoveSpot={handleRemoveSpot} adBanners={adBanners} onAddAd={handleAddAd} onDeleteAd={handleDeleteAd} broadcastMsg={broadcastMsg} onBroadcastChange={setBroadcastMsg} onBroadcast={handleBroadcast} broadcasting={broadcasting} isStoreOpen={isStoreOpen} onToggleStore={handleToggleStore} auditLog={auditLog} />}
            </div>

            {/* Bottom Navigation */}
            <div style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
                background: 'rgba(8,12,20,0.97)', backdropFilter: 'blur(12px)',
                borderTop: `1px solid ${colors.border}`, display: 'flex',
                padding: '6px 4px', paddingBottom: 'max(6px, env(safe-area-inset-bottom))'
            }}>
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                        padding: '8px 0', background: 'none', border: 'none', cursor: 'pointer',
                        color: activeTab === tab.id ? colors.accent : colors.subtext,
                        transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif",
                    }}>
                        <span style={{ fontSize: 20, lineHeight: 1, filter: activeTab === tab.id ? 'drop-shadow(0 0 8px rgba(0,212,255,0.5))' : 'none' }}>{tab.icon}</span>
                        <span style={{ fontSize: 10, fontWeight: activeTab === tab.id ? 800 : 600 }}>{tab.label}</span>
                        {activeTab === tab.id && <div style={{ width: 20, height: 3, borderRadius: 2, background: colors.accent, marginTop: 1 }} />}
                    </button>
                ))}
            </div>

            {/* Animations CSS */}
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default AdminPage;
