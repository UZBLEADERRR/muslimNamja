import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import api from '../utils/api';
import {
    Shield, Package, Activity, Users, DollarSign,
    Box, Settings, Plus, Trash2, CheckCircle, BrainCircuit
} from 'lucide-react';

const AdminPage = () => {
    const { t, lang } = useTranslation();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(false);

    // Data states
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState({ orders: [], stats: {} });
    const [usersData, setUsersData] = useState({ users: [], total: 0 });
    const [fullStats, setFullStats] = useState(null); // includes demographics, totalWalletPool, recentExpenses
    const [profitData, setProfitData] = useState(null);
    const [aiInventory, setAiInventory] = useState(null);
    const [newExpense, setNewExpense] = useState({ description: '', amount: '' });

    // New Product State
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [newProduct, setNewProduct] = useState({
        nameUz: '', nameKo: '',
        descUz: '', descKo: '',
        price: '', category: 'uzbek',
        stock: '', minOrderQuantity: '1'
    });
    const [productImage, setProductImage] = useState(null);
    const [addingProduct, setAddingProduct] = useState(false);

    // Bank Card Setting from DB
    const [bankCard, setBankCard] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'dashboard') {
                const resOrd = await api.get('/admin/orders');
                setOrders(resOrd.data || { orders: [], stats: {} });
                const resProd = await api.get('/admin/products');
                setProducts(resProd.data || []);
            } else if (activeTab === 'products') {
                const resProd = await api.get('/admin/products');
                setProducts(resProd.data || []);
            } else if (activeTab === 'users') {
                const resUsers = await api.get('/admin/users');
                setUsersData(resUsers.data || { users: [], total: 0 });
                const resStats = await api.get('/admin/stats');
                setFullStats(resStats.data);
            } else if (activeTab === 'finance') {
                const resStats = await api.get('/admin/stats');
                setFullStats(resStats.data);
                const resProfit = await api.get('/admin/profit');
                setProfitData(resProfit.data);
            }

            // Always fetch settings on load
            const resSettings = await api.get('/admin/settings/adminBankCard');
            if (resSettings.data) {
                let val = resSettings.data;
                if (typeof val === 'string' && val.startsWith('"')) {
                    val = JSON.parse(val); // Parse if it was saved as JSON
                }
                setBankCard(val);
            }
        } catch (err) {
            console.error('Admin fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [activeTab]);

    const handleSeed = async () => {
        try {
            const res = await api.post('/admin/seed');
            alert(res.data.message);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || 'Seed failed');
        }
    };

    const handleDeleteProduct = async (id) => {
        if (!window.confirm("O'chirasizmi?")) return;
        try {
            await api.delete(`/admin/products/${id}`);
            setProducts(prev => prev.filter(p => p.id !== id));
        } catch (err) {
            alert("O'chirishda xatolik");
        }
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        setAddingProduct(true);
        try {
            const formData = new FormData();
            formData.append('name', JSON.stringify({ uz: newProduct.nameUz, ko: newProduct.nameKo }));
            formData.append('description', JSON.stringify({ uz: newProduct.descUz, ko: newProduct.descKo }));
            formData.append('price', newProduct.price);
            formData.append('category', newProduct.category);
            formData.append('minOrderQuantity', newProduct.minOrderQuantity || 1);
            if (newProduct.stock) formData.append('stock', newProduct.stock);
            if (productImage) formData.append('image', productImage);

            await api.post('/admin/products', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setShowAddProduct(false);
            setNewProduct({ nameUz: '', nameKo: '', descUz: '', descKo: '', price: '', category: 'uzbek', stock: '', minOrderQuantity: '1' });
            setProductImage(null);
            fetchData();
        } catch (err) {
            alert('Mahsulot qo\'shishda xatolik yuz berdi');
        } finally {
            setAddingProduct(false);
        }
    };

    const handleRoleChange = async (userId, role) => {
        try {
            await api.post('/admin/role', { userId, role });
            fetchData();
        } catch (err) {
            alert('Failed to update role');
        }
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/expenses', {
                description: newExpense.description,
                amount: Number(newExpense.amount)
            });
            setNewExpense({ description: '', amount: '' });
            fetchData();
        } catch (err) {
            alert('Xarajat qo\'shishda xatolik');
        }
    };

    const fetchAiInventory = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/ai-inventory');
            setAiInventory(res.data);
        } catch (err) {
            alert("AI tahlilda xatolik");
        } finally {
            setLoading(false);
        }
    };

    const saveBankCard = async () => {
        try {
            await api.post('/admin/settings', { key: 'adminBankCard', value: bankCard });
            alert('Karta saqlandi! Ushbu karta foydalanuvchilarga to\'lov uchun ko\'rsatiladi.');
        } catch (err) {
            alert('Kartani saqlashda xatolik yuz berdi');
        }
    };

    const getName = (product) => {
        if (typeof product.name === 'object') return product.name[lang] || product.name.en || Object.values(product.name)[0];
        return product.name;
    };

    const tabs = [
        { id: 'dashboard', icon: <Activity size={16} />, label: t('dashboard') },
        { id: 'products', icon: <Package size={16} />, label: t('products') },
        { id: 'users', icon: <Users size={16} />, label: t('users') },
        { id: 'finance', icon: <DollarSign size={16} />, label: 'Moliya' },
        { id: 'inventory', icon: <Box size={16} />, label: 'Zaxira (AI)' },
        { id: 'settings', icon: <Settings size={16} />, label: 'Sozlamalar' },
    ];

    return (
        <div className="animate-slide-up" style={{ padding: '20px', paddingBottom: '90px' }}>
            <h2 style={{ fontSize: '24px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-primary)', fontFamily: "'Fraunces', serif" }}>
                <div style={{ background: 'var(--brand-accent)', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(255,107,53,0.3)' }}>
                    <Shield size={20} color="#fff" />
                </div>
                {t('admin_panel')}
            </h2>

            {/* Scrollable Tabs Nav */}
            <div className="hide-scrollbar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '24px', paddingBottom: '8px', borderBottom: '1px solid var(--card-border)' }}>
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '10px 16px', borderRadius: '14px', whiteSpace: 'nowrap',
                        background: activeTab === tab.id ? 'var(--brand-accent)' : 'var(--card-bg)',
                        color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
                        border: activeTab === tab.id ? 'none' : '1px solid var(--card-border)',
                        fontWeight: 700, fontSize: '13px', transition: 'all 0.2s ease',
                    }}>
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {loading && activeTab !== 'inventory' && <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-secondary)' }}>{t('loading')}...</div>}

            {/* TAB: DASHBOARD */}
            {activeTab === 'dashboard' && !loading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <StatCard label={t('active_orders')} value={orders.stats?.pending || 0} color="var(--brand-accent)" />
                        <StatCard label={t('delivered')} value={orders.stats?.completed || 0} color="var(--brand-accent2)" />
                    </div>

                    <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', marginTop: 8 }}>{t('recent_activity')}</h3>
                    {orders.orders?.slice(0, 5).map((order) => (
                        <div key={order.id} style={{ padding: '14px 16px', borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-main)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 13 }}>Order #{(order.id || '').toString().slice(0, 8)}</span>
                                <span style={{ color: order.status === 'completed' ? '#27AE60' : 'var(--brand-accent)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>{order.status}</span>
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>₩{(order.totalAmount || 0).toLocaleString()} · {new Date(order.createdAt).toLocaleDateString()}</div>
                        </div>
                    ))}
                    {(!orders.orders || orders.orders.length === 0) && (
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: 13 }}>No orders yet</p>
                    )}
                </div>
            )}

            {/* TAB: PRODUCTS */}
            {activeTab === 'products' && !loading && (
                <div>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                        <button onClick={handleSeed} style={{ flex: 1, background: 'var(--card-bg)', color: 'var(--text-primary)', padding: '14px', borderRadius: '14px', fontWeight: 700, cursor: 'pointer', border: '1px solid var(--card-border)' }}>
                            🌱 {t('seed_menu')}
                        </button>
                        <button onClick={() => setShowAddProduct(!showAddProduct)} style={{ flex: 1, background: 'var(--brand-accent)', color: '#fff', padding: '14px', borderRadius: '14px', fontWeight: 700, cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            <Plus size={18} /> Yangi Qo'shish
                        </button>
                    </div>

                    {showAddProduct && (
                        <form onSubmit={handleAddProduct} style={{ background: 'var(--card-bg)', padding: 16, borderRadius: 16, border: '1px solid var(--brand-accent)', marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>📝 Yangi Mahsulot</div>

                            <input placeholder="Nomi (O'zbekcha)" value={newProduct.nameUz} onChange={e => setNewProduct({ ...newProduct, nameUz: e.target.value })} style={inputStyle} required />
                            <input placeholder="Nomi (Koreyscha)" value={newProduct.nameKo} onChange={e => setNewProduct({ ...newProduct, nameKo: e.target.value })} style={inputStyle} required />

                            <textarea placeholder="Tarif (O'zbekcha)" value={newProduct.descUz} onChange={e => setNewProduct({ ...newProduct, descUz: e.target.value })} style={{ ...inputStyle, height: 60, resize: 'none' }} />
                            <textarea placeholder="Tarif (Koreyscha)" value={newProduct.descKo} onChange={e => setNewProduct({ ...newProduct, descKo: e.target.value })} style={{ ...inputStyle, height: 60, resize: 'none' }} />

                            <div style={{ display: 'flex', gap: 10 }}>
                                <input type="number" placeholder="Narxi (₩)" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} style={{ ...inputStyle, flex: 1 }} required />
                                <select value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} style={{ ...inputStyle, flex: 1 }}>
                                    <option value="uzbek">Uzbek</option>
                                    <option value="korean">Korean</option>
                                    <option value="fastfood">Fastfood</option>
                                    <option value="drinks">Drinks</option>
                                    <option value="desserts">Desserts</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: 10 }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 4 }}>Zaxira (Bo'sh = Cheksiz)</label>
                                    <input type="number" placeholder="Masalan: 50" value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })} style={inputStyle} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 4 }}>Minimal buyurtma</label>
                                    <input type="number" value={newProduct.minOrderQuantity} onChange={e => setNewProduct({ ...newProduct, minOrderQuantity: e.target.value })} style={inputStyle} required />
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 4 }}>📸 Rasm (Majburiy emas)</label>
                                <input type="file" accept="image/*" onChange={e => setProductImage(e.target.files?.[0])} style={{ color: 'var(--text-primary)', fontSize: 13 }} />
                            </div>

                            <button type="submit" disabled={addingProduct} style={{ background: 'var(--brand-accent2)', color: '#fff', border: 'none', padding: '12px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', marginTop: 4 }}>
                                {addingProduct ? 'Qo\'shilmoqda...' : 'Saqlash'}
                            </button>
                        </form>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {products.map(p => (
                            <div key={p.id} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '14px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                    {p.imageUrl?.startsWith('data:image')
                                        ? <img src={p.imageUrl} alt={getName(p)} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                                        : <span style={{ fontSize: 24 }}>{p.imageUrl || '🍽️'}</span>
                                    }
                                    <div>
                                        <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 14 }}>{getName(p)}</div>
                                        <div style={{ color: 'var(--brand-accent)', fontSize: 12, fontWeight: 600 }}>₩{p.price?.toLocaleString()}</div>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: 11 }}>
                                            Zaxira: {p.stock === null ? 'Cheksiz' : p.stock} | Min: {p.minOrderQuantity || 1}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => handleDeleteProduct(p.id)} style={{ background: 'rgba(231,76,60,0.1)', color: '#E74C3C', border: 'none', borderRadius: 8, padding: '8px', cursor: 'pointer' }}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB: USERS & DEMOGRAPHICS */}
            {activeTab === 'users' && !loading && (
                <div>
                    {fullStats && (
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                            <div style={{ flex: 1, padding: '16px', borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', textAlign: 'center' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>UMUMIY USERLAR</div>
                                <div style={{ fontSize: 24, fontWeight: 900, fontFamily: "'Fraunces', serif", color: 'var(--text-primary)' }}>{usersData.total}</div>
                            </div>
                            <div style={{ flex: 1, padding: '16px', borderRadius: '16px', background: 'rgba(52, 152, 219, 0.1)', border: '1px solid rgba(52, 152, 219, 0.3)', textAlign: 'center' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#2980B9', marginBottom: 4 }}>ERKAKLAR</div>
                                <div style={{ fontSize: 24, fontWeight: 900, fontFamily: "'Fraunces', serif", color: '#2980B9' }}>{fullStats.demographics?.male || 0}</div>
                            </div>
                            <div style={{ flex: 1, padding: '16px', borderRadius: '16px', background: 'rgba(233, 30, 99, 0.1)', border: '1px solid rgba(233, 30, 99, 0.3)', textAlign: 'center' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#C2185B', marginBottom: 4 }}>AYOLLAR</div>
                                <div style={{ fontSize: 24, fontWeight: 900, fontFamily: "'Fraunces', serif", color: '#C2185B' }}>{fullStats.demographics?.female || 0}</div>
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {usersData.users?.map(u => (
                            <div key={u.id} style={{ padding: '14px', borderRadius: 14, background: 'var(--card-bg)', border: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 13 }}>{u.firstName} {u.lastName || ''}</div>
                                        {u.gender === 'male' && <span style={{ fontSize: 12 }}>👨</span>}
                                        {u.gender === 'female' && <span style={{ fontSize: 12 }}>👩</span>}
                                    </div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{u.phone || 'Tel raqam yo\'q'}</div>
                                    <div style={{ color: 'var(--brand-accent2)', fontSize: 11, fontWeight: 800 }}>Hamyon: ₩{u.walletBalance?.toLocaleString()}</div>
                                </div>
                                <select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)} style={{
                                    background: u.role === 'admin' ? 'var(--brand-accent)' : u.role === 'delivery' ? 'var(--brand-accent2)' : 'var(--bg-secondary)',
                                    color: u.role !== 'user' ? '#fff' : 'var(--text-primary)',
                                    border: '1px solid var(--card-border)', borderRadius: 8, padding: '6px', fontSize: 11, fontWeight: 700, outline: 'none'
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

            {/* TAB: FINANCE */}
            {activeTab === 'finance' && !loading && profitData && fullStats && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Top Level Summary generated by AI */}
                    {profitData.aiSummary && (
                        <div style={{ padding: '16px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(255,107,53,0.1), rgba(78,205,196,0.1))', border: '1px solid var(--brand-accent)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 900, marginBottom: '8px', color: 'var(--text-primary)', fontSize: '14px' }}>
                                <BrainCircuit size={18} color="var(--brand-accent)" /> AI Moliya Tahlili
                            </div>
                            <div style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--text-secondary)' }}>{profitData.aiSummary}</div>
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <StatCard label="Tushum (Daromad)" value={`₩${(profitData.totalRevenue || 0).toLocaleString()}`} color="#27AE60" />
                        <StatCard label="Masalliq Xarajati" value={`₩${(profitData.totalIngredientCost || 0).toLocaleString()}`} color="#E74C3C" />
                        <StatCard label="Haydovchilar Haqi" value={`₩${(profitData.totalDeliveryPay || 0).toLocaleString()}`} color="#E74C3C" />
                        <StatCard label="Sof Foyda" value={`₩${(profitData.netProfit || 0).toLocaleString()}`} color="var(--brand-accent)" />
                    </div>

                    <div style={{ padding: '16px', borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>USERLAR HAMYONIDAGI JAMI PUL</div>
                        <div style={{ fontSize: 24, fontWeight: 900, fontFamily: "'Fraunces', serif", color: 'var(--brand-accent2)' }}>₩{fullStats.totalWalletPool?.toLocaleString()}</div>
                    </div>

                    <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', marginTop: 8 }}>📝 Qoshimcha Xarajat Kiriting</h3>
                    <form onSubmit={handleAddExpense} style={{ display: 'flex', gap: 8 }}>
                        <input value={newExpense.description} onChange={e => setNewExpense({ ...newExpense, description: e.target.value })} placeholder="Nima uchun?" style={{ flex: 1.5, padding: 12, borderRadius: 12, border: '1px solid var(--card-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }} required />
                        <input type="number" value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })} placeholder="₩ Summa" style={{ flex: 1, padding: 12, borderRadius: 12, border: '1px solid var(--card-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }} required />
                        <button type="submit" style={{ background: 'var(--brand-accent)', color: '#fff', border: 'none', borderRadius: 12, padding: '0 16px', fontWeight: 700, cursor: 'pointer' }}><Plus size={20} /></button>
                    </form>

                    <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', marginTop: 8 }}>Tarix</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {fullStats.recentExpenses?.map(exp => (
                            <div key={exp.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 12, background: 'var(--card-bg)', borderRadius: 12, border: '1px solid var(--card-border)' }}>
                                <div>
                                    <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 13 }}>{exp.description}</div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{new Date(exp.date).toLocaleDateString()}</div>
                                </div>
                                <div style={{ color: '#E74C3C', fontWeight: 800 }}>-₩{exp.amount.toLocaleString()}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB: AI INVENTORY */}
            {activeTab === 'inventory' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ background: 'var(--card-bg)', padding: 20, borderRadius: 16, border: '1px solid var(--card-border)', textAlign: 'center' }}>
                        <BrainCircuit size={40} color="var(--brand-accent)" style={{ margin: '0 auto 12px' }} />
                        <h3 style={{ margin: '0 0 8px', color: 'var(--text-primary)' }}>Sun'iy Intelekt Zaxira Nazorati</h3>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px' }}>Sotilgan buyurtmalar tahlili asosida kerak bo'ladigan mahsulotlar (go'sht, guruch, idishlar va hk) hisobotini oling.</p>

                        <button onClick={fetchAiInventory} disabled={loading} style={{ background: 'var(--brand-accent)', color: '#fff', border: 'none', padding: '14px', borderRadius: '14px', width: '100%', fontWeight: 700, cursor: 'pointer' }}>
                            {loading ? 'AI tahlil qilmoqda...' : 'Tahlilni Boshlash'}
                        </button>
                    </div>

                    {aiInventory?.aiAnalysis?.ingredients && (
                        <div style={{ background: 'var(--card-bg)', padding: 16, borderRadius: 16, border: '1px solid var(--brand-accent2)' }}>
                            <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16, fontSize: 15 }}>🛒 Taxminiy iste'mol (AI)</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {aiInventory.aiAnalysis.ingredients.map((ing, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--card-border)', paddingBottom: 8 }}>
                                        <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14 }}>{ing.name}</span>
                                        <span style={{ color: 'var(--brand-accent2)', fontWeight: 800, fontSize: 14 }}>{ing.estimated_amount}</span>
                                    </div>
                                ))}
                            </div>

                            {aiInventory.aiAnalysis.restock_suggestions?.length > 0 && (
                                <div style={{ marginTop: 20, padding: 12, background: 'rgba(255,107,53,0.1)', borderRadius: 12 }}>
                                    <div style={{ fontWeight: 800, color: 'var(--brand-accent)', marginBottom: 8, fontSize: 13 }}>💡 AI Maslahatlari:</div>
                                    <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-secondary)', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        {aiInventory.aiAnalysis.restock_suggestions.map((s, i) => (
                                            <li key={i}>{s}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* TAB: SETTINGS */}
            {activeTab === 'settings' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                        <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', margin: '0 0 8px' }}>💳 To'lov Qabul Qilish Kartasi</h3>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>Foydalanuvchilar o'z hamyonini to'ldirish uchun shu kartaga pul o'tkazishadi.</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <input
                                value={bankCard}
                                onChange={e => setBankCard(e.target.value)}
                                placeholder="8600 1234 ... yoki Toss Bank 1000..."
                                style={{ padding: 14, borderRadius: 12, border: '1px solid var(--card-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 15, outline: 'none' }}
                            />
                            <button onClick={saveBankCard} style={{ background: 'var(--brand-accent2)', color: '#fff', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                                <CheckCircle size={18} /> Saqlash
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

const StatCard = ({ label, value, color }) => (
    <div style={{ flex: 1, padding: '16px', borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-main)' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
        <div style={{ color, fontSize: 24, fontWeight: 900, fontFamily: "'Fraunces', serif" }}>{value}</div>
    </div>
);

const inputStyle = {
    padding: '12px 14px', borderRadius: 12,
    border: '1px solid var(--card-border)', background: 'var(--bg-secondary)',
    color: 'var(--text-primary)', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box'
};

export default AdminPage;
