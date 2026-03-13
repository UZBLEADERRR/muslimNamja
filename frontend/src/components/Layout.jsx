import React, { useEffect, useState, useRef } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import { io } from 'socket.io-client';
import VideoCallModal from './VideoCallModal';

const SOCKET_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';

const Layout = () => {
    const { t, lang } = useTranslation();
    const { setLang, setTheme, theme, user, cart } = useAppStore();
    const location = useLocation();
    const navigate = useNavigate();
    const showTopNav = location.pathname === '/';
    const [hasActiveOrder, setHasActiveOrder] = useState(false);

    // Global Real-time States
    const [incomingCall, setIncomingCall] = useState(null);
    const [activeCall, setActiveCall] = useState(null);
    const [toastMsg, setToastMsg] = useState(null);
    const socketRef = useRef(null);

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

        // Global Socket Connection
        const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
        socketRef.current = socket;

        socket.emit('join-room', `user_${user.id}`);

        socket.on('webrtc-offer', (data) => {
            if (!activeCall && (!incomingCall || incomingCall.roomName !== data.room)) {
                setIncomingCall({
                    callerName: data.callerName || 'Qo\'ng\'iroq',
                    signalData: data.signalData,
                    roomName: data.room,
                    targetId: data.targetId
                });
            }
        });

        socket.on('new-message-alert', (data) => {
            if (String(data.senderId) !== String(user?.id)) {
                setToastMsg({ text: data.text || 'Rasm', sender: data.sender?.firstName || 'Mijoz' });
                // Play notification sound if possible
                try { new Audio('/assets/notification.mp3').play().catch(() => {}); } catch(e){}
                setTimeout(() => setToastMsg(null), 5000);
            }
        });

        return () => {
            clearInterval(interval);
            socket.disconnect();
        };
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

            {/* Premium In-App Notification (Toast) */}
            {toastMsg && (
                <div onClick={() => navigate('/community')} style={{
                    position: 'fixed',
                    top: 20,
                    left: '5%',
                    right: '5%',
                    zIndex: 10000,
                    background: 'rgba(20, 25, 35, 0.85)',
                    backdropFilter: 'blur(15px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '20px',
                    padding: '12px 16px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    animation: 'slideDown 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    cursor: 'pointer'
                }}>
                    <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, var(--brand-accent), #FF3CAC)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                        boxShadow: '0 4px 12px rgba(255,107,53,0.3)'
                    }}>💬</div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 2 }}>{toastMsg.sender}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{toastMsg.text}</div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setToastMsg(null); }} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 28, height: 28, color: '#fff', fontSize: 14 }}>✕</button>
                </div>
            )}

            {/* Global Incoming Call - Premium Look */}
            {incomingCall && !activeCall && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(5, 10, 20, 0.95)', backdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.4s ease' }}>
                    <div style={{ position: 'relative', marginBottom: 30 }}>
                        <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'linear-gradient(135deg, #FF6B35, #FF3CAC)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56, boxShadow: '0 0 60px rgba(255,107,53,0.4)', animation: 'pulse-call 1.5s infinite', zIndex: 2 }}>📞</div>
                        <div style={{ position: 'absolute', inset: -10, borderRadius: '50%', border: '2px solid rgba(255,107,53,0.3)', animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
                    </div>
                    
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ color: '#fff', fontSize: 28, fontWeight: 900, marginBottom: 8, letterSpacing: -0.5 }}>{incomingCall.callerName}</div>
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, fontWeight: 500, animation: 'blink 1s infinite' }}>Sizga qo'ng'iroq qilmoqda...</div>
                    </div>

                    <div style={{ display: 'flex', gap: 40, marginTop: 80 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                            <button onClick={() => setIncomingCall(null)} style={{ width: 72, height: 72, borderRadius: '50%', border: 'none', background: '#FF3B30', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 8px 25px rgba(255,59,48,0.4)', fontSize: 32, transition: 'transform 0.2s' }} onMouseDown={e => e.currentTarget.style.transform='scale(0.9)'} onMouseUp={e => e.currentTarget.style.transform='scale(1)'}>✕</button>
                            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600 }}>Rad etish</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                            <button onClick={() => { setActiveCall({ isReceiving: true, callerName: incomingCall.callerName, signalData: incomingCall.signalData, roomName: incomingCall.roomName }); setIncomingCall(null); }} style={{ width: 72, height: 72, borderRadius: '50%', border: 'none', background: '#34C759', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 8px 25px rgba(52,199,89,0.4)', fontSize: 32, transition: 'transform 0.2s' }} onMouseDown={e => e.currentTarget.style.transform='scale(0.9)'} onMouseUp={e => e.currentTarget.style.transform='scale(1)'}>📞</button>
                            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600 }}>Qabul qilish</span>
                        </div>
                    </div>

                    <style>{`
                        @keyframes slideDown { from { transform: translateY(-100px) scale(0.9); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
                        @keyframes pulse-call { 0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,107,53, 0.7); } 70% { transform: scale(1.05); box-shadow: 0 0 0 20px rgba(255,107,53, 0); } 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,107,53, 0); } }
                        @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
                        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
                    `}</style>
                </div>
            )}

            {/* Global Active Call */}
            {activeCall && (
                <VideoCallModal 
                    socket={socketRef.current}
                    roomName={activeCall.roomName}
                    isReceiving={activeCall.isReceiving}
                    callerName={activeCall.callerName}
                    signalData={activeCall.signalData}
                    onEndCall={() => setActiveCall(null)}
                />
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
