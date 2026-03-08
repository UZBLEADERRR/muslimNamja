import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, MessageSquare, ShoppingCart, User as UserIcon, Truck, Shield } from 'lucide-react';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store/useAppStore';

const Layout = () => {
    const { t, lang } = useTranslation();
    const { setLang, setTheme, theme, user, cart } = useAppStore();

    const handleLangChange = (e) => setLang(e.target.value);
    const handleThemeChange = (e) => setTheme(e.target.value);

    const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <div className="layout-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            {/* Header */}
            <header className="glass" style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50 }}>
                <h1 style={{ fontSize: '1.25rem', margin: 0 }}>Muslim Namja</h1>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <select value={lang} onChange={handleLangChange} style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '4px 8px', color: 'var(--text-primary)' }}>
                        <option value="en">EN</option>
                        <option value="ko">KO</option>
                        <option value="uz">UZ</option>
                        <option value="ru">RU</option>
                    </select>

                    <select value={theme} onChange={handleThemeChange} style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '4px 8px', color: 'var(--text-primary)' }}>
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="pink">Pink</option>
                    </select>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '20px', paddingBottom: '80px' }}>
                <Outlet />
            </main>

            {/* Bottom Navigation */}
            <nav className="glass" style={{
                position: 'fixed', bottom: 0, width: '100%', display: 'flex', justifyContent: 'space-around',
                padding: '10px 0', paddingBottom: 'max(10px, env(safe-area-inset-bottom))', zIndex: 50
            }}>
                <NavItem to="/" icon={<Home size={24} />} label={t('menu')} />
                <NavItem to="/community" icon={<MessageSquare size={24} />} label={t('community')} />

                <NavItem to="/cart" icon={
                    <div style={{ position: 'relative' }}>
                        <ShoppingCart size={24} />
                        {cartItemsCount > 0 && (
                            <span style={{
                                position: 'absolute', top: '-8px', right: '-8px', background: 'var(--brand-primary)',
                                color: 'white', fontSize: '10px', borderRadius: '50%', padding: '2px 6px', fontWeight: 'bold'
                            }}>
                                {cartItemsCount}
                            </span>
                        )}
                    </div>
                } label={t('cart')} />

                <NavItem to="/profile" icon={<UserIcon size={24} />} label={t('profile')} />

                {user?.role === 'delivery' && (
                    <NavItem to="/delivery" icon={<Truck size={24} />} label={t('delivery')} />
                )}

                {user?.role === 'admin' && (
                    <NavItem to="/admin" icon={<Shield size={24} />} label={t('admin')} />
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
