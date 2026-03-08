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
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-primary)', position: 'relative' }}>
            {/* Premium Header */}
            <header className="glass" style={{
                padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid var(--glass-border)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '38px', height: '38px', background: 'linear-gradient(135deg, var(--brand-primary), #065f46)',
                        borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                    }}>
                        <Shield size={20} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text-primary)', fontWeight: 800 }}>Muslim Namja</h1>
                        <p style={{ fontSize: '10px', margin: 0, color: 'var(--brand-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Premium Halal Food</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="glass"
                        style={{ border: 'none', borderRadius: '12px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}
                    >
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>
                    <div style={{ position: 'relative' }}>
                        <select value={lang} onChange={handleLangChange} style={{
                            background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px',
                            padding: '0 12px', height: '40px', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 700,
                            appearance: 'none', outline: 'none'
                        }}>
                            <option value="en">EN</option>
                            <option value="ko">KO</option>
                            <option value="uz">UZ</option>
                            <option value="ru">RU</option>
                        </select>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '24px', paddingBottom: '120px' }}>
                <Outlet />
            </main>

            {/* Floating Pill Navigation */}
            <nav className="floating-nav">
                <NavItem to="/" icon={<Home size={22} />} label={t('nav_menu')} />
                <NavItem to="/community" icon={<MessageSquare size={22} />} label={t('nav_community')} />

                <NavItem to="/cart" icon={
                    <div style={{ position: 'relative' }}>
                        <ShoppingCart size={22} />
                        {cartItemsCount > 0 && (
                            <span style={{
                                position: 'absolute', top: '-6px', right: '-6px', background: 'var(--brand-gold)',
                                color: 'white', fontSize: '9px', borderRadius: '50%', width: '18px', height: '18px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold',
                                border: '2px solid var(--bg-secondary)', boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
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
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
    >
        <div className="icon-container">
            {icon}
        </div>
        <span>{label}</span>
    </NavLink>
);

export default Layout;
