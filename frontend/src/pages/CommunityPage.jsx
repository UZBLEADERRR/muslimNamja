import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import api from '../utils/api';
import { Image, Edit2, Trash2, X, Pin, Copy, Reply, Users, Send, DollarSign, MessageCircle } from 'lucide-react';
import io from 'socket.io-client';
import DirectChat from '../components/DirectChat';

const SOCKET_URL = (import.meta.env.VITE_API_URL || '').replace('/api', '') || window.location.origin;

// Premium snow particle component
const SnowParticles = () => {
    const particles = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 3,
        size: Math.random() * 4 + 2,
        duration: Math.random() * 3 + 4
    }));
    return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
            {particles.map(p => (
                <div key={p.id} style={{
                    position: 'absolute', left: `${p.left}%`, top: -10,
                    width: p.size, height: p.size, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.8)', boxShadow: '0 0 4px rgba(255,255,255,0.5)',
                    animation: `snowFall ${p.duration}s linear ${p.delay}s infinite`
                }} />
            ))}
            <style>{`
                @keyframes snowFall {
                    0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(120px) rotate(360deg); opacity: 0; }
                }
            `}</style>
        </div>
    );
};

const isPremium = (u) => (u?.walletBalance || 0) > 0;

const CommunityPage = () => {
    const { t } = useTranslation();
    const { user } = useAppStore();
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [contextMenu, setContextMenu] = useState(null);
    const [editingMsg, setEditingMsg] = useState(null);
    const [replyTo, setReplyTo] = useState(null);
    const [showMembers, setShowMembers] = useState(false);
    const [allUsers, setAllUsers] = useState([]);
    const [transferTarget, setTransferTarget] = useState(null);
    const [transferAmount, setTransferAmount] = useState('');
    const [transferring, setTransferring] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [dmConversation, setDmConversation] = useState(null);

    // Swipe state
    const [swipingId, setSwipingId] = useState(null);
    const [swipeX, setSwipeX] = useState(0);
    const swipeStart = useRef(null);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const longPressTimer = useRef(null);
    const msgRefs = useRef({});
    const socketRef = useRef(null);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    const scrollToMsg = (msgId) => {
        const el = msgRefs.current[msgId];
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.style.transition = 'background 0.3s';
            el.style.background = 'rgba(255,107,53,0.15)';
            setTimeout(() => { el.style.background = ''; }, 1500);
        }
    };

    const fetchMessages = () => {
        api.get('/chat')
            .then(res => setPosts(res.data || []))
            .catch(err => console.error('Fetch chat error:', err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchMessages();

        // Socket.IO connection
        const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
        socketRef.current = socket;
        socket.on('connect', () => {
            socket.emit('join-room', 'community');
        });
        socket.on('new-community-msg', (msg) => {
            setPosts(prev => {
                if (prev.find(p => p.id === msg.id)) return prev;
                return [...prev, msg];
            });
        });

        return () => { socket.disconnect(); };
    }, []);

    useEffect(() => {
        if (!editingMsg) scrollToBottom();
    }, [posts, sending]);

    useEffect(() => {
        const handler = () => setContextMenu(null);
        if (contextMenu) document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, [contextMenu]);

    const pinnedMsg = posts.find(p => p.isPinned && !p.isDeleted);

    // Swipe-to-reply handlers
    const handleSwipeStart = (e, msg) => {
        swipeStart.current = e.touches?.[0]?.clientX || e.clientX;
        setSwipingId(msg.id);
        setSwipeX(0);
    };

    const handleSwipeMove = useCallback((e) => {
        if (!swipingId || swipeStart.current === null) return;
        const currentX = e.touches?.[0]?.clientX || e.clientX;
        const diff = currentX - swipeStart.current;
        if (diff > 0) setSwipeX(Math.min(diff, 80));
    }, [swipingId]);

    const handleSwipeEnd = useCallback(() => {
        if (swipeX > 50) {
            const msg = posts.find(p => p.id === swipingId);
            if (msg && !msg.isDeleted) {
                setReplyTo(msg);
                // Haptic feedback
                if (window.Telegram?.WebApp?.HapticFeedback) {
                    window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
                }
            }
        }
        setSwipeX(0);
        setSwipingId(null);
        swipeStart.current = null;
    }, [swipeX, swipingId, posts]);

    // Long press handlers
    const handleTouchStart = (e, msg) => {
        longPressTimer.current = setTimeout(() => {
            const rect = e.target.getBoundingClientRect();
            setContextMenu({ x: rect.left + 20, y: rect.top - 10, msg });
        }, 500);
    };
    const handleTouchEnd = () => clearTimeout(longPressTimer.current);

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const clearImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !imageFile) || sending) return;
        if (!user) return alert(t('login_prompt'));

        setSending(true);
        try {
            if (editingMsg) {
                await api.put(`/chat/${editingMsg.id}`, { text: newMessage });
                setEditingMsg(null);
            } else if (imageFile) {
                const formData = new FormData();
                formData.append('image', imageFile);
                if (newMessage.trim()) formData.append('text', newMessage);
                if (replyTo) formData.append('replyToId', replyTo.id);
                await api.post('/chat/image', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                clearImage();
            } else {
                await api.post('/chat', { text: newMessage, replyToId: replyTo?.id || null });
            }

            setNewMessage('');
            setReplyTo(null);
            fetchMessages();
        } catch (err) {
            console.error('Failed to send:', err);
            alert(err.response?.data?.error || 'Xato yuz berdi');
        } finally {
            setSending(false);
        }
    };

    const handleDelete = async (id) => {
        try { await api.delete(`/chat/${id}`); setContextMenu(null); fetchMessages(); }
        catch (err) { alert(err.response?.data?.error || "O'chirib bo'lmadi"); }
    };
    const handlePin = async (id) => {
        try { await api.post(`/chat/${id}/pin`); setContextMenu(null); fetchMessages(); }
        catch (err) { alert(err.response?.data?.error || "Pin qilib bo'lmadi"); }
    };
    const handleCopy = (text) => { navigator.clipboard.writeText(text).catch(() => {}); setContextMenu(null); };
    const startReply = (msg) => { setReplyTo(msg); setContextMenu(null); };
    const startEdit = (msg) => { setEditingMsg(msg); setNewMessage(msg.text === "O'chirilgan xabar" ? "" : msg.text); setContextMenu(null); clearImage(); };
    const cancelEdit = () => { setEditingMsg(null); setNewMessage(''); };

    const openMembers = async () => {
        try { const res = await api.get('/users/all'); setAllUsers(res.data || []); setShowMembers(true); }
        catch (err) { console.error(err); }
    };

    const handleTransfer = async () => {
        if (!transferTarget || !transferAmount) return;
        setTransferring(true);
        try {
            const res = await api.post('/users/transfer', { toUserId: transferTarget.id, amount: parseInt(transferAmount) });
            alert(res.data.message);
            setTransferTarget(null); setTransferAmount(''); setShowMembers(false);
        } catch (err) { alert(err.response?.data?.error || "O'tkazishda xatolik"); }
        finally { setTransferring(false); }
    };

    const getDisplayName = (sender) => sender?.nickname || sender?.firstName || 'User';

    const getAvatar = (sender) => {
        if (sender?.avatarUrl?.startsWith('data:image')) {
            return <img src={sender.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />;
        }
        if (sender?.role === 'admin') return '⭐';
        return sender?.firstName?.[0]?.toUpperCase() || '👤';
    };

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
            {/* Sticky Header */}
            <div onClick={openMembers} style={{ padding: '12px 20px', background: 'var(--bg-primary)', borderBottom: '1px solid var(--card-border)', zIndex: 10, cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h2 style={{ color: "var(--text-primary)", fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 900, margin: 0 }}>
                            {t('campus_feed')} 🏫
                        </h2>
                        <p style={{ color: "var(--text-secondary)", fontSize: 11, margin: 0 }}>{posts.length} {t('messages')} · A'zolarni ko'rish uchun bosing</p>
                    </div>
                    <Users size={20} color="var(--brand-accent)" />
                </div>
            </div>

            {/* Pinned Message Banner - Clickable */}
            {pinnedMsg && (
                <div onClick={() => scrollToMsg(pinnedMsg.id)} style={{ padding: '8px 20px', background: 'rgba(255,107,53,0.08)', borderBottom: '1px solid rgba(255,107,53,0.2)', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <Pin size={14} color="var(--brand-accent)" />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, color: 'var(--brand-accent)', fontWeight: 800 }}>📌 Qadalgan xabar</div>
                        <div style={{ fontSize: 12, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pinnedMsg.text}</div>
                    </div>
                </div>
            )}

            {/* Messages Scroll Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>{t('loading')}...</div>
                ) : posts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>💬<br />Xabarlar yo'q</div>
                ) : (
                    posts.map(post => {
                        const isMe = user && post.senderId === user.id;
                        const isAdmin = user && user.role === 'admin';
                        const canModify = !post.isDeleted;
                        const premium = isPremium(post.sender);
                        const isCurrentlySwiping = swipingId === post.id;

                        return (
                            <div
                                key={post.id}
                                ref={el => { msgRefs.current[post.id] = el; }}
                                onTouchStart={(e) => {
                                    if (canModify) {
                                        handleSwipeStart(e, post);
                                        handleTouchStart(e, post);
                                    }
                                }}
                                onTouchMove={handleSwipeMove}
                                onTouchEnd={() => { handleSwipeEnd(); handleTouchEnd(); }}
                                onContextMenu={(e) => { e.preventDefault(); if (canModify) setContextMenu({ x: e.clientX, y: e.clientY, msg: post }); }}
                                onDoubleClick={() => { if (canModify) startReply(post); }}
                                style={{
                                    display: 'flex',
                                    flexDirection: isMe ? 'row-reverse' : 'row',
                                    gap: 8,
                                    marginBottom: 16,
                                    alignItems: 'flex-end',
                                    padding: '0 10px',
                                    opacity: post.isDeleted ? 0.7 : 1,
                                    transform: isCurrentlySwiping ? `translateX(${swipeX}px)` : 'translateX(0)',
                                    transition: isCurrentlySwiping ? 'none' : 'transform 0.2s ease',
                                    position: 'relative',
                                    borderRadius: 12
                                }}
                            >
                                {/* Swipe reply indicator */}
                                {isCurrentlySwiping && swipeX > 20 && (
                                    <div style={{
                                        position: 'absolute', left: -30, top: '50%', transform: 'translateY(-50%)',
                                        width: 28, height: 28, borderRadius: '50%',
                                        background: swipeX > 50 ? 'var(--brand-accent)' : 'var(--card-border)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'background 0.2s', fontSize: 14
                                    }}>
                                        <Reply size={14} color="#fff" />
                                    </div>
                                )}

                                {/* Avatar */}
                                <div
                                    onClick={() => setSelectedProfile(post.sender)}
                                    style={{
                                        width: 36, height: 36, borderRadius: "50%",
                                        background: premium
                                            ? 'linear-gradient(135deg, #FFD700, #FF6B35)'
                                            : isMe ? "var(--brand-accent)" : "rgba(255,107,53,0.1)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 16, color: isMe || premium ? '#fff' : 'inherit',
                                        overflow: 'hidden', flexShrink: 0,
                                        cursor: 'pointer',
                                        border: premium ? '2px solid #FFD700' : '2px solid var(--card-bg)',
                                        position: 'relative'
                                    }}
                                >
                                    {getAvatar(post.sender)}
                                </div>

                                <div style={{
                                    background: isMe ? "var(--brand-accent)" : "var(--card-bg)",
                                    border: `1px solid ${post.isPinned ? 'var(--brand-accent2)' : 'var(--card-border)'}`,
                                    borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                                    padding: 12, maxWidth: '75%', position: 'relative',
                                    userSelect: 'none', boxShadow: 'var(--shadow-main)'
                                }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                        <div style={{ color: isMe ? "rgba(255,255,255,0.9)" : premium ? '#FFD700' : "var(--brand-accent2)", fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                                            {premium && '⭐ '}{getDisplayName(post.sender)}
                                        </div>
                                    </div>

                                    {/* Reply-to preview - clickable */}
                                    {post.replyTo && (
                                        <div onClick={() => scrollToMsg(post.replyTo.id)} style={{ padding: '6px 10px', marginBottom: 8, borderLeft: `3px solid ${isMe ? '#fff' : 'var(--brand-accent)'}`, background: isMe ? 'rgba(0,0,0,0.1)' : 'rgba(255,107,53,0.05)', borderRadius: '0 8px 8px 0', fontSize: 11, cursor: 'pointer' }}>
                                            <div style={{ color: isMe ? '#fff' : 'var(--brand-accent)', fontWeight: 700 }}>{post.replyTo.sender?.firstName}</div>
                                            <div style={{ color: isMe ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{post.replyTo.text}</div>
                                        </div>
                                    )}

                                    {/* Image */}
                                    {post.imageUrl && (
                                        <div style={{ marginBottom: 8, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--card-border)' }}>
                                            <img src={post.imageUrl} alt="chat" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }} />
                                        </div>
                                    )}

                                    <p style={{
                                        color: post.isDeleted ? (isMe ? "rgba(255,255,255,0.7)" : "var(--text-secondary)") : (isMe ? "#fff" : "var(--text-primary)"),
                                        fontStyle: post.isDeleted ? "italic" : "normal",
                                        fontSize: 14, lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word'
                                    }}>
                                        {post.text}
                                    </p>

                                    <div style={{ color: isMe ? "rgba(255,255,255,0.7)" : "var(--text-secondary)", fontSize: 10, textAlign: 'right', marginTop: 4 }}>
                                        {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        {post.editedAt && " (tahrirlangan)"}
                                        {post.isPinned && " 📌"}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <div style={{ position: 'fixed', left: Math.min(contextMenu.x, window.innerWidth - 180), top: Math.min(contextMenu.y, window.innerHeight - 200), background: 'var(--glass-nav)', backdropFilter: 'blur(16px)', border: '1px solid var(--card-border)', borderRadius: 14, overflow: 'hidden', zIndex: 1000, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', minWidth: 160 }}
                    onClick={e => e.stopPropagation()}
                >
                    <button onClick={() => startReply(contextMenu.msg)} style={ctxBtnStyle}><Reply size={14} /> Javob berish</button>
                    <button onClick={() => handleCopy(contextMenu.msg.text)} style={ctxBtnStyle}><Copy size={14} /> Nusxalash</button>
                    {user && contextMenu.msg.senderId === user.id && (
                        <button onClick={() => startEdit(contextMenu.msg)} style={ctxBtnStyle}><Edit2 size={14} /> Tahrirlash</button>
                    )}
                    {user?.role === 'admin' && (
                        <button onClick={() => handlePin(contextMenu.msg.id)} style={{ ...ctxBtnStyle, color: 'var(--brand-accent)' }}>
                            <Pin size={14} /> {contextMenu.msg.isPinned ? 'Olib tashlash' : 'Pin qilish'}
                        </button>
                    )}
                    {(user && (contextMenu.msg.senderId === user.id || user.role === 'admin')) && (
                        <button onClick={() => handleDelete(contextMenu.msg.id)} style={{ ...ctxBtnStyle, color: '#ff4d4f' }}><Trash2 size={14} /> O'chirish</button>
                    )}
                </div>
            )}

            {/* Members Modal - Modern */}
            {showMembers && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => { setShowMembers(false); setTransferTarget(null); }}>
                    <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 430, maxHeight: '75vh', background: 'var(--bg-primary)', borderRadius: '24px 24px 0 0', padding: '20px', overflowY: 'auto', animation: 'slideUp 0.3s ease' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3 style={{ margin: 0, color: 'var(--text-primary)', fontFamily: "'Fraunces', serif" }}>👥 A'zolar ({allUsers.length})</h3>
                            <button onClick={() => setShowMembers(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
                        </div>

                        {transferTarget && (
                            <div style={{ padding: 14, background: 'rgba(255,107,53,0.08)', borderRadius: 16, marginBottom: 16, border: '1px solid var(--brand-accent)' }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>💸 {transferTarget.firstName} ga pul o'tkazish</div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <input type="number" value={transferAmount} onChange={e => setTransferAmount(e.target.value)} placeholder="₩ Summa" style={{ flex: 1, padding: 12, borderRadius: 12, border: '1px solid var(--card-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }} />
                                    <button onClick={handleTransfer} disabled={transferring} style={{ background: 'var(--brand-accent)', color: '#fff', border: 'none', borderRadius: 12, padding: '0 20px', fontWeight: 700, cursor: 'pointer' }}>
                                        {transferring ? '...' : <Send size={16} />}
                                    </button>
                                </div>
                                <button onClick={() => setTransferTarget(null)} style={{ marginTop: 8, background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}>Bekor qilish</button>
                            </div>
                        )}

                        {allUsers.filter(u => u.id !== user?.id).map((u, idx) => {
                            const prem = isPremium(u);
                            return (
                                <div key={u.id} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '12px 0', borderBottom: '1px solid var(--card-border)',
                                    animation: `fadeIn 0.3s ease ${idx * 30}ms both`
                                }}>
                                    <div onClick={() => { setSelectedProfile(u); setShowMembers(false); }} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', flex: 1 }}>
                                        <div style={{
                                            width: 44, height: 44, borderRadius: '50%', position: 'relative',
                                            background: prem ? 'linear-gradient(135deg, #FFD700, #FF6B35)' : u.role === 'admin' ? 'var(--brand-accent)' : 'var(--bg-secondary)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                                            fontSize: 16, color: prem || u.role === 'admin' ? '#fff' : 'var(--text-secondary)',
                                            border: prem ? '2px solid #FFD700' : '2px solid var(--card-border)',
                                            boxShadow: prem ? '0 0 12px rgba(255,215,0,0.3)' : 'none'
                                        }}>
                                            {u.avatarUrl?.startsWith('data:image') ? <img src={u.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (u.role === 'admin' ? '⭐' : u.firstName?.[0]?.toUpperCase())}
                                            {prem && <SnowParticles />}
                                        </div>
                                        <div>
                                            <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                {prem && '✨ '}{u.nickname || u.firstName} {u.lastName || ''}
                                            </div>
                                            <div style={{ color: 'var(--text-secondary)', fontSize: 11 }}>
                                                {u.role === 'admin' ? '⭐ Admin' : u.role === 'delivery' ? '🛵 Kuryer' : prem ? '💎 Premium' : 'A\'zo'}
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => setTransferTarget(u)} style={{ background: 'var(--brand-accent2)', color: '#fff', border: 'none', borderRadius: 10, padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <DollarSign size={12} /> O'tkazish
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Profile View Modal - Premium Enhanced */}
            {selectedProfile && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setSelectedProfile(null)}>
                    <div onClick={e => e.stopPropagation()} style={{
                        background: 'var(--card-bg)', width: '100%', maxWidth: 320, borderRadius: 24, padding: 24,
                        textAlign: 'center', position: 'relative', overflow: 'hidden',
                        boxShadow: isPremium(selectedProfile) ? '0 0 40px rgba(255,215,0,0.2), 0 12px 40px rgba(0,0,0,0.3)' : '0 12px 40px rgba(0,0,0,0.3)',
                        border: isPremium(selectedProfile) ? '1px solid rgba(255,215,0,0.3)' : '1px solid var(--card-border)'
                    }}>
                        {isPremium(selectedProfile) && <SnowParticles />}

                        <button onClick={() => setSelectedProfile(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'var(--bg-secondary)', border: 'none', borderRadius: '50%', padding: 8, color: 'var(--text-secondary)', cursor: 'pointer', zIndex: 2 }}><X size={16} /></button>

                        <div style={{
                            width: 80, height: 80, borderRadius: '50%',
                            background: isPremium(selectedProfile) ? 'linear-gradient(135deg, #FFD700, #FF6B35)' : 'linear-gradient(135deg, var(--brand-accent), #FF3CAC)',
                            margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 36, color: '#fff', overflow: 'hidden', position: 'relative', zIndex: 2,
                            border: isPremium(selectedProfile) ? '3px solid #FFD700' : '4px solid var(--card-bg)',
                            boxShadow: isPremium(selectedProfile) ? '0 0 20px rgba(255,215,0,0.4)' : '0 4px 12px rgba(255,107,53,0.3)'
                        }}>
                            {getAvatar(selectedProfile)}
                        </div>

                        <h3 style={{ margin: '0 0 4px', fontSize: 20, color: 'var(--text-primary)', fontFamily: "'Fraunces', serif", position: 'relative', zIndex: 2 }}>
                            {isPremium(selectedProfile) && '✨ '}{selectedProfile.nickname || selectedProfile.firstName} {selectedProfile.lastName || ''}
                        </h3>
                        <p style={{ margin: '0 0 16px', color: 'var(--brand-accent)', fontWeight: 800, fontSize: 14, position: 'relative', zIndex: 2 }}>
                            @{selectedProfile.username || selectedProfile.nickname || 'user'}
                        </p>

                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 20, position: 'relative', zIndex: 2 }}>
                            <div style={{ background: 'var(--bg-secondary)', padding: '8px 16px', borderRadius: 12 }}>
                                <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Rol</div>
                                <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 600 }}>{selectedProfile.role === 'admin' ? 'Admin ⭐' : isPremium(selectedProfile) ? '💎 Premium' : 'A\'zo'}</div>
                            </div>
                            {isPremium(selectedProfile) && (
                                <div style={{ background: 'rgba(255,215,0,0.1)', padding: '8px 16px', borderRadius: 12, border: '1px solid rgba(255,215,0,0.2)' }}>
                                    <div style={{ fontSize: 11, color: '#FFD700', fontWeight: 700, textTransform: 'uppercase' }}>Hamyon</div>
                                    <div style={{ fontSize: 14, color: '#FFD700', fontWeight: 600 }}>₩{(selectedProfile.walletBalance || 0).toLocaleString()}</div>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: 10, position: 'relative', zIndex: 2 }}>
                            <button onClick={async () => {
                                const dmData = { type: 'dm', targetId: selectedProfile.id, name: selectedProfile.nickname || selectedProfile.firstName };
                                try {
                                    await api.post(`/inbox/${selectedProfile.id}`, { text: `Salom! 👋` });
                                } catch (e) {
                                    console.log('DM init note:', e?.response?.data?.error || e.message);
                                }
                                setSelectedProfile(null);
                                setDmConversation(dmData);
                            }} style={{ flex: 1, padding: 14, borderRadius: 14, background: 'var(--brand-accent2)', color: '#fff', border: 'none', fontWeight: 800, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                <MessageCircle size={18} /> Xabar yozish
                            </button>
                            <button onClick={() => { setTransferTarget(selectedProfile); setSelectedProfile(null); setShowMembers(true); }} style={{ flex: 1, padding: 14, borderRadius: 14, background: 'var(--brand-accent)', color: '#fff', border: 'none', fontWeight: 800, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                <DollarSign size={18} /> Pul O'tkazish
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DirectChat Overlay from Profile */}
            {dmConversation && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'var(--bg-primary)' }}>
                    <DirectChat conversation={dmConversation} onBack={() => setDmConversation(null)} />
                </div>
            )}

            {/* Input Area */}
            <div style={{ padding: '8px 16px', background: 'var(--bg-primary)', borderTop: '1px solid var(--card-border)', zIndex: 20 }}>
                {imagePreview && (
                    <div style={{ position: 'relative', display: 'inline-block', marginBottom: 8 }}>
                        <img src={imagePreview} alt="preview" style={{ height: 60, borderRadius: 8, border: '1px solid var(--brand-accent)' }} />
                        <button onClick={clearImage} style={{ position: 'absolute', top: -5, right: -5, background: '#ff4d4f', color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <X size={12} />
                        </button>
                    </div>
                )}

                {replyTo && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px 6px', borderLeft: '3px solid var(--brand-accent)', marginBottom: 6, background: 'rgba(255,107,53,0.05)', borderRadius: '0 8px 8px 0' }}>
                        <div style={{ fontSize: 11 }}>
                            <span style={{ fontWeight: 700, color: 'var(--brand-accent)' }}>↩ {getDisplayName(replyTo.sender)}</span>
                            <div style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 250 }}>{replyTo.text}</div>
                        </div>
                        <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={14} /></button>
                    </div>
                )}

                {editingMsg && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px 6px', color: 'var(--brand-accent)', fontSize: 11, fontWeight: 600 }}>
                        <span>✏️ Xabarni tahrirlash</span>
                        <button onClick={cancelEdit} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={14} /></button>
                    </div>
                )}

                <form onSubmit={handleSendMessage} style={{ background: "var(--card-bg)", border: `1px solid ${editingMsg ? 'var(--brand-accent)' : replyTo ? 'var(--brand-accent2)' : 'var(--card-border)'}`, borderRadius: 24, padding: "6px 12px", display: "flex", gap: 10, alignItems: "center" }}>
                    {!editingMsg && (
                        <>
                            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageSelect} style={{ display: 'none' }} />
                            <button type="button" onClick={() => fileInputRef.current?.click()} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                                <Image size={20} />
                            </button>
                        </>
                    )}

                    <input
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder={editingMsg ? 'Tahrirlash...' : replyTo ? 'Javob yozing...' : 'Xabar yozing...'}
                        style={{ flex: 1, background: "none", border: "none", color: "var(--text-primary)", fontSize: 14, outline: "none", padding: '6px 0' }}
                    />

                    {(newMessage.trim() || imageFile) && (
                        <button type="submit" disabled={sending} style={{ width: 32, height: 32, borderRadius: '50%', background: sending ? 'var(--text-secondary)' : "var(--brand-accent)", color: "#fff", border: "none", display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: "pointer", padding: 0, flexShrink: 0 }}>
                            {editingMsg ? <Edit2 size={16} /> : <span style={{ fontSize: '16px' }}>↑</span>}
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
};

const ctxBtnStyle = {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '11px 16px', background: 'none', border: 'none',
    borderBottom: '1px solid var(--card-border)',
    color: 'var(--text-primary)', width: '100%',
    cursor: 'pointer', fontSize: 13, fontWeight: 600
};

export default CommunityPage;
