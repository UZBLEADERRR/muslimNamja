import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import api from '../utils/api';
import { Image, Edit2, Trash2, X, Pin, Copy, Reply, Users, Send, DollarSign } from 'lucide-react';

const CommunityPage = () => {
    const { t } = useTranslation();
    const { user } = useAppStore();
    const [posts, setPosts] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    // Context menu & reply
    const [contextMenu, setContextMenu] = useState(null); // { x, y, msg }
    const [editingMsg, setEditingMsg] = useState(null);
    const [replyTo, setReplyTo] = useState(null);

    // Members modal & P2P
    const [showMembers, setShowMembers] = useState(false);
    const [allUsers, setAllUsers] = useState([]);
    const [transferTarget, setTransferTarget] = useState(null);
    const [transferAmount, setTransferAmount] = useState('');
    const [transferring, setTransferring] = useState(false);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const longPressTimer = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchMessages = () => {
        api.get('/chat')
            .then(res => setPosts(res.data || []))
            .catch(err => console.error('Fetch chat error:', err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!editingMsg) scrollToBottom();
    }, [posts, sending]);

    // Close context menu on tap elsewhere
    useEffect(() => {
        const handler = () => setContextMenu(null);
        if (contextMenu) document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, [contextMenu]);

    const pinnedMsg = posts.find(p => p.isPinned && !p.isDeleted);

    // Long press handlers
    const handleTouchStart = (e, msg) => {
        longPressTimer.current = setTimeout(() => {
            const rect = e.target.getBoundingClientRect();
            setContextMenu({ x: rect.left + 20, y: rect.top - 10, msg });
        }, 500);
    };
    const handleTouchEnd = () => {
        clearTimeout(longPressTimer.current);
    };

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
        try {
            await api.delete(`/chat/${id}`);
            setContextMenu(null);
            fetchMessages();
        } catch (err) {
            alert(err.response?.data?.error || "O'chirib bo'lmadi");
        }
    };

    const handlePin = async (id) => {
        try {
            await api.post(`/chat/${id}/pin`);
            setContextMenu(null);
            fetchMessages();
        } catch (err) {
            alert(err.response?.data?.error || "Pin qilib bo'lmadi");
        }
    };

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text).catch(() => { });
        setContextMenu(null);
    };

    const startReply = (msg) => {
        setReplyTo(msg);
        setContextMenu(null);
    };

    const startEdit = (msg) => {
        setEditingMsg(msg);
        setNewMessage(msg.text === "O'chirilgan xabar" ? "" : msg.text);
        setContextMenu(null);
        clearImage();
    };

    const cancelEdit = () => {
        setEditingMsg(null);
        setNewMessage('');
    };

    // Members Modal
    const openMembers = async () => {
        try {
            const res = await api.get('/users/all');
            setAllUsers(res.data || []);
            setShowMembers(true);
        } catch (err) {
            console.error(err);
        }
    };

    const handleTransfer = async () => {
        if (!transferTarget || !transferAmount) return;
        setTransferring(true);
        try {
            const res = await api.post('/users/transfer', { toUserId: transferTarget.id, amount: parseInt(transferAmount) });
            alert(res.data.message);
            setTransferTarget(null);
            setTransferAmount('');
            setShowMembers(false);
        } catch (err) {
            alert(err.response?.data?.error || "O'tkazishda xatolik");
        } finally {
            setTransferring(false);
        }
    };

    const getAvatar = (sender) => {
        if (sender?.avatarUrl?.startsWith('data:image')) {
            return <img src={sender.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />;
        }
        if (sender?.role === 'admin') return '⭐';
        return sender?.firstName?.[0]?.toUpperCase() || '👤';
    };

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
            {/* Sticky Header - Click to open Members */}
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

            {/* Pinned Message Banner */}
            {pinnedMsg && (
                <div style={{ padding: '8px 20px', background: 'rgba(255,107,53,0.08)', borderBottom: '1px solid rgba(255,107,53,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
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

                        return (
                            <div
                                key={post.id}
                                onTouchStart={(e) => canModify && handleTouchStart(e, post)}
                                onTouchEnd={handleTouchEnd}
                                onMouseDown={(e) => canModify && handleTouchStart(e, post)}
                                onMouseUp={handleTouchEnd}
                                onContextMenu={(e) => { e.preventDefault(); if (canModify) setContextMenu({ x: e.clientX, y: e.clientY, msg: post }); }}
                                style={{
                                    background: isMe ? "rgba(255,107,53,0.08)" : "var(--card-bg)",
                                    border: `1px solid ${post.isPinned ? 'var(--brand-accent)' : isMe ? 'rgba(255,107,53,0.2)' : 'var(--card-border)'}`,
                                    borderRadius: 16,
                                    padding: 14,
                                    marginBottom: 10,
                                    position: 'relative',
                                    userSelect: 'none'
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: isMe ? "var(--brand-accent)" : "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: isMe ? '#fff' : 'inherit', overflow: 'hidden', flexShrink: 0 }}>
                                            {getAvatar(post.sender)}
                                        </div>
                                        <div>
                                            <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 12 }}>{post.sender?.firstName || 'User'}</div>
                                            <div style={{ color: "var(--text-secondary)", fontSize: 10 }}>
                                                {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                {post.editedAt && " (tahrirlangan)"}
                                                {post.isPinned && " 📌"}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Reply-to preview */}
                                {post.replyTo && (
                                    <div style={{ padding: '6px 10px', marginBottom: 6, borderLeft: '3px solid var(--brand-accent)', background: 'rgba(255,107,53,0.05)', borderRadius: '0 8px 8px 0', fontSize: 11 }}>
                                        <div style={{ color: 'var(--brand-accent)', fontWeight: 700 }}>{post.replyTo.sender?.firstName}</div>
                                        <div style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{post.replyTo.text}</div>
                                    </div>
                                )}

                                {/* Image */}
                                {post.imageUrl && (
                                    <div style={{ marginBottom: 8, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--card-border)' }}>
                                        <img src={post.imageUrl} alt="chat" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }} />
                                    </div>
                                )}

                                <p style={{
                                    color: post.isDeleted ? "var(--text-secondary)" : "var(--text-primary)",
                                    fontStyle: post.isDeleted ? "italic" : "normal",
                                    fontSize: 13, lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap'
                                }}>
                                    {post.text}
                                </p>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Context Menu (Long Press / Right Click) */}
            {contextMenu && (
                <div style={{ position: 'fixed', left: Math.min(contextMenu.x, window.innerWidth - 180), top: Math.min(contextMenu.y, window.innerHeight - 200), background: 'var(--glass-nav)', backdropFilter: 'blur(16px)', border: '1px solid var(--card-border)', borderRadius: 14, overflow: 'hidden', zIndex: 1000, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', minWidth: 160 }}
                    onClick={e => e.stopPropagation()}
                >
                    <button onClick={() => startReply(contextMenu.msg)} style={ctxBtnStyle}>
                        <Reply size={14} /> Javob berish
                    </button>
                    <button onClick={() => handleCopy(contextMenu.msg.text)} style={ctxBtnStyle}>
                        <Copy size={14} /> Nusxalash
                    </button>
                    {user && contextMenu.msg.senderId === user.id && (
                        <button onClick={() => startEdit(contextMenu.msg)} style={ctxBtnStyle}>
                            <Edit2 size={14} /> Tahrirlash
                        </button>
                    )}
                    {user?.role === 'admin' && (
                        <button onClick={() => handlePin(contextMenu.msg.id)} style={{ ...ctxBtnStyle, color: 'var(--brand-accent)' }}>
                            <Pin size={14} /> {contextMenu.msg.isPinned ? 'Olib tashlash' : 'Pin qilish'}
                        </button>
                    )}
                    {(user && (contextMenu.msg.senderId === user.id || user.role === 'admin')) && (
                        <button onClick={() => handleDelete(contextMenu.msg.id)} style={{ ...ctxBtnStyle, color: '#ff4d4f' }}>
                            <Trash2 size={14} /> O'chirish
                        </button>
                    )}
                </div>
            )}

            {/* Members Modal */}
            {showMembers && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => { setShowMembers(false); setTransferTarget(null); }}>
                    <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 430, maxHeight: '70vh', background: 'var(--bg-primary)', borderRadius: '24px 24px 0 0', padding: '20px', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3 style={{ margin: 0, color: 'var(--text-primary)', fontFamily: "'Fraunces', serif" }}>👥 A'zolar ({allUsers.length})</h3>
                            <button onClick={() => setShowMembers(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
                        </div>

                        {/* Transfer UI */}
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

                        {allUsers.filter(u => u.id !== user?.id).map(u => (
                            <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--card-border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: u.role === 'admin' ? 'var(--brand-accent)' : 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontSize: 14, color: u.role === 'admin' ? '#fff' : 'var(--text-secondary)' }}>
                                        {u.avatarUrl?.startsWith('data:image') ? <img src={u.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (u.role === 'admin' ? '⭐' : u.firstName?.[0]?.toUpperCase())}
                                    </div>
                                    <div>
                                        <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 14 }}>{u.firstName} {u.lastName || ''}</div>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{u.role === 'admin' ? 'Admin' : u.role === 'delivery' ? 'Delivery' : 'User'}</div>
                                    </div>
                                </div>
                                <button onClick={() => setTransferTarget(u)} style={{ background: 'var(--brand-accent2)', color: '#fff', border: 'none', borderRadius: 10, padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <DollarSign size={12} /> O'tkazish
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Input Area */}
            <div style={{ padding: '8px 16px', background: 'var(--bg-primary)', borderTop: '1px solid var(--card-border)', zIndex: 20 }}>
                {/* Image Preview */}
                {imagePreview && (
                    <div style={{ position: 'relative', display: 'inline-block', marginBottom: 8 }}>
                        <img src={imagePreview} alt="preview" style={{ height: 60, borderRadius: 8, border: '1px solid var(--brand-accent)' }} />
                        <button onClick={clearImage} style={{ position: 'absolute', top: -5, right: -5, background: '#ff4d4f', color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <X size={12} />
                        </button>
                    </div>
                )}

                {/* Reply indicator */}
                {replyTo && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px 6px', borderLeft: '3px solid var(--brand-accent)', marginBottom: 6, background: 'rgba(255,107,53,0.05)', borderRadius: '0 8px 8px 0' }}>
                        <div style={{ fontSize: 11 }}>
                            <span style={{ fontWeight: 700, color: 'var(--brand-accent)' }}>↩ {replyTo.sender?.firstName}</span>
                            <div style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 250 }}>{replyTo.text}</div>
                        </div>
                        <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={14} /></button>
                    </div>
                )}

                {/* Editing indicator */}
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
