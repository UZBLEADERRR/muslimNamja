import React, { useState } from 'react';
import { Shield, PlusCircle, Users, Activity } from 'lucide-react';

const AdminPage = () => {
    const [activeTab, setActiveTab] = useState('dashboard');

    return (
        <div className="animate-fade-in">
            <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield color="var(--danger-color)" /> Admin Panel
            </h2>

            {/* Tabs */}
            <div className="hide-scrollbar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '24px', paddingBottom: '4px' }}>
                {['dashboard', 'products', 'users', 'finance'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '8px 16px', borderRadius: '20px', textTransform: 'capitalize', whiteSpace: 'nowrap',
                            background: activeTab === tab ? 'var(--brand-primary)' : 'var(--bg-secondary)',
                            color: activeTab === tab ? 'white' : 'var(--text-secondary)',
                            border: `1px solid ${activeTab === tab ? 'var(--brand-primary)' : 'var(--border-color)'}`
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {activeTab === 'dashboard' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="glass" style={{ padding: '24px', borderRadius: '24px', background: 'linear-gradient(135deg, var(--success-color), #059669)', color: 'white' }}>
                        <p style={{ margin: '0 0 8px 0', opacity: 0.9 }}>Total Income (Today)</p>
                        <h1 style={{ margin: 0, fontSize: '32px' }}>145,000 ₩</h1>
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div className="glass" style={{ flex: 1, padding: '20px', borderRadius: '20px' }}>
                            <p style={{ margin: '0 0 4px 0', color: 'var(--text-secondary)', fontSize: '14px' }}>Active Orders</p>
                            <h2 style={{ margin: 0 }}>12</h2>
                        </div>
                        <div className="glass" style={{ flex: 1, padding: '20px', borderRadius: '20px' }}>
                            <p style={{ margin: '0 0 4px 0', color: 'var(--text-secondary)', fontSize: '14px' }}>Deliveries</p>
                            <h2 style={{ margin: 0 }}>4</h2>
                        </div>
                    </div>

                    <h3 style={{ marginTop: '16px', marginBottom: '8px' }}>Recent Activity</h3>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="glass" style={{ padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Activity size={20} color="var(--brand-primary)" />
                            <div>
                                <p style={{ margin: 0, fontWeight: 600 }}>Order #{1000 + i} Completed</p>
                                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>Delivery earned: 3,500 ₩</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'products' && (
                <div>
                    <button className="btn-primary" style={{ width: '100%', marginBottom: '20px' }}>
                        <PlusCircle size={20} /> Add New Menu Item
                    </button>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Mock Products List */}
                        {['Spicy Chicken', 'Beef Kebab', 'Cola'].map((p, i) => (
                            <div key={i} className="glass" style={{ padding: '16px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <p style={{ margin: '0 0 4px 0', fontWeight: 600 }}>{p}</p>
                                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>In Stock</p>
                                </div>
                                <button style={{ background: 'var(--bg-tertiary)', border: 'none', padding: '8px 16px', borderRadius: '12px' }}>Edit</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'users' && (
                <div>
                    <div className="glass" style={{ padding: '20px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                        <Users size={32} color="var(--brand-primary)" />
                        <div>
                            <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>Total Registered Users</p>
                            <h2 style={{ margin: 0, fontSize: '24px' }}>156</h2>
                        </div>
                    </div>

                    <button className="btn-primary" style={{ width: '100%', marginBottom: '20px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
                        Manage Roles (Admin / Delivery)
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
