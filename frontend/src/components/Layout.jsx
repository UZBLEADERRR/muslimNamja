import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store/useAppStore';

const Layout = () => {
    const { t, lang } = useTranslation();
    const { setLang, setTheme, theme, user, cart } = useAppStore();
    const location = useLocation();
    const showTopNav = location.pathname === '/';
    const [hasActiveOrder, setHasActiveOrder] = useState(false);

    // Check for active orders to show badge
    useEffect(() => {
        if (!user) return;
        const checkOrders = async () => {
            try {
                const { default: api } = await import('../utils/api');
                const res = await api.get('/orders/my');
                const orders = res.data || [];
                const active = orders.some(o => o.status !== 'completed' && o.status !== 'cancelled');
                setHasActiveOrder(active);
            } catch (e) {}
        };
        checkOrders();
        const interval = setInterval(checkOrders, 15000);
        return () => clearInterval(interval);
    }, [user]);

    // Map theme names for cycle
    const themeCycle = {
        'light': 'dark',
        'dark': 'pink',
        'pink': 'light'
    };

    const themeIcons = {
        'light': '☀️',
        'dark': '🌙',
        'pink': '🌸'
    };

    const handleThemeToggle = () => {
        setTheme(themeCycle[theme] || 'dark');
    };

    const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", background: "var(--bg-primary)", position: "relative", overflow: "hidden" }}>

            {/* Main Header - Only on Home */}
            {showTopNav && (
                <div style={{ padding: "16px 20px 12px", background: "var(--glass-header)", backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 100, borderBottom: "1px solid var(--card-border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <div style={{ fontFamily: "'Fraunces', serif", color: "var(--brand-accent)", fontWeight: 900, fontSize: 18, letterSpacing: "-0.5px" }}>SEJONG EATS</div>
                            <div style={{ color: "var(--text-secondary)", fontSize: 11 }}>Muslim Namja Delivery APP</div>
                        </div>
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <button onClick={handleThemeToggle} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>
                                {themeIcons[theme] || '🌙'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Content Area */}
            <div className="hide-scrollbar" style={{ paddingBottom: "100px", overflowY: "auto", height: showTopNav ? "calc(100vh - 60px)" : "100vh" }}>
                <Outlet />
            </div>

            {/* Bottom Floating Nav */}
            <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "var(--glass-nav)", backdropFilter: "blur(24px)", borderTop: "1px solid var(--card-border)", padding: "8px 0 20px", display: "flex", justifyContent: "space-around", zIndex: 200 }}>
                <NavItem to="/" icon="🏠" label={t('home') || 'Home'} />
                <NavItem to="/community" icon="💬" label={t('community') || 'Community'} />

                <NavLink to="/track" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`} style={{ background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", padding: "4px 12px", borderRadius: 12, textDecoration: "none", position: 'relative' }}>
                    {({ isActive }) => (
                        <>
                            <span style={{ fontSize: 22, filter: isActive ? "none" : "grayscale(1) opacity(0.5)" }}>📍</span>
                            {hasActiveOrder && !isActive && (
                                <span style={{
                                    position: 'absolute', top: 0, right: 6,
                                    width: 10, height: 10, borderRadius: '50%',
                                    background: '#FF6B35',
                                    border: '2px solid var(--bg-primary)',
                                    animation: 'pulse-badge 2s ease-in-out infinite'
                                }} />
                            )}
                            <span style={{ fontSize: 10, color: isActive ? "var(--brand-accent)" : "var(--text-secondary)", fontWeight: isActive ? 700 : 500 }}>{t('tracking') || 'Track'}</span>
                            {isActive && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--brand-accent)" }} />}
                        </>
                    )}
                </NavLink>
                <style>{`@keyframes pulse-badge { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.3); opacity: 0.7; } }`}</style>

                <NavLink to="/cart" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`} style={{ background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", padding: "4px 12px", borderRadius: 12, textDecoration: "none", position: 'relative' }}>
                    {({ isActive }) => (
                        <>
                            <span style={{ fontSize: 22, filter: isActive ? "none" : "grayscale(1) opacity(0.5)" }}>🛒</span>
                            {cartCount > 0 && <span style={{ position: "absolute", top: 0, right: 6, background: "var(--brand-accent)", color: "#fff", fontSize: 9, borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{cartCount}</span>}
                            <span style={{ fontSize: 10, color: isActive ? "var(--brand-accent)" : "var(--text-secondary)", fontWeight: isActive ? 700 : 500 }}>{t('cart') || 'Cart'}</span>
                            {isActive && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--brand-accent)" }} />}
                        </>
                    )}
                </NavLink>

                <NavItem to="/profile" icon="👤" label={t('profile') || 'Profile'} />

                {user?.role === 'admin' && (
                    <NavItem to="/admin" icon="🛡️" label="Admin" />
                )}
                {user?.role === 'delivery' && (
                    <NavItem to="/delivery" icon="🛵" label="Driver" />
                )}
            </div>
        </div>
    );
};

const NavItem = ({ to, icon, label }) => (
    <NavLink
        to={to}
        style={{ background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", padding: "4px 12px", borderRadius: 12, textDecoration: "none" }}
    >
        {({ isActive }) => (
            <>
                <span style={{ fontSize: 22, filter: isActive ? "none" : "grayscale(1) opacity(0.5)" }}>{icon}</span>
                <span style={{ fontSize: 10, color: isActive ? "var(--brand-accent)" : "var(--text-secondary)", fontWeight: isActive ? 700 : 500 }}>{label}</span>
                {isActive && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--brand-accent)" }} />}
            </>
        )}
    </NavLink>
);

export default Layout;
