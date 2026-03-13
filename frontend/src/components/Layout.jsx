import React, { useEffect, useState, useRef } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import { io } from 'socket.io-client';
import IncomingCallModal from './IncomingCallModal';
import VideoCallModal from './VideoCallModal';

const SOCKET_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';
const RINGTONE_URL = 'https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3'; // Professional ringtone

const Layout = () => {
    const { t, lang } = useTranslation();
    const { 
        setLang, setTheme, theme, user, cart, 
        incomingCall, setIncomingCall, 
        activeCall, setActiveCall 
    } = useAppStore();
    const location = useLocation();
    const navigate = useNavigate();
    const showTopNav = location.pathname === '/';
    const [hasActiveOrder, setHasActiveOrder] = useState(false);

    // Global Real-time States
    const [toastMsg, setToastMsg] = useState(null);
    const socketRef = useRef(null);
    const ringtoneRef = useRef(null);

    // Ringtone management
    const playRingtone = () => {
        if (!ringtoneRef.current) {
            ringtoneRef.current = new Audio(RINGTONE_URL);
            ringtoneRef.current.loop = true;
        }
        ringtoneRef.current.play().catch(e => console.log('Audio play failed:', e));
    };

    const stopRingtone = () => {
        if (ringtoneRef.current) {
            ringtoneRef.current.pause();
            ringtoneRef.current.currentTime = 0;
        }
    };

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

        // Listen for standard signaling (legacy compatibility)
        socket.on('webrtc-offer', (data) => {
            if (!activeCall && (!incomingCall || incomingCall.roomName !== data.room)) {
                setIncomingCall({
                    callerName: data.callerName || 'Qo\'ng\'iroq',
                    callerAvatar: data.callerAvatar,
                    signalData: data.signalData,
                    roomName: data.room,
                    targetId: data.targetId
                });
                playRingtone();
            }
        });

        // Listen for new explicit events
        socket.on('incoming-call', (data) => {
            if (!activeCall) {
                setIncomingCall({
                    callerName: data.callerName || 'Qo\'ng\'iroq',
                    callerAvatar: data.callerAvatar,
                    roomName: data.room,
                    targetId: data.callerId,
                    signalData: data.signalData
                });
                playRingtone();
            }
        });

        socket.on('call-cancelled', () => {
            setIncomingCall(null);
            stopRingtone();
        });

        socket.on('call-ended', () => {
            setActiveCall(null);
            setIncomingCall(null);
            stopRingtone();
        });

        socket.on('new-message-alert', (data) => {
            if (String(data.senderId) !== String(user?.id)) {
                setToastMsg({ text: data.text || 'Rasm', sender: data.sender?.firstName || 'Mijoz' });
                try { new Audio('/assets/notification.mp3').play().catch(() => {}); } catch(e){}
                setTimeout(() => setToastMsg(null), 5000);
            }
        });

        return () => {
            clearInterval(interval);
            socket.disconnect();
            stopRingtone();
        };
    }, [user, activeCall, incomingCall]);

    const handleAcceptCall = () => {
        stopRingtone();
        if (incomingCall) {
            setActiveCall({
                isReceiving: true,
                callerName: incomingCall.callerName,
                signalData: incomingCall.signalData,
                roomName: incomingCall.roomName
            });
            socketRef.current.emit('accept-call', { room: incomingCall.roomName });
            setIncomingCall(null);
        }
    };

    const handleRejectCall = () => {
        stopRingtone();
        if (incomingCall) {
            socketRef.current.emit('reject-call', { room: incomingCall.roomName });
            setIncomingCall(null);
        }
    };

    // Map theme names for cycle
    const themeCycle = { 'light': 'dark', 'dark': 'pink', 'pink': 'light' };
    const themeIcons = { 'light': '☀️', 'dark': '🌙', 'pink': '🌸' };

    const handleThemeToggle = () => setTheme(themeCycle[theme] || 'dark');
    const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", background: "var(--bg-primary)", position: "relative" }}>

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
                    position: 'fixed', top: 20, left: '5%', right: '5%', zIndex: 10000,
                    background: 'rgba(20, 25, 35, 0.85)', backdropFilter: 'blur(15px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '20px',
                    padding: '12px 16px', boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
                    display: 'flex', alignItems: 'center', gap: 12,
                    animation: 'slideDown 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)', cursor: 'pointer'
                }}>
                    <div style={{ width: 44, height: 44, borderRadius: '14px', background: 'linear-gradient(135deg, var(--brand-accent), #FF3CAC)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 4px 12px rgba(255,107,53,0.3)' }}>💬</div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 2 }}>{toastMsg.sender}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{toastMsg.text}</div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setToastMsg(null); }} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 28, height: 28, color: '#fff', fontSize: 14 }}>✕</button>
                </div>
            )}

            {/* Global Incoming Call Modal */}
            {incomingCall && !activeCall && (
                <IncomingCallModal 
                    callerName={incomingCall.callerName}
                    callerAvatar={incomingCall.callerAvatar}
                    onAccept={handleAcceptCall}
                    onReject={handleRejectCall}
                />
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
