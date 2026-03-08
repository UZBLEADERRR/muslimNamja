import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import api from '../utils/api';
import { Image, MoreVertical, Edit2, Trash2, X } from 'lucide-react';

const CommunityPage = () => {
    const { t } = useTranslation();
    const { user } = useAppStore();
    const [posts, setPosts] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    // Action menu state
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [editingMsg, setEditingMsg] = useState(null);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

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
        const interval = setInterval(fetchMessages, 5000); // Poll every 5s for MVP real-time feel
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!editingMsg) scrollToBottom();
    }, [posts, sending]);

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
                // Edit mode
                await api.put(`/chat/${editingMsg.id}`, { text: newMessage });
                setEditingMsg(null);
            } else if (imageFile) {
                // Image upload
                const formData = new FormData();
                formData.append('image', imageFile);
                if (newMessage.trim()) formData.append('text', newMessage);
                await api.post('/chat/image', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                clearImage();
            } else {
                // Text only
                await api.post('/chat', { text: newMessage });
            }

            setNewMessage('');
            fetchMessages();
        } catch (err) {
            console.error('Failed to send:', err);
            alert(err.response?.data?.error || 'Xato yuz berdi');
        } finally {
            setSending(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Rostdan ham o'chirasizmi?")) return;
        try {
            await api.delete(`/chat/${id}`);
            setActiveMenuId(null);
            fetchMessages();
        } catch (err) {
            alert(err.response?.data?.error || "O'chirib bo'lmadi");
        }
    };

    const startEdit = (msg) => {
        setEditingMsg(msg);
        setNewMessage(msg.text === "O'chirilgan xabar" ? "" : msg.text);
        setActiveMenuId(null);
        clearImage();
    };

    const cancelEdit = () => {
        setEditingMsg(null);
        setNewMessage('');
    };

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
            {/* Sticky Header */}
            <div style={{ padding: '12px 20px', background: 'var(--bg-primary)', borderBottom: '1px solid var(--card-border)', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h2 style={{ color: "var(--text-primary)", fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 900, margin: 0 }}>
                            {t('campus_feed')} 🏫
                        </h2>
                        <p style={{ color: "var(--text-secondary)", fontSize: 11, margin: 0 }}>{posts.length} {t('messages')} · {t('online')}</p>
                    </div>
                </div>
            </div>

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
                        const canModify = (isMe || isAdmin) && !post.isDeleted;

                        return (
                            <div key={post.id} style={{
                                background: isMe ? "rgba(255,107,53,0.08)" : "var(--card-bg)",
                                border: `1px solid ${isMe ? 'rgba(255,107,53,0.2)' : 'var(--card-border)'}`,
                                borderRadius: 16,
                                padding: 14,
                                marginBottom: 10,
                                position: 'relative'
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: isMe ? "var(--brand-accent)" : "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: isMe ? '#fff' : 'inherit' }}>
                                            {post.sender?.role === 'admin' ? '⭐' : (isMe ? 'Men' : '👤')}
                                        </div>
                                        <div>
                                            <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 12 }}>{post.sender?.firstName || 'User'}</div>
                                            <div style={{ color: "var(--text-secondary)", fontSize: 10 }}>
                                                {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                {post.editedAt && " (tahrirlangan)"}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Menu Toggle */}
                                    {canModify && (
                                        <div style={{ position: 'relative' }}>
                                            <button onClick={() => setActiveMenuId(activeMenuId === post.id ? null : post.id)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4 }}>
                                                <MoreVertical size={16} />
                                            </button>

                                            {/* Action Menu Dropdown */}
                                            {activeMenuId === post.id && (
                                                <div style={{ position: 'absolute', right: 0, top: 24, background: 'var(--glass-nav)', backdropFilter: 'blur(10px)', border: '1px solid var(--card-border)', borderRadius: 12, overflow: 'hidden', zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                                    {isMe && (
                                                        <button onClick={() => startEdit(post)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'none', border: 'none', borderBottom: '1px solid var(--card-border)', color: 'var(--text-primary)', width: '100%', cursor: 'pointer', fontSize: 13 }}>
                                                            <Edit2 size={14} /> Tahrirlash
                                                        </button>
                                                    )}
                                                    <button onClick={() => handleDelete(post.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'none', border: 'none', color: '#ff4d4f', width: '100%', cursor: 'pointer', fontSize: 13 }}>
                                                        <Trash2 size={14} /> O'chirish
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Message Content */}
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

            {/* Input Area */}
            <div style={{ padding: '8px 16px', background: 'var(--bg-primary)', borderTop: '1px solid var(--card-border)', zIndex: 20 }}>
                {/* Image Preview Area */}
                {imagePreview && (
                    <div style={{ position: 'relative', display: 'inline-block', marginBottom: 8 }}>
                        <img src={imagePreview} alt="preview" style={{ height: 60, borderRadius: 8, border: '1px solid var(--brand-accent)' }} />
                        <button onClick={clearImage} style={{ position: 'absolute', top: -5, right: -5, background: '#ff4d4f', color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <X size={12} />
                        </button>
                    </div>
                )}

                {/* Editing indicator */}
                {editingMsg && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px 6px', color: 'var(--brand-accent)', fontSize: 11, fontWeight: 600 }}>
                        <span>✏️ Xabarni tahrirlash</span>
                        <button onClick={cancelEdit} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={14} /></button>
                    </div>
                )}

                <form onSubmit={handleSendMessage} style={{ background: "var(--card-bg)", border: `1px solid ${editingMsg ? 'var(--brand-accent)' : 'var(--card-border)'}`, borderRadius: 24, padding: "6px 12px", display: "flex", gap: 10, alignItems: "center" }}>
                    {/* Image Upload Button */}
                    {!editingMsg && (
                        <>
                            <input
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                onChange={handleImageSelect}
                                style={{ display: 'none' }}
                            />
                            <button type="button" onClick={() => fileInputRef.current?.click()} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                                <Image size={20} />
                            </button>
                        </>
                    )}

                    <input
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder={editingMsg ? 'Tahrirlash...' : 'Xabar yozing...'}
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

export default CommunityPage;
