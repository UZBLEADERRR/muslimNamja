import React, { useState } from 'react';
import { Shield, PlusCircle, Users, Activity } from 'lucide-react';

const AdminPage = () => {
    const [activeTab, setActiveTab] = useState('dashboard');

    return (
        <div className="animate-slide-up" style={{ paddingBottom: '40px' }}>
            <h2 style={{ fontSize: '28px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-primary)' }}>
                <div style={{ background: 'var(--danger-color)', width: '44px', height: '44px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(251, 113, 133, 0.3)' }}>
                    <Shield size={22} color="white" />
                </div>
                Admin Panel
            </h2>

            {/* Premium Tabs */}
            <div className="hide-scrollbar" style={{ display: 'flex', gap: '12px', overflowX: 'auto', marginBottom: '32px', paddingBottom: '4px' }}>
                {['dashboard', 'products', 'users', 'finance'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '12px 24px', borderRadius: '18px', textTransform: 'capitalize', whiteSpace: 'nowrap',
                            background: activeTab === tab ? 'linear-gradient(135deg, var(--brand-primary), #065f46)' : 'var(--glass-bg)',
                            color: activeTab === tab ? 'white' : 'var(--text-secondary)',
                            border: activeTab === tab ? 'none' : '1px solid var(--glass-border)',
                            fontWeight: 700, fontSize: '14px', transition: 'all 0.3s ease',
                            boxShadow: activeTab === tab ? '0 10px 20px rgba(16, 185, 129, 0.2)' : 'none'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {activeTab === 'dashboard' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="glass" style={{
                        padding: '32px', borderRadius: '32px',
                        background: 'linear-gradient(135deg, var(--success-color), #059669)',
                        color: 'white', boxShadow: '0 20px 40px rgba(52, 211, 153, 0.2)'
                    }}>
                        <p style={{ margin: '0 0 12px 0', opacity: 0.9, fontWeight: 600, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Bugun tushgan foyda</p>
                        <h1 style={{ margin: 0, fontSize: '42px', fontWeight: 900 }}>145,000 <span style={{ fontSize: '24px' }}>₩</span></h1>
                    </div>

                    <div style={{ display: 'flex', gap: '20px' }}>
                        <div className="glass" style={{ flex: 1, padding: '24px', borderRadius: '24px' }}>
                            <p style={{ margin: '0 0 8px 0', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 700 }}>Aktiv buyurtmalar</p>
                            <h2 style={{ margin: 0, fontSize: '28px', color: 'var(--brand-primary)' }}>12</h2>
                        </div>
                        <div className="glass" style={{ flex: 1, padding: '24px', borderRadius: '24px' }}>
                            <p style={{ margin: '0 0 8px 0', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 700 }}>Yetkazilgan</p>
                            <h2 style={{ margin: 0, fontSize: '28px', color: 'var(--brand-gold)' }}>4</h2>
                        </div>
                    </div>

                    <h3 style={{ marginTop: '16px', marginBottom: '8px', fontSize: '20px' }}>Oxirgi harakatlar</h3>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="glass" style={{ padding: '20px', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Activity size={22} color="var(--brand-primary)" />
                            </div>
                            <div>
                                <p style={{ margin: 0, fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>Order #{1000 + i} Yakunlandi</p>
                                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Daromad: 3,500 ₩</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'products' && (
                <div>
                    <button className="btn-gold" style={{ width: '100%', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        <PlusCircle size={22} /> Yangi taom qo'shish
                    </button>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {['Spicy Chicken', 'Beef Kebab', 'Cola'].map((p, i) => (
                            <div key={i} className="glass" style={{ padding: '20px 24px', borderRadius: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <p style={{ margin: '0 0 4px 0', fontWeight: 700, fontSize: '17px', color: 'var(--text-primary)' }}>{p}</p>
                                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--success-color)', fontWeight: 600 }}>Sotuvda bor</p>
                                </div>
                                <button className="glass" style={{ border: 'none', padding: '10px 20px', borderRadius: '14px', fontWeight: 700, color: 'var(--brand-primary)', background: 'rgba(255,255,255,0.05)' }}>Tahrirlash</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'users' && (
                <div>
                    <div className="glass" style={{ padding: '32px', borderRadius: '32px', display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', background: 'rgba(16, 185, 129, 0.05)' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 10px 20px rgba(16, 185, 129, 0.2)' }}>
                            <Users size={32} />
                        </div>
                        <div>
                            <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Ro'yxatdagi foydalanuvchilar</p>
                            <h2 style={{ margin: 0, fontSize: '32px', fontWeight: 900, color: 'var(--text-primary)' }}>156</h2>
                        </div>
                    </div>

                    <button className="glass" style={{ width: '100%', padding: '20px', borderRadius: '24px', fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>
                        Rollar va ruxsatlarni sozlash
                    </button>
                </div>
            )}

            {activeTab === 'finance' && (
                <FinanceTab />
            )}
        </div>
    );
};

const FinanceTab = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchProfit = async () => {
        setLoading(true);
        setError(null);
        try {
            const api = (await import('../utils/api')).default;
            const res = await api.get('/admin/profit');
            setData(res.data);
        } catch (err) {
            setError('Failed to fetch finance report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="glass" style={{ padding: '24px', borderRadius: '24px', background: 'var(--bg-secondary)' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>Profit Analysis & Financial Report</p>
                <button
                    className="btn-primary"
                    onClick={fetchProfit}
                    disabled={loading}
                >
                    {loading ? 'Analyzing...' : 'Generate AI Profit Report'}
                </button>
            </div>

            {data && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <SummaryCard label="Revenue" value={`${data.totalRevenue}₩`} color="var(--success-color)" />
                        <SummaryCard label="Expenses" value={`${data.totalIngredientCost + data.totalDeliveryPay}₩`} color="var(--danger-color)" />
                    </div>

                    <div className="glass" style={{ padding: '20px', borderRadius: '20px' }}>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Net Profit</p>
                        <h2 style={{ color: 'var(--brand-primary)', margin: '4px 0' }}>{data.netProfit.toLocaleString()} ₩</h2>
                    </div>

                    <div className="glass" style={{ padding: '16px', borderRadius: '16px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--brand-primary)' }}>
                        <p style={{ fontWeight: 600, marginBottom: '4px' }}>AI Conclusion:</p>
                        <p style={{ fontSize: '14px', lineHeight: 1.5 }}>{data.aiSummary}</p>
                    </div>
                </div>
            )}

            {error && <p style={{ color: 'var(--danger-color)', textAlign: 'center' }}>{error}</p>}
        </div>
    );
};

const SummaryCard = ({ label, value, color }) => (
    <div className="glass" style={{ padding: '16px', borderRadius: '16px' }}>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{label}</p>
        <p style={{ fontWeight: 700, fontSize: '18px', color }}>{value}</p>
    </div>
);

export default AdminPage;
