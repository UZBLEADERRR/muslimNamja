import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../../i18n';
import api from '../../utils/api';
import { colors, cardStyle, inputStyle, btnPrimary, btnDanger, btnSuccess, chipStyle, kpiCard, badge, sectionTitle, subText, mainText, bigNum } from './adminStyles';
import AdminInbox from './AdminInbox';

const tg = window.Telegram?.WebApp;

const AdminPage = () => {
    const { t, lang } = useTranslation();
    const [activeTab, setActiveTab] = useState('analytics');
    const [loading, setLoading] = useState(false);

    // Data states
    const [dashStats, setDashStats] = useState(null);
    const [expandedStats, setExpandedStats] = useState(null);
    const [timeframe, setTimeframe] = useState('weekly');
    const [orders, setOrders] = useState({ orders: [], stats: {} });
    const [products, setProducts] = useState([]);
    const [usersData, setUsersData] = useState({ users: [], total: 0 });
    const [paymentRequests, setPaymentRequests] = useState([]);

    // Settings states
    const [bankCard, setBankCard] = useState('');
    const [meetupSpots, setMeetupSpots] = useState([]);
    const [pickupSpots, setPickupSpots] = useState([]);
    const [adBanners, setAdBanners] = useState([]);
    const [isStoreOpen, setIsStoreOpen] = useState(true);
    const [newSpot, setNewSpot] = useState('');
    const [newPickup, setNewPickup] = useState('');

    // Product form
    const [showProductForm, setShowProductForm] = useState(false);
    const [productForm, setProductForm] = useState({ nameUz: '', nameKo: '', descUz: '', descKo: '', price: '', category: 'ovqat', stock: '', ingredientCost: '', addons: [] });
    const [productImage, setProductImage] = useState(null);
    const [newAddon, setNewAddon] = useState({ name: '', price: '' });

    // Revenue form
    const [expenseNote, setExpenseNote] = useState('');
    const [expenseAmount, setExpenseAmount] = useState('');
    const [addingExpense, setAddingExpense] = useState(false);

    // Carousel form
    const [carouselText, setCarouselText] = useState('');
    const [carouselImage, setCarouselImage] = useState(null);

    // User detail
    const [selectedUser, setSelectedUser] = useState(null);
    const [topUpAmount, setTopUpAmount] = useState('');

    // Order filter
    const [orderFilter, setOrderFilter] = useState('all');

    // Admin Inbox Start Chat
    const [startChatUser, setStartChatUser] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resDash, resOrd, resProd, resUsers, resPay, resStats] = await Promise.all([
                api.get('/admin/dashboard').catch(() => ({ data: {} })),
                api.get('/admin/orders').catch(() => ({ data: { orders: [], stats: {} } })),
                api.get('/admin/products').catch(() => ({ data: [] })),
                api.get('/admin/users').catch(() => ({ data: { users: [], total: 0 } })),
                api.get('/admin/payment-requests').catch(() => ({ data: [] })),
                api.get(`/admin/stats?period=${timeframe}`).catch(() => ({ data: null })),
            ]);
            setDashStats(resDash.data);
            setExpandedStats(resStats.data);
            setOrders(resOrd.data || { orders: [], stats: {} });
            setProducts(resProd.data || []);
            setUsersData(resUsers.data || { users: [], total: 0 });
            setPaymentRequests(resPay.data || []);

            // Settings
            const [cardRes, storeRes, spotRes, pickupRes, adRes] = await Promise.all([
                api.get('/admin/settings/adminBankCard').catch(() => ({ data: '' })),
                api.get('/admin/settings/isStoreOpen').catch(() => ({ data: null })),
                api.get('/admin/settings/meetupSpots').catch(() => ({ data: null })),
                api.get('/admin/settings/pickupSpots').catch(() => ({ data: null })),
                api.get('/admin/settings/adBanners').catch(() => ({ data: null })),
            ]);
            if (cardRes.data) { let v = cardRes.data; if (typeof v === 'string' && v.startsWith('"')) v = JSON.parse(v); setBankCard(v); }
            if (storeRes.data !== null) setIsStoreOpen(storeRes.data === 'true');
            if (spotRes.data?.value) { try { setMeetupSpots(JSON.parse(spotRes.data.value)); } catch (e) { } }
            if (pickupRes.data?.value) { try { setPickupSpots(JSON.parse(pickupRes.data.value)); } catch (e) { } }
            if (adRes.data) { try { setAdBanners(JSON.parse(adRes.data)); } catch (e) { } }
        } catch (err) { console.error('Admin fetch error:', err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, [timeframe]);

    // Handle Telegram Back Button
    useEffect(() => {
        if (!tg) return;
        if (activeTab === 'analytics') { tg.BackButton?.hide(); } else { tg.BackButton?.show(); }
        const handleBack = () => setActiveTab('analytics');
        tg.onEvent('backButtonClicked', handleBack);
        return () => tg.offEvent('backButtonClicked', handleBack);
    }, [activeTab]);

    // Handlers
    const handleUpdateOrderStatus = async (id, status) => {
        try { await api.put(`/admin/orders/${id}`, { status }); fetchData(); } catch { alert("Xatolik"); }
    };
    const handleDeleteProduct = async (id) => {
        if (!confirm("O'chirasizmi?")) return;
        try { await api.delete(`/admin/products/${id}`); setProducts(p => p.filter(x => x.id !== id)); } catch { alert("Xatolik"); }
    };
    const handleAddProduct = async () => {
        try {
            const fd = new FormData();
            fd.append('name', JSON.stringify({ uz: productForm.nameUz, ko: productForm.nameKo }));
            fd.append('description', JSON.stringify({ uz: productForm.descUz || '', ko: productForm.descKo || '' }));
            fd.append('price', productForm.price);
            fd.append('category', productForm.category);
            fd.append('minOrderQuantity', 1);
            if (productForm.stock) fd.append('stock', productForm.stock);
            if (productForm.ingredientCost) fd.append('ingredientCost', productForm.ingredientCost);
            if (productForm.addons.length > 0) fd.append('addons', JSON.stringify(productForm.addons));
            if (productImage) fd.append('image', productImage);
            await api.post('/admin/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setShowProductForm(false);
            setProductForm({ nameUz: '', nameKo: '', descUz: '', descKo: '', price: '', category: 'ovqat', stock: '', ingredientCost: '', addons: [] });
            setProductImage(null);
            fetchData();
        } catch { alert("Qo'shishda xatolik"); }
    };
    const handleRoleChange = async (userId, role) => {
        try { await api.post('/admin/role', { userId, role }); fetchData(); } catch { alert("Xatolik"); }
    };
    const handlePaymentAction = async (id, action) => {
        try { await api.put(`/admin/payment-requests/${id}`, { action }); alert(`To'lov ${action === 'approve' ? 'tasdiqlandi' : 'rad etildi'}!`); fetchData(); } catch { alert("Xatolik"); }
    };
    const handleBalanceChange = async (userId, amount) => {
        try { await api.post(`/admin/users/${userId}/balance`, { amount: parseFloat(amount) }); alert('Balans yangilandi!'); fetchData(); setTopUpAmount(''); } catch { alert("Xatolik"); }
    };
    const saveBankCard = async () => {
        try { await api.post('/admin/settings', { key: 'adminBankCard', value: bankCard }); alert('Saqlandi!'); } catch { alert("Xatolik"); }
    };
    const handleToggleStore = async () => {
        const v = !isStoreOpen; setIsStoreOpen(v);
        try { await api.post('/admin/settings', { key: 'isStoreOpen', value: String(v) }); } catch { alert('Xatolik'); setIsStoreOpen(!v); }
    };
    const handleAddAd = async () => {
        try {
            const fd = new FormData(); fd.append('text', carouselText || '');
            if (carouselImage) fd.append('image', carouselImage);
            const r = await api.post('/admin/ads', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setAdBanners(r.data.banners); setCarouselText(''); setCarouselImage(null);
        } catch { alert("Xatolik"); }
    };
    const handleAddExpense = async () => {
        if (!expenseNote || !expenseAmount) return alert("Iltimos barcha maydonlarni to'ldiring");
        setAddingExpense(true);
        try {
            await api.post('/admin/expenses', { description: expenseNote, amount: Number(expenseAmount) });
            alert("Harajat qo'shildi!");
            setExpenseNote('');
            setExpenseAmount('');
            fetchData();
        } catch (error) {
            console.error(error);
            alert("Xatolik yuz berdi");
        } finally {
            setAddingExpense(false);
        }
    };

    const handleDeleteAd = async (id) => {
        if (!confirm("O'chirasizmi?")) return;
        try { const r = await api.delete(`/admin/ads/${id}`); setAdBanners(r.data.banners); } catch { alert("Xatolik"); }
    };
    const saveSpots = async (key, list) => { await api.post('/admin/settings', { key, value: JSON.stringify(list) }); };

    // Tab definitions
    const tabs = [
        { id: 'analytics', icon: '📊', label: 'Tahlil' },
        { id: 'orders', icon: '📋', label: 'Orderlar' },
        { id: 'revenue', icon: '💰', label: 'Daromad' },
        { id: 'payments', icon: '💳', label: 'To\'lovlar' },
        { id: 'products', icon: '🍽', label: 'Mahsulot' },
        { id: 'settings', icon: '⚙️', label: 'Sozlama' },
        { id: 'users', icon: '👥', label: 'Userlar' },
        { id: 'carousel', icon: '🎠', label: 'E\'lonlar' },
        { id: 'help', icon: '💬', label: 'Yordam' },
    ];

    const allOrders = orders.orders || [];
    const filteredOrders = orderFilter === 'all' ? allOrders : allOrders.filter(o => o.status === orderFilter);
    const statusColors = { pending: colors.warning, accepted: colors.accent, preparing: colors.purple, delivering: colors.accent, completed: colors.profit, cancelled: colors.danger };
    const statusLabels = { pending: 'Kutilmoqda', accepted: 'Qabul qilindi', preparing: 'Tayyorlanmoqda', delivering: 'Yo\'lda', completed: 'Yakunlangan', cancelled: 'Bekor' };

    // Revenue calculations
    const completedOrders = allOrders.filter(o => o.status === 'completed');
    const totalRevenue = completedOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const totalDeliveryFees = completedOrders.reduce((s, o) => s + (o.deliveryFee || 0), 0);
    const totalExpenses = (dashStats?.recentExpenses || []).reduce((s, e) => s + (e.amount || 0), 0);

    // Monthly Prediction Logic
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const currentMonthOrders = completedOrders.filter(o => new Date(o.createdAt) >= startOfMonth);
    const currentMonthRevenue = currentMonthOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const daysPassedThisMonth = Math.max(1, new Date().getDate());
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const predictedMonthlyRevenue = (currentMonthRevenue / daysPassedThisMonth) * daysInMonth;

    return (
        <div style={{ background: colors.bg, minHeight: '100vh', paddingBottom: 80 }}>
            {/* Header */}
            <div style={{ position: 'sticky', top: 0, zIndex: 100, padding: '12px 16px', background: 'rgba(8,12,20,0.97)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${colors.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg, ${colors.accent}, ${colors.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🛡️</div>
                        <div>
                            <div style={{ color: colors.text, fontWeight: 800, fontSize: 14 }}>Admin Panel</div>
                            <div style={{ color: colors.subtext, fontSize: 9 }}>{isStoreOpen ? '🟢 Ochiq' : '🔴 Yopiq'}</div>
                        </div>
                    </div>
                </div>
                {/* Toggle Tabs - Scrollable */}
                <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4, WebkitOverflowScrolling: 'touch' }}>
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                            padding: '6px 12px', borderRadius: 10, border: 'none', flexShrink: 0,
                            background: activeTab === tab.id ? colors.accent : colors.surface,
                            color: activeTab === tab.id ? '#fff' : colors.subtext,
                            fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                            display: 'flex', alignItems: 'center', gap: 4
                        }}>
                            <span style={{ fontSize: 13 }}>{tab.icon}</span> {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div style={{ padding: '14px' }}>
                {loading && <div style={{ textAlign: 'center', padding: 30, color: colors.subtext }}>⏳ Yuklanmoqda...</div>}

                {/* =================== ANALYTICS TAB =================== */}
                {activeTab === 'analytics' && !loading && (
                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                        
                        {/* 1. Historical Financials */}
                        <div style={sectionTitle}>💰 Moliyaviy Holat (Tarixdan beri)</div>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                            <div style={kpiCard(colors.profit)}>
                                <div style={subText}>Jami Deposit</div>
                                <div style={{ ...bigNum, color: colors.profit, fontSize: 18 }}>₩{(expandedStats?.financials?.totalDeposited || 0).toLocaleString()}</div>
                            </div>
                            <div style={kpiCard(colors.accent)}>
                                <div style={subText}>Jami Savdo</div>
                                <div style={{ ...bigNum, color: colors.accent, fontSize: 18 }}>₩{(expandedStats?.financials?.totalSpent || 0).toLocaleString()}</div>
                            </div>
                            <div style={kpiCard(colors.warning)}>
                                <div style={subText}>Hamyonlar qoldig'i</div>
                                <div style={{ ...bigNum, color: colors.warning, fontSize: 18 }}>₩{(expandedStats?.financials?.currentWalletPool || 0).toLocaleString()}</div>
                            </div>
                        </div>

                        {/* 2. Interactive Flow Chart */}
                        <div style={cardStyle}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <div style={sectionTitle}>📈 Savdo oqimi</div>
                                <div style={{ display: 'flex', gap: 4 }}>
                                    {['daily', 'weekly', 'monthly', 'yearly'].map(p => (
                                        <button key={p} onClick={() => setTimeframe(p)} style={{
                                            padding: '4px 8px', borderRadius: 6, border: 'none',
                                            background: timeframe === p ? colors.accent : colors.surface,
                                            color: timeframe === p ? '#fff' : colors.subtext,
                                            fontSize: 9, fontWeight: 800, cursor: 'pointer'
                                        }}>{p === 'daily' ? 'Kun' : p === 'weekly' ? 'Hafta' : p === 'monthly' ? 'Oy' : 'Yil'}</button>
                                    ))}
                                </div>
                            </div>

                            {/* Chart Area */}
                            <div style={{ height: 180, display: 'flex', alignItems: 'flex-end', gap: 4, marginBottom: 10, padding: '0 10px' }}>
                                {(() => {
                                    const data = expandedStats?.flow || [];
                                    const maxVal = Math.max(1, ...data.map(d => d.revenue));
                                    return data.map((d, i) => (
                                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%' }}>
                                            <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                                                <div style={{ 
                                                    width: '100%', 
                                                    height: `${(d.revenue / maxVal) * 100}%`, 
                                                    background: `linear-gradient(to top, ${colors.accent}, ${colors.profit})`, 
                                                    borderRadius: '4px 4px 0 0',
                                                    minHeight: d.revenue > 0 ? 4 : 0,
                                                    boxShadow: d.revenue > 0 ? '0 0 10px rgba(0,212,255,0.2)' : 'none'
                                                }} />
                                            </div>
                                            <span style={{ fontSize: 8, color: colors.subtext, whiteSpace: 'nowrap', transform: timeframe === 'yearly' || timeframe === 'monthly' ? 'rotate(-45deg)' : 'none', marginTop: 4 }}>{d.time}</span>
                                        </div>
                                    ));
                                })()}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: 2, background: colors.accent }} />
                                    <span style={subText}>Savdo oqimi (₩)</span>
                                </div>
                            </div>
                        </div>

                        {/* 3. Distribution Charts */}
                        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                            <div style={{ ...cardStyle, flex: 1 }}>
                                <div style={{ ...sectionTitle, fontSize: 13 }}>🛒 Buyurtma turi</div>
                                {(() => {
                                    const dist = expandedStats?.distribution || { home: 0, meetup: 0, pickup: 0 };
                                    const total = Math.max(1, dist.home + dist.meetup + dist.pickup);
                                    return (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            {[
                                                { label: 'Uygacha (₩1000)', val: dist.home, color: colors.accent },
                                                { label: 'Meet-up (Bepul)', val: dist.meetup, color: colors.purple },
                                                { label: 'Pick-up (-₩1000)', val: dist.pickup, color: colors.warning }
                                            ].map((item, i) => (
                                                <div key={i}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: colors.text, marginBottom: 2 }}>
                                                        <span>{item.label}</span>
                                                        <span>{Math.round((item.val/total)*100)}%</span>
                                                    </div>
                                                    <div style={{ height: 6, background: colors.surface, borderRadius: 3, overflow: 'hidden' }}>
                                                        <div style={{ width: `${(item.val / total) * 100}%`, height: '100%', background: item.color }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>
                            <div style={{ ...cardStyle, flex: 1, textAlign: 'center' }}>
                                <div style={{ ...sectionTitle, fontSize: 13 }}>👥 Demografiya</div>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 10 }}>
                                    <div>
                                        <div style={{ fontSize: 24 }}>🧔</div>
                                        <div style={{ ...mainText, color: colors.accent }}>{expandedStats?.demographics?.male || 0}</div>
                                        <div style={subText}>Erkak</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 24 }}>👩</div>
                                        <div style={{ ...mainText, color: colors.pink }}>{expandedStats?.demographics?.female || 0}</div>
                                        <div style={subText}>Ayol</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 4. Top Locations per category */}
                        <div style={cardStyle}>
                            <div style={sectionTitle}>🔝 Top Manzillar</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <div style={{ ...mainText, fontSize: 11, marginBottom: 8, color: colors.accent }}>🏠 Uygacha yetkazish</div>
                                    {(expandedStats?.locations?.delivery || []).map((loc, i) => (
                                        <div key={i} style={{ fontSize: 10, color: colors.subtext, marginBottom: 4 }}>
                                            {i+1}. {loc.label.slice(0, 15)}... <span style={{ color: colors.text }}>({loc.count})</span>
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <div style={{ ...mainText, fontSize: 11, marginBottom: 8, color: colors.purple }}>🤝 Meet-up nuqtalari</div>
                                    {(expandedStats?.locations?.meetup || []).map((loc, i) => (
                                        <div key={i} style={{ fontSize: 10, color: colors.subtext, marginBottom: 4 }}>
                                            {i+1}. {loc.label} <span style={{ color: colors.text }}>({loc.count})</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div style={{ marginTop: 12, borderTop: `1px solid ${colors.border}`, paddingTop: 8 }}>
                                <div style={{ ...mainText, fontSize: 11, marginBottom: 8, color: colors.warning }}>🚶 Pick-up (Olib ketish)</div>
                                {(expandedStats?.locations?.pickup || []).map((loc, i) => (
                                    <span key={i} style={{ fontSize: 10, color: colors.subtext, marginRight: 10 }}>
                                        {loc.label} ({loc.count})
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* =================== ORDERS TAB =================== */}
                {activeTab === 'orders' && !loading && (
                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                        {/* Status Filters */}
                        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 14, paddingBottom: 4 }}>
                            {['all', 'pending', 'accepted', 'preparing', 'delivering', 'completed'].map(f => (
                                <button key={f} onClick={() => setOrderFilter(f)} style={chipStyle(orderFilter === f)}>
                                    {f === 'all' ? 'Barchasi' : (statusLabels[f] || f)} ({f === 'all' ? allOrders.length : allOrders.filter(o => o.status === f).length})
                                </button>
                            ))}
                        </div>

                        {filteredOrders.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 40, color: colors.subtext }}>📦 Buyurtma topilmadi</div>
                        ) : (
                            filteredOrders.map(order => (
                                <div key={order.id} style={{ ...cardStyle, borderLeft: `3px solid ${statusColors[order.status] || colors.border}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <div>
                                            <div style={mainText}>#{order.id?.toString().slice(0, 8)}</div>
                                            <div style={subText}>👤 {order.user?.firstName || 'Noma\'lum'} · 📞 {order.user?.phone || '-'}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ ...bigNum, fontSize: 18, color: colors.accent }}>₩{(order.totalAmount || 0).toLocaleString()}</div>
                                            <span style={badge(statusColors[order.status] || colors.subtext)}>{statusLabels[order.status] || order.status}</span>
                                        </div>
                                    </div>
                                    <div style={{ ...subText, marginBottom: 8 }}>📍 {order.user?.address || '-'} · 📏 {order.distance?.toFixed(1) || 0} km</div>
                                    {/* Items */}
                                    <div style={{ background: colors.surface, borderRadius: 10, padding: 10, marginBottom: 10 }}>
                                        {order.items?.map((item, i) => (
                                            <div key={i} style={{ fontSize: 12, color: colors.text, padding: '2px 0' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>{item.productName} × {item.quantity}</span>
                                                    <span>₩{((item.price || 0) * item.quantity).toLocaleString()}</span>
                                                </div>
                                                {item.extras && item.extras.length > 0 && (
                                                    <div style={{ fontSize: 10, color: colors.accent, marginTop: 2, paddingLeft: 8 }}>
                                                        {item.extras.map((ex, j) => (
                                                            <div key={j}>+ {ex.name} (₩{(ex.price || 0).toLocaleString()})</div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {/* Action Buttons */}
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                        {order.status === 'pending' && (
                                            <>
                                                <button onClick={() => handleUpdateOrderStatus(order.id, 'accepted')} style={{ ...btnSuccess, padding: '8px 14px', fontSize: 12, flex: 1 }}>✅ Qabul</button>
                                                <button onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')} style={{ ...btnDanger, padding: '8px 14px', fontSize: 12 }}>❌ Rad</button>
                                            </>
                                        )}
                                        {order.status === 'accepted' && (
                                            <button onClick={() => handleUpdateOrderStatus(order.id, 'preparing')} style={{ ...btnPrimary, padding: '8px 14px', fontSize: 12, flex: 1 }}>🧑‍🍳 Tayyorlash</button>
                                        )}
                                        {order.status === 'preparing' && (
                                            <button onClick={() => handleUpdateOrderStatus(order.id, 'delivering')} style={{ ...btnSuccess, padding: '8px 14px', fontSize: 12, flex: 1 }}>🛵 Tayyor - Kuryerga</button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* =================== REVENUE TAB =================== */}
                {activeTab === 'revenue' && !loading && (
                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                            <div style={kpiCard(colors.profit)}>
                                <div style={subText}>Umumiy Daromad</div>
                                <div style={{ ...bigNum, color: colors.profit, fontSize: 22 }}>₩{totalRevenue.toLocaleString()}</div>
                            </div>
                            <div style={kpiCard(colors.accent)}>
                                <div style={subText}>Yetkazish to'lovi</div>
                                <div style={{ ...bigNum, color: colors.accent, fontSize: 22 }}>₩{totalDeliveryFees.toLocaleString()}</div>
                            </div>
                        </div>

                        {/* Monthly Breakdown */}
                        <div style={cardStyle}>
                            <div style={sectionTitle}>📈 Oylik daromad</div>
                            {(() => {
                                const monthData = {};
                                completedOrders.forEach(o => {
                                    const d = new Date(o.createdAt);
                                    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                                    monthData[key] = (monthData[key] || 0) + (o.totalAmount || 0);
                                });
                                const sorted = Object.entries(monthData).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 6);
                                const maxVal = Math.max(1, ...sorted.map(([, v]) => v));
                                return sorted.length === 0 ? <div style={subText}>Ma'lumot yo'q</div> : sorted.map(([month, amt], i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                        <span style={{ ...subText, width: 60, flexShrink: 0 }}>{month}</span>
                                        <div style={{ flex: 1, height: 24, background: colors.surface, borderRadius: 8, overflow: 'hidden' }}>
                                            <div style={{ width: `${(amt / maxVal) * 100}%`, height: '100%', background: `linear-gradient(90deg, ${colors.profit}, ${colors.accent})`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 6 }}>
                                                <span style={{ fontSize: 10, color: '#000', fontWeight: 800 }}>₩{amt.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>

                        {/* Driver Earnings */}
                        <div style={cardStyle}>
                            <div style={sectionTitle}>🛵 Kuryer maoshi (₩1,000/km)</div>
                            <div style={subText}>Jami yetkazish masofasi × ₩1,000 = Kuryer maoshi</div>
                            <div style={{ ...bigNum, color: colors.warning, fontSize: 20, marginTop: 8 }}>
                                ₩{(completedOrders.reduce((s, o) => s + ((o.distance || 0) * 2), 0) * 1000).toLocaleString()}
                            </div>
                            <div style={{ ...subText, marginTop: 4 }}>({completedOrders.reduce((s, o) => s + ((o.distance || 0) * 2), 0).toFixed(1)} km umumiy)</div>
                        </div>

                        {/* Expense Input */}
                        <div style={cardStyle}>
                            <div style={sectionTitle}>💸 Yangi harajat qo'shish</div>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                <input placeholder="Harajat sababi (masalan: Pomidor)" value={expenseNote} onChange={e => setExpenseNote(e.target.value)} style={{ ...inputStyle, flex: 2, minWidth: 150 }} />
                                <input type="number" placeholder="Summa ₩" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 100 }} />
                                <button onClick={handleAddExpense} disabled={addingExpense} style={{ ...btnPrimary, flexShrink: 0 }}>{addingExpense ? 'Qo\'shilmoqda...' : 'Qo\'shish'}</button>
                            </div>
                            
                            {dashStats?.recentExpenses?.length > 0 && (
                                <div style={{ marginTop: 16 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: colors.subtext, marginBottom: 8 }}>So'nggi harajatlar:</div>
                                    {dashStats.recentExpenses.map((exp, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', borderBottom: `1px solid ${colors.border}` }}>
                                            <span style={{ color: colors.text }}>{exp.description}</span>
                                            <span style={{ color: colors.danger, fontWeight: 700 }}>- ₩{exp.amount.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Net Profit & Predictions */}
                        <div style={{ ...cardStyle, background: `linear-gradient(135deg, ${colors.profit}20, ${colors.card})`, border: `1px solid ${colors.profit}30` }}>
                            <div style={sectionTitle}>💎 Hisobotlar va Sof Foyda</div>
                            
                            {/* Deductions breakdown */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                                <div>
                                    <div style={{ fontSize: 13, color: colors.subtext }}>Kuryerlarga ajratilgan</div>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: colors.warning }}>
                                        - ₩{completedOrders.reduce((s, o) => s + ((o.distance || 0) * 2 * 1000), 0).toLocaleString()}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: 13, color: colors.subtext }}>Boshqa harajatlar</div>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: colors.danger }}>
                                        - ₩{totalExpenses.toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${colors.profit}30`, paddingTop: 10 }}>
                                <div>
                                    <div style={{ ...subText, color: colors.text, fontWeight: 700 }}>Umumiy Sof Foyda</div>
                                    <div style={{ ...bigNum, color: colors.profit, fontSize: 22 }}>
                                        ₩{(totalRevenue - completedOrders.reduce((s, o) => s + ((o.distance || 0) * 2 * 1000), 0) - totalExpenses).toLocaleString()}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={subText}>Bu oy uchun daromad (Bashorat) 🔮</div>
                                    <div style={{ ...bigNum, color: colors.accent, fontSize: 20 }}>
                                        ~ ₩{Math.round(predictedMonthlyRevenue).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* =================== PAYMENTS TAB =================== */}
                {activeTab === 'payments' && !loading && (
                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                        <div style={sectionTitle}>💳 Deposit to'lovlarini boshqarish</div>

                        {/* Bank Card Info */}
                        <div style={{ ...cardStyle, background: `linear-gradient(135deg, ${colors.accent}15, ${colors.card})` }}>
                            <div style={subText}>Admin karta raqami (userlar ko'radi):</div>
                            <div style={{ ...mainText, fontSize: 16, marginTop: 4 }}>{bankCard || 'Kiritilmagan'}</div>
                        </div>

                        {paymentRequests.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 40, color: colors.subtext }}>💳 Hozircha to'lov so'rovlari yo'q</div>
                        ) : (
                            paymentRequests.map(pr => (
                                <div key={pr.id} style={{ ...cardStyle, borderLeft: `3px solid ${pr.status === 'pending' ? colors.warning : pr.status === 'approved' ? colors.profit : colors.danger}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <div>
                                            <div style={mainText}>{pr.user?.firstName || 'User'}</div>
                                            <div style={subText}>📞 {pr.user?.phone || '-'}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ ...bigNum, fontSize: 20, color: colors.profit }}>₩{(pr.amount || 0).toLocaleString()}</div>
                                            <span style={badge(pr.status === 'pending' ? colors.warning : pr.status === 'approved' ? colors.profit : colors.danger)}>
                                                {pr.status === 'pending' ? 'Kutilmoqda' : pr.status === 'approved' ? 'Tasdiqlangan' : 'Rad etilgan'}
                                            </span>
                                        </div>
                                    </div>
                                    {pr.screenshotUrl && (
                                        <img src={pr.screenshotUrl} alt="screenshot" style={{ width: '100%', borderRadius: 12, marginBottom: 10, maxHeight: 200, objectFit: 'cover' }} />
                                    )}
                                    {pr.status === 'pending' && (
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button onClick={() => handlePaymentAction(pr.id, 'approve')} style={{ ...btnSuccess, flex: 1, fontSize: 12 }}>✅ Tasdiqlash</button>
                                            <button onClick={() => handlePaymentAction(pr.id, 'reject')} style={{ ...btnDanger, fontSize: 12 }}>❌ Rad</button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* =================== PRODUCTS TAB =================== */}
                {activeTab === 'products' && !loading && (
                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                            <div style={sectionTitle}>🍽 Mahsulotlar ({products.length})</div>
                            <button onClick={() => setShowProductForm(!showProductForm)} style={{ ...btnPrimary, padding: '8px 16px', fontSize: 12 }}>
                                {showProductForm ? '✕ Yopish' : '+ Qo\'shish'}
                            </button>
                        </div>

                        {/* Product Form */}
                        {showProductForm && (
                            <div style={{ ...cardStyle, border: `1px solid ${colors.accent}30` }}>
                                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                                    <input placeholder="Nomi (UZ)" value={productForm.nameUz} onChange={e => setProductForm({ ...productForm, nameUz: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
                                    <input placeholder="Nomi (KO)" value={productForm.nameKo} onChange={e => setProductForm({ ...productForm, nameKo: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
                                </div>
                                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                                    <input placeholder="Tavsif (UZ)" value={productForm.descUz} onChange={e => setProductForm({ ...productForm, descUz: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
                                    <input placeholder="Tavsif (KO)" value={productForm.descKo} onChange={e => setProductForm({ ...productForm, descKo: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
                                </div>
                                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                                    <input type="number" placeholder="Narx ₩" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
                                    <select value={productForm.category} onChange={e => setProductForm({ ...productForm, category: e.target.value })} style={{ ...inputStyle, flex: 1 }}>
                                        <option value="ovqat">🍲 Ovqat</option>
                                        <option value="ichimlik">🥤 Ichimlik</option>
                                        <option value="shirinlik">🍰 Shirinlik</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                                    <input type="number" placeholder="Stok" value={productForm.stock} onChange={e => setProductForm({ ...productForm, stock: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
                                    <input type="number" placeholder="Tannarx ₩" value={productForm.ingredientCost} onChange={e => setProductForm({ ...productForm, ingredientCost: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
                                </div>
                                <input type="file" accept="image/*" onChange={e => setProductImage(e.target.files?.[0])} style={{ marginBottom: 10  }} />

                                {/* Addons */}
                                <div style={{ ...sectionTitle, fontSize: 13, marginTop: 12 }}>➕ Qo'shimchalar (Extra)</div>
                                {productForm.addons.map((a, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                                        <span style={{ ...mainText, flex: 1, fontSize: 12 }}>{a.name} — ₩{a.price}</span>
                                        <button onClick={() => setProductForm({ ...productForm, addons: productForm.addons.filter((_, j) => j !== i) })} style={{ ...btnDanger, padding: '4px 10px', fontSize: 10 }}>✕</button>
                                    </div>
                                ))}
                                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                                    <input placeholder="Nomi" value={newAddon.name} onChange={e => setNewAddon({ ...newAddon, name: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
                                    <input type="number" placeholder="₩" value={newAddon.price} onChange={e => setNewAddon({ ...newAddon, price: e.target.value })} style={{ ...inputStyle, width: 80 }} />
                                    <button onClick={() => { if (newAddon.name && newAddon.price) { setProductForm({ ...productForm, addons: [...productForm.addons, { name: newAddon.name, price: parseInt(newAddon.price) }] }); setNewAddon({ name: '', price: '' }); } }} style={{ ...btnSuccess, padding: '8px 14px', fontSize: 12 }}>+</button>
                                </div>

                                <button onClick={handleAddProduct} style={{ ...btnPrimary, width: '100%', marginTop: 8 }}>💾 Saqlash</button>
                            </div>
                        )}

                        {/* Products List by Category */}
                        {['ovqat', 'ichimlik', 'shirinlik'].map(cat => {
                            const catProducts = products.filter(p => (p.category || 'ovqat') === cat);
                            if (catProducts.length === 0) return null;
                            return (
                                <div key={cat} style={{ marginBottom: 16 }}>
                                    <div style={{ ...sectionTitle, fontSize: 14 }}>{cat === 'ovqat' ? '🍲 Ovqatlar' : cat === 'ichimlik' ? '🥤 Ichimliklar' : '🍰 Shirinliklar'}</div>
                                    {catProducts.map(p => {
                                        const name = typeof p.name === 'string' ? ((() => { try { const n = JSON.parse(p.name); return n[lang] || n.uz || p.name; } catch { return p.name; } })()) : (p.name?.[lang] || p.name?.uz || 'Nomsiz');
                                        return (
                                            <div key={p.id} style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 12, padding: 12 }}>
                                                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,107,53,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, overflow: 'hidden' }}>
                                                    {p.emoji?.startsWith('data:image') ? <img src={p.emoji} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (p.emoji || '🍽️')}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={mainText}>{name}</div>
                                                    <div style={subText}>₩{(p.price || 0).toLocaleString()} · {p.stock || '∞'} ta</div>
                                                    {p.addons && (Array.isArray(p.addons) ? p.addons : (() => { try { return JSON.parse(p.addons); } catch { return []; } })()).length > 0 && (
                                                        <div style={{ fontSize: 10, color: colors.accent, marginTop: 2 }}>+{(Array.isArray(p.addons) ? p.addons : (() => { try { return JSON.parse(p.addons); } catch { return []; } })()).length} ta extra</div>
                                                    )}
                                                </div>
                                                <button onClick={() => handleDeleteProduct(p.id)} style={{ background: 'none', border: 'none', color: colors.danger, fontSize: 16, cursor: 'pointer' }}>🗑️</button>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* =================== SETTINGS TAB =================== */}
                {activeTab === 'settings' && !loading && (
                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                        {/* Store Toggle */}
                        <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={mainText}>🏪 Do'kon holati</div>
                                <div style={subText}>{isStoreOpen ? 'Ochiq — buyurtmalar qabul qilinadi' : 'Yopiq — buyurtmalar to\'xtatilgan'}</div>
                            </div>
                            <button onClick={handleToggleStore} style={{ width: 60, height: 32, borderRadius: 16, border: 'none', background: isStoreOpen ? colors.profit : colors.danger, cursor: 'pointer', position: 'relative', transition: 'all 0.3s' }}>
                                <div style={{ width: 26, height: 26, borderRadius: 13, background: '#fff', position: 'absolute', top: 3, left: isStoreOpen ? 31 : 3, transition: 'left 0.3s' }} />
                            </button>
                        </div>

                        {/* Bank Card */}
                        <div style={cardStyle}>
                            <div style={sectionTitle}>💳 Admin karta raqami</div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <input value={bankCard} onChange={e => setBankCard(e.target.value)} placeholder="Karta raqami" style={{ ...inputStyle, flex: 1 }} />
                                <button onClick={saveBankCard} style={{ ...btnPrimary, fontSize: 12 }}>💾</button>
                            </div>
                        </div>

                        {/* Meetup Spots */}
                        <div style={cardStyle}>
                            <div style={sectionTitle}>📍 Meet Up joylari</div>
                            {meetupSpots.map((spot, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${colors.border}` }}>
                                    <span style={mainText}>{spot}</span>
                                    <button onClick={() => { const u = meetupSpots.filter(s => s !== spot); setMeetupSpots(u); saveSpots('meetupSpots', u); }} style={{ background: 'none', border: 'none', color: colors.danger, cursor: 'pointer' }}>✕</button>
                                </div>
                            ))}
                            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                <input value={newSpot} onChange={e => setNewSpot(e.target.value)} placeholder="Yangi joy..." style={{ ...inputStyle, flex: 1 }} />
                                <button onClick={() => { if (newSpot.trim()) { const u = [...meetupSpots, newSpot.trim()]; setMeetupSpots(u); saveSpots('meetupSpots', u); setNewSpot(''); } }} style={{ ...btnSuccess, padding: '8px 14px', fontSize: 12 }}>+</button>
                            </div>
                        </div>

                        {/* Pickup Spots */}
                        <div style={cardStyle}>
                            <div style={sectionTitle}>🚶 Pick Up joylari</div>
                            {pickupSpots.map((spot, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${colors.border}` }}>
                                    <span style={mainText}>{spot}</span>
                                    <button onClick={() => { const u = pickupSpots.filter(s => s !== spot); setPickupSpots(u); saveSpots('pickupSpots', u); }} style={{ background: 'none', border: 'none', color: colors.danger, cursor: 'pointer' }}>✕</button>
                                </div>
                            ))}
                            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                <input value={newPickup} onChange={e => setNewPickup(e.target.value)} placeholder="Yangi pickup joy..." style={{ ...inputStyle, flex: 1 }} />
                                <button onClick={() => { if (newPickup.trim()) { const u = [...pickupSpots, newPickup.trim()]; setPickupSpots(u); saveSpots('pickupSpots', u); setNewPickup(''); } }} style={{ ...btnSuccess, padding: '8px 14px', fontSize: 12 }}>+</button>
                            </div>
                        </div>

                        {/* Restaurant Address */}
                        <div style={{ ...cardStyle, background: `linear-gradient(135deg, ${colors.purple}15, ${colors.card})` }}>
                            <div style={sectionTitle}>🏠 Oshxona manzili</div>
                            <div style={{ ...mainText, fontSize: 13 }}>서울특별시 광진구 군자로2길 12, B04</div>
                            <div style={{ ...subText, marginTop: 4 }}>2km radius ichida delivery, undan uzoqqa faqat pickup</div>
                        </div>

                        {/* Cleanup Data */}
                        <div style={{ ...cardStyle, background: `linear-gradient(135deg, ${colors.danger}15, ${colors.card})`, marginTop: 16 }}>
                            <div style={sectionTitle}>🧹 Ma'lumotlarni tozalash</div>
                            <div style={{ ...subText, marginBottom: 12 }}>Barcha tugallangan va bekor qilingan buyurtmalar, hamda tasdiqlangan to'lov tarixini o'chirish. (Foydalanuvchilar va faol buyurtmalar saqlanib qoladi)</div>
                            <button onClick={async () => {
                                if (confirm("Rostdan ham tarixni tozalaysizmi? Bu amalni ortga qaytarib bo'lmaydi!")) {
                                    try {
                                        await api.delete('/admin/cleanup');
                                        alert("Tarix muvaffaqiyatli tozalandi!");
                                        fetchData();
                                    } catch (e) {
                                        alert("Xatolik yuz berdi");
                                    }
                                }
                            }} style={{ ...btnDanger, width: '100%' }}>🗑️ Tarixni tozalash</button>
                        </div>
                    </div>
                )}

                {/* =================== USERS TAB =================== */}
                {activeTab === 'users' && !loading && (
                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                        <div style={sectionTitle}>👥 Foydalanuvchilar ({usersData.total || usersData.users?.length || 0})</div>

                        {/* User Detail Modal */}
                        {selectedUser && (
                            <div style={{ ...cardStyle, border: `1px solid ${colors.accent}40`, marginBottom: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <div style={{ ...sectionTitle, margin: 0 }}>👤 {selectedUser.firstName}</div>
                                    <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', color: colors.subtext, cursor: 'pointer', fontSize: 18 }}>✕</button>
                                </div>
                                <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
                                    <div style={subText}>📞 {selectedUser.phone || '-'}</div>
                                    <div style={subText}>📍 {selectedUser.address || '-'}</div>
                                    <div style={subText}>💳 Hamyon: <span style={{ color: colors.profit, fontWeight: 800 }}>₩{(selectedUser.walletBalance || 0).toLocaleString()}</span></div>
                                    <div style={subText}>🛵 Masofasi: {selectedUser.distanceFromRestaurant?.toFixed(1) || '-'} km</div>
                                    <div style={subText}>📅 Ro'yxatdan: {new Date(selectedUser.createdAt).toLocaleDateString()}</div>
                                    <div style={subText}>🔑 Rol: <span style={badge(selectedUser.role === 'admin' ? colors.danger : selectedUser.role === 'driver' ? colors.accent : colors.profit)}>{selectedUser.role || 'user'}</span></div>
                                </div>
                                {/* Top up wallet */}
                                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                                    <input type="number" value={topUpAmount} onChange={e => setTopUpAmount(e.target.value)} placeholder="Summa ₩" style={{ ...inputStyle, flex: 1 }} />
                                    <button onClick={() => handleBalanceChange(selectedUser.id, topUpAmount)} style={{ ...btnSuccess, fontSize: 12 }}>💰 To'ldirish</button>
                                </div>
                                {/* Role change */}
                                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                                    {['user', 'driver', 'admin'].map(r => (
                                        <button key={r} onClick={() => handleRoleChange(selectedUser.id, r)} style={{ ...chipStyle(selectedUser.role === r), flex: 1, textAlign: 'center' }}>
                                            {r === 'user' ? '👤' : r === 'driver' ? '🛵' : '🛡️'} {r}
                                        </button>
                                    ))}
                                </div>
                                {/* Actions */}
                                <div>
                                    <button onClick={() => { 
                                        setStartChatUser(selectedUser); 
                                        setSelectedUser(null);
                                        setActiveTab('help'); 
                                    }} style={{ ...btnPrimary, width: '100%', fontSize: 13, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                                        💬 Xabar yozish
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Users List */}
                        {(usersData.users || []).map(u => (
                            <div key={u.id} onClick={() => setSelectedUser(u)} style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg, ${colors.accent}, ${colors.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
                                    {(u.firstName || '?')[0]?.toUpperCase()}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={mainText}>{u.firstName || 'Nomsiz'} {u.nickname ? `(${u.nickname})` : ''}</div>
                                    <div style={subText}>📞 {u.phone || '-'} · 💳 ₩{(u.walletBalance || 0).toLocaleString()}</div>
                                </div>
                                <span style={badge(u.role === 'admin' ? colors.danger : u.role === 'driver' ? colors.accent : colors.subtext)}>{u.role || 'user'}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* =================== CAROUSEL TAB =================== */}
                {activeTab === 'carousel' && !loading && (
                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                        <div style={sectionTitle}>🎠 E'lonlar / Carousel</div>

                        {/* Add new */}
                        <div style={cardStyle}>
                            <input value={carouselText} onChange={e => setCarouselText(e.target.value)} placeholder="E'lon matni..." style={{ ...inputStyle, marginBottom: 10 }} />
                            <input type="file" accept="image/*" onChange={e => setCarouselImage(e.target.files?.[0])} style={{ marginBottom: 10 }} />
                            <button onClick={handleAddAd} style={{ ...btnPrimary, width: '100%' }}>➕ E'lon qo'shish</button>
                        </div>

                        {/* Banners List */}
                        {adBanners.map((ad, i) => (
                            <div key={ad.id || i} style={{ ...cardStyle, display: 'flex', gap: 12, alignItems: 'center' }}>
                                {ad.imageUrl && <img src={ad.imageUrl} alt="" style={{ width: 60, height: 60, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />}
                                <div style={{ flex: 1 }}>
                                    <div style={mainText}>{ad.text || 'Rasm e\'lon'}</div>
                                </div>
                                <button onClick={() => handleDeleteAd(ad.id)} style={{ background: 'none', border: 'none', color: colors.danger, fontSize: 16, cursor: 'pointer' }}>🗑️</button>
                            </div>
                        ))}
                        {adBanners.length === 0 && <div style={{ textAlign: 'center', padding: 30, color: colors.subtext }}>E'lonlar hali qo'shilmagan</div>}
                    </div>
                )}

                {/* =================== HELP CENTER TAB =================== */}
                {activeTab === 'help' && (
                    <div style={{ animation: 'fadeIn 0.3s ease', height: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ ...sectionTitle, flexShrink: 0 }}>💬 Yordam markazi — Userlar va Kuryerlar bilan chat</div>
                        <div style={{ flex: 1, overflow: 'hidden', borderRadius: 16, border: `1px solid ${colors.border}` }}>
                            <AdminInbox initialChatUser={startChatUser} />
                        </div>
                    </div>
                )}
            </div>

            {/* Animations CSS */}
            <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        </div>
    );
};

export default AdminPage;
