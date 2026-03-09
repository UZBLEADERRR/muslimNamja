import React from 'react';
import { colors, cardStyle, kpiCard, bigNum, subText, mainText, badge, sectionTitle, btnPrimary } from './adminStyles';

const OverviewTab = ({ dashStats, orders, onViewOrder, onQuickAction }) => {
    const ds = dashStats || {};
    const recentOrders = (orders?.orders || []).slice(0, 10);
    const changeColor = parseFloat(ds.revenueChange) >= 0 ? colors.profit : colors.danger;
    const changeIcon = parseFloat(ds.revenueChange) >= 0 ? '▲' : '▼';

    const statusColors = {
        pending: colors.warning, preparing: colors.accent, delivering: colors.purple,
        completed: colors.profit, cancelled: colors.danger
    };
    const statusLabels = {
        pending: '⏳ Kutilmoqda', preparing: '🍳 Tayyorlanmoqda', delivering: '🛵 Yo\'lda',
        completed: '✅ Yetkazildi', cancelled: '❌ Bekor'
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'fadeIn 0.3s ease' }}>
            {/* KPI Cards 2×2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={kpiCard(colors.profit)}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: colors.subtext, marginBottom: 4 }}>💰 BUGUNGI DAROMAD</div>
                    <div style={{ ...bigNum, color: colors.profit }}>₩{(ds.todayRevenue || 0).toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: changeColor, fontWeight: 700, marginTop: 4 }}>
                        Kecha ₩{(ds.yesterdayRevenue || 0).toLocaleString()} · {ds.revenueChange || 0}% {changeIcon}
                    </div>
                </div>
                <div style={kpiCard(colors.accent)}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: colors.subtext, marginBottom: 4 }}>📦 BUYURTMALAR</div>
                    <div style={{ ...bigNum, color: colors.accent }}>{ds.totalOrders || 0}</div>
                    <div style={{ fontSize: 11, color: colors.subtext }}>
                        aktiv: {ds.activeOrders || 0} · done: {ds.completedToday || 0} · ❌ {ds.cancelledToday || 0}
                    </div>
                </div>
                <div style={kpiCard(colors.purple)}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: colors.subtext, marginBottom: 4 }}>👥 FOYDALANUVCHILAR</div>
                    <div style={{ ...bigNum, color: colors.purple }}>{ds.totalUsers || 0}</div>
                    <div style={{ fontSize: 11, color: colors.subtext }}>
                        yangi: +{ds.todayNewUsers || 0} · 👨{ds.malePercent || 0}% 👩{ds.femalePercent || 0}%
                    </div>
                </div>
                <div style={kpiCard('#00F5A0')}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: colors.subtext, marginBottom: 4 }}>📈 SOF FOYDA</div>
                    <div style={{ ...bigNum, color: colors.profit }}>₩{(ds.todayProfit || 0).toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: colors.subtext }}>Margin: {ds.profitMargin || 0}%</div>
                </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                    { icon: '🔔', label: "E'lon yuborish", action: 'broadcast' },
                    { icon: '⚠️', label: `Alertlar (${ds.pendingPayments || 0})`, action: 'alerts' },
                    { icon: '📊', label: 'Bugungi hisobot', action: 'report' },
                    { icon: '💳', label: `To'lovlar (${ds.pendingPayments || 0})`, action: 'payments' },
                ].map((qa, i) => (
                    <button key={i} onClick={() => onQuickAction?.(qa.action)} style={{
                        ...cardStyle, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                        padding: '12px 14px', border: `1px solid ${colors.border}`, background: colors.card,
                        color: colors.text, fontWeight: 700, fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                    }}>
                        <span style={{ fontSize: 18 }}>{qa.icon}</span> {qa.label}
                    </button>
                ))}
            </div>

            {/* Live Order Feed */}
            <div style={sectionTitle}>🔴 LIVE BUYURTMA OQIMI</div>
            {recentOrders.length === 0 && (
                <div style={{ ...cardStyle, textAlign: 'center', color: colors.subtext, padding: 30 }}>
                    Hozircha buyurtmalar yo'q
                </div>
            )}
            {recentOrders.map((order, i) => {
                const ago = Math.round((Date.now() - new Date(order.createdAt).getTime()) / 60000);
                const agoLabel = ago < 1 ? 'Hozirgina' : ago < 60 ? `${ago} daqiqa oldin` : `${Math.round(ago / 60)} soat oldin`;
                return (
                    <div key={order.id} style={{
                        ...cardStyle, padding: '14px 16px', cursor: 'pointer',
                        animation: `fadeIn 0.3s ease ${i * 50}ms both`,
                        borderLeft: `3px solid ${statusColors[order.status] || colors.accent}`,
                    }} onClick={() => onViewOrder?.(order)}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ ...mainText, fontSize: 13 }}>#{(order.id || '').slice(0, 8)}</span>
                            <span style={badge(statusColors[order.status] || colors.accent)}>
                                {statusLabels[order.status] || order.status}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={subText}>
                                    {order.items?.map(it => `${it.productName || 'Item'} ×${it.quantity || 1}`).join(', ') || 'Buyurtma'}
                                </div>
                                <div style={{ ...subText, fontSize: 11, marginTop: 2 }}>{agoLabel}</div>
                            </div>
                            <div style={{ ...mainText, color: colors.accent }}>₩{(order.totalAmount || 0).toLocaleString()}</div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default OverviewTab;
