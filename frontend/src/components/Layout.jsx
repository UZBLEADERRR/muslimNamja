import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, MessageSquare, ShoppingCart, User as UserIcon, Truck, Shield } from 'lucide-react';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store/useAppStore';

const Layout = () => {
    const { t, lang } = useTranslation();
    const { setLang, setTheme, theme, user, cart } = useAppStore();

    const handleLangChange = (e) => setLang(e.target.value);
    // const handleThemeChange = (e) => setTheme(e.target.value); // This line is commented out or removed in the new code

    const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-primary)' }}>
            {/* Header */}
            <header className="glass" style={{
                padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid var(--glass-border)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '32px', height: '32px', background: 'var(--brand-primary)', borderRadius: '10px' }}></div>
                    <h1 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--brand-dark)' }}>Muslim Namja</h1>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        style={{ background: 'var(--bg-tertiary)', border: 'none', borderRadius: '10px', padding: '6px 10px', color: 'var(--text-primary)' }}
                    >
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>
                    <select value={lang} onChange={handleLangChange} style={{
                        background: 'var(--bg-tertiary)', border: 'none', borderRadius: '10px',
                        padding: '6px 8px', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600
                    }}>
                        <option value="en">EN</option>
                        <option value="ko">KO</option>
                        <option value="uz">UZ</option>
                        <option value="ru">RU</option>
                    </select>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '20px', paddingBottom: '100px' }}>
                <Outlet />
            </main>

            {/* Bottom Navigation */}
            <nav className="glass" style={{
                position: 'fixed', bottom: '16px', left: '16px', right: '16px',
                display: 'flex', justifyContent: 'space-around', alignItems: 'center',
                padding: '12px 0', borderRadius: '24px', zIndex: 100,
                boxShadow: '0 8px 32px rgba(6, 78, 59, 0.15)', border: '1px solid var(--glass-border)'
            }}>
                <NavItem to="/" icon={<Home size={22} />} label={t('nav_menu')} />
                <NavItem to="/community" icon={<MessageSquare size={22} />} label={t('nav_community')} />

                <NavItem to="/cart" icon={
                    <div style={{ position: 'relative' }}>
                        <ShoppingCart size={22} />
                        {cartItemsCount > 0 && (
                            <span style={{
                                position: 'absolute', top: '-6px', right: '-6px', background: 'var(--accent-color)',
                                color: 'white', fontSize: '9px', borderRadius: '50%', width: '16px', height: '16px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }}>
                                {cartItemsCount}
                            </span>
                        )}
                    </div>
                } label={t('nav_cart')} />

                <NavItem to="/profile" icon={<UserIcon size={22} />} label={t('nav_profile')} />

                {user?.role === 'admin' && (
                    <NavItem to="/admin" icon={<Shield size={22} />} label={t('nav_admin')} />
                )}
            </nav>
        </div>
    );
};

const NavItem = ({ to, icon, label }) => (
    <NavLink
        to={to}
        style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textDecoration: 'none',
            color: isActive ? 'var(--brand-primary)' : 'var(--text-secondary)',
            transition: 'color 0.2s ease',
            fontSize: '12px',
            gap: '4px'
        })}
    >
        {icon}
        <span style={{ fontWeight: 500 }}>{label}</span>
    </NavLink>
);

export default Layout;
