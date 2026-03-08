import React, { useState } from 'react';
import { Shield, PlusCircle, Users, Activity } from 'lucide-react';

const AdminPage = () => {
    const [activeTab, setActiveTab] = useState('dashboard');

    return (
        <div className="animate-slide-up" style={{ padding: '20px', paddingBottom: '40px' }}>
            <h2 style={{ fontSize: '24px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-primary)', fontFamily: "'Fraunces', serif" }}>
                <div style={{ background: 'var(--brand-accent)', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(255,107,53,0.3)' }}>
                    <Shield size={20} color="white" />
                </div>
                SEJONG ADMIN
            </h2>

            {/* Premium Tabs */}
            <div className="hide-scrollbar" style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginBottom: '24px', paddingBottom: '4px' }}>
                {['dashboard', 'products', 'users', 'finance'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '10px 20px', borderRadius: '16px', textTransform: 'capitalize', whiteSpace: 'nowrap',
                            background: activeTab === tab ? 'var(--brand-accent)' : 'var(--card-bg)',
                            color: activeTab === tab ? '#fff' : 'var(--text-secondary)',
                            border: activeTab === tab ? 'none' : '1px solid var(--card-border)',
                            fontWeight: 700, fontSize: '13px', transition: 'all 0.3s ease',
                            boxShadow: activeTab === tab ? '0 4px 12px rgba(255,107,53,0.3)' : 'none'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {activeTab === 'dashboard' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{
                        padding: '24px', borderRadius: '24px',
                        background: 'linear-gradient(135deg, var(--brand-accent2), #2C3E50)',
                        color: 'white', boxShadow: '0 8px 24px rgba(78,205,196,0.3)'
                    }}>
                        <p style={{ margin: '0 0 8px 0', opacity: 0.9, fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Bugun tushgan foyda</p>
                        <h1 style={{ margin: 0, fontSize: '36px', fontWeight: 900, fontFamily: "'Fraunces', serif" }}>145,000 <span style={{ fontSize: '20px' }}>₩</span></h1>
                    </div>

                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ flex: 1, padding: '20px', borderRadius: '20px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-main)' }}>
                            <p style={{ margin: '0 0 6px 0', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 700 }}>Aktiv buyurtmalar</p>
                            <h2 style={{ margin: 0, fontSize: '24px', color: 'var(--brand-accent)' }}>12</h2>
                        </div>
                        <div style={{ flex: 1, padding: '20px', borderRadius: '20px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-main)' }}>
                            <p style={{ margin: '0 0 6px 0', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 700 }}>Yetkazilgan</p>
                            <h2 style={{ margin: 0, fontSize: '24px', color: 'var(--brand-accent2)' }}>4</h2>
                        </div>
                    </div>

                    <h3 style={{ marginTop: '12px', marginBottom: '8px', fontSize: '18px', color: 'var(--text-primary)' }}>Oxirgi harakatlar</h3>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{ padding: '16px', borderRadius: '20px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: 'var(--shadow-main)' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,107,53,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Activity size={20} color="var(--brand-accent)" />
                            </div>
                            <div>
                                <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>Order #{1000 + i} Yakunlandi</p>
                                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>Daromad: 3,500 ₩</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'products' && (
                <div>
                    <button style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)', padding: '14px', borderRadius: '16px', width: '100%', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 700 }}>
                        <PlusCircle size={20} /> Yangi taom qo'shish
                    </button>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {['Uzbek Plov', 'Beef Kebab', 'Boba Tea'].map((p, i) => (
                            <div key={i} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '16px 20px', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-main)' }}>
                                <div>
                                    <p style={{ margin: '0 0 4px 0', fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>{p}</p>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#27AE60', fontWeight: 600 }}>Sotuvda bor</p>
                                </div>
                                <button style={{ border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: 700, color: '#fff', background: 'var(--brand-accent2)' }}>Tahrir</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'users' && (
                <div>
                    <div style={{ padding: '24px', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-main)' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, var(--brand-accent), #FF3CAC)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 12px rgba(255,107,53,0.3)' }}>
                            <Users size={28} />
                        </div>
                        <div>
                            <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Ro'yxatdagi foydalanuvchilar</p>
                            <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 900, color: 'var(--text-primary)', fontFamily: "'Fraunces', serif" }}>156</h2>
                        </div>
                    </div>

                    <button style={{ width: '100%', padding: '16px', borderRadius: '16px', fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', background: 'transparent', border: '1px dashed var(--brand-accent)', cursor: 'pointer' }}>
                        Rollar va ruxsatlarni sozlash (Admin/Driver)
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
            <div style={{ padding: '20px', borderRadius: '20px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-main)' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '12px', fontSize: '13px', fontWeight: 600 }}>Profit Analysis & Financial Report</p>
                <button
                    onClick={fetchProfit}
                    disabled={loading}
                    style={{ background: 'var(--brand-accent)', color: '#fff', border: 'none', padding: '14px', borderRadius: '14px', width: '100%', fontWeight: 700, cursor: 'pointer' }}
                >
                    {loading ? 'Analyzing AI...' : 'Generate AI Profit Report'}
                </button>
            </div>

            {data && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <SummaryCard label="Revenue" value={`${data.totalRevenue}₩`} color="#27AE60" />
                        <SummaryCard label="Expenses" value={`${data.totalIngredientCost + data.totalDeliveryPay}₩`} color="#E74C3C" />
                    </div>

                    <div style={{ padding: '20px', borderRadius: '20px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-main)' }}>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>Net Profit</p>
                        <h2 style={{ color: 'var(--brand-accent)', margin: '4px 0', fontFamily: "'Fraunces', serif" }}>{data.netProfit.toLocaleString()} ₩</h2>
                    </div>

                    <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(78,205,196,0.1)', border: '1px solid var(--brand-accent2)' }}>
                        <p style={{ fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)', fontSize: '13px' }}>AI Conclusion:</p>
                        <p style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--text-secondary)' }}>{data.aiSummary}</p>
                    </div>
                </div>
            )}

            {error && <p style={{ color: '#E74C3C', textAlign: 'center', fontSize: '13px', fontWeight: 600 }}>{error}</p>}
        </div>
    );
};

const SummaryCard = ({ label, value, color }) => (
    <div style={{ padding: '16px', borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-main)' }}>
        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase' }}>{label}</p>
        <p style={{ fontWeight: 800, fontSize: '16px', color }}>{value}</p>
    </div>
);

export default AdminPage;
