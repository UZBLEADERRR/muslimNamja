import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import api from '../utils/api';

const CommunityPage = () => {
    const { t, lang } = useTranslation();
    const { user, addToCart } = useAppStore();
    const [posts, setPosts] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [likedPosts, setLikedPosts] = useState({});
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        api.get('/chat')
            .then(res => {
                const messages = (res.data || []).map(msg => ({
                    id: msg.id,
                    user: msg.sender?.firstName || 'User',
                    avatar: msg.sender?.role === 'admin' ? '⭐' : '👤',
                    time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    text: msg.text || msg.content,
                    likes: 0,
                    comments: 0,
                    tag: msg.isSystem ? 'promo' : 'chat',
                    pinned: msg.isSystem,
                    offerData: msg.offerData,
                    isMe: user && msg.senderId === user.id,
                }));
                setPosts(messages);
            })
            .catch(err => console.error('Fetch chat error:', err))
            .finally(() => setLoading(false));
    }, [user]);

    useEffect(() => {
        scrollToBottom();
    }, [posts]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;
        if (!user) {
            alert(t('login_prompt'));
            return;
        }

        setSending(true);
        try {
            const res = await api.post('/chat', { text: newMessage });
            const newPost = {
                id: res.data.id || Date.now(),
                user: user?.firstName || 'You',
                avatar: user?.role === 'admin' ? '⭐' : '👤',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                text: newMessage,
                likes: 0,
                comments: 0,
                tag: 'chat',
                isMe: true,
            };
            setPosts(prev => [...prev, newPost]);
            setNewMessage('');
            setTimeout(scrollToBottom, 50);
        } catch (err) {
            console.error('Failed to send:', err);
            alert(err.response?.data?.error || 'Xabar yuborib bo\'lmadi');
        } finally {
            setSending(false);
        }
    };

    const claimOffer = async (post) => {
        if (!post.offerData) return;
        const product = post.offerData.product || {};
        const name = typeof product.name === 'object' ? (product.name[lang] || product.name.en || 'Offer') : (product.name || 'Offer');
        const item = {
            _id: post.offerData.productId || post.id,
            name,
            price: post.offerData.specialPrice || 0,
            emoji: '🎁'
        };
        addToCart(item, 1, []);
        try {
            await api.post(`/chat/${post.id}/claim`);
        } catch (e) { console.error(e); }
        alert(`${t('claim')}: ${name} — ₩${item.price.toLocaleString()}`);
    };

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)' }}>
            {/* Sticky Header */}
            <div style={{ position: 'sticky', top: 0, background: 'var(--bg-primary)', padding: '12px 20px', zIndex: 10, borderBottom: '1px solid var(--card-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h2 style={{ color: "var(--text-primary)", fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 900, marginBottom: 2, margin: 0 }}>
                            {t('campus_feed')} 🏫
                        </h2>
                        <p style={{ color: "var(--text-secondary)", fontSize: 11, margin: 0 }}>{posts.length} {t('messages')} · {t('online')}</p>
                    </div>
                    <div style={{ background: 'rgba(255,107,53,0.1)', color: 'var(--brand-accent)', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>{t('live')}</div>
                </div>
            </div>

            {/* Messages Scroll Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>{t('loading')}</div>
                ) : posts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>No messages yet. Be the first!</p>
                    </div>
                ) : (
                    posts.map(post => (
                        <div key={post.id} style={{
                            background: "var(--card-bg)",
                            border: `1px solid ${post.pinned ? 'var(--brand-accent)' : 'var(--card-border)'}`,
                            borderRadius: 16,
                            padding: 14,
                            marginBottom: 10,
                            boxShadow: "var(--shadow-main)"
                        }}>
                            {post.pinned && <div style={{ color: "var(--brand-accent)", fontSize: 10, fontWeight: 700, marginBottom: 6 }}>{t('pinned')}</div>}

                            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{post.avatar}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 12 }}>{post.user}</div>
                                    <div style={{ color: "var(--text-secondary)", fontSize: 10 }}>{post.time}</div>
                                </div>
                                <span style={{ background: "rgba(255,255,255,0.08)", color: "var(--text-secondary)", fontSize: 9, padding: "2px 6px", borderRadius: 20, fontWeight: 600 }}>#{post.tag}</span>
                            </div>

                            <p style={{ color: "var(--text-primary)", fontSize: 13, lineHeight: 1.5, margin: "0 0 8px" }}>{post.text}</p>

                            {post.offerData && (
                                <div style={{ background: "rgba(255,107,53,0.1)", border: `1px solid rgba(255,107,53,0.3)`, borderRadius: 10, padding: "8px 12px", marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ color: "var(--brand-accent)", fontSize: 10, fontWeight: 700 }}>{t('exclusive_offer')}</div>
                                        <div style={{ color: "var(--text-primary)", fontSize: 12, fontWeight: 600 }}>₩{post.offerData.specialPrice?.toLocaleString()}</div>
                                    </div>
                                    <button onClick={() => claimOffer(post)} style={{ background: "#fff", color: "var(--brand-accent)", padding: "5px 10px", borderRadius: "8px", border: "none", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>{t('claim')}</button>
                                </div>
                            )}

                            <div style={{ display: "flex", gap: 14 }}>
                                <button onClick={() => setLikedPosts(l => ({ ...l, [post.id]: !l[post.id] }))} style={{ background: "none", border: "none", color: likedPosts[post.id] ? "#FF3CAC" : "var(--text-secondary)", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 3, fontWeight: 600 }}>
                                    {likedPosts[post.id] ? "❤️" : "🤍"} {post.likes + (likedPosts[post.id] ? 1 : 0)}
                                </button>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Fixed Bottom Input — sits directly above bottom nav */}
            <div style={{ padding: '8px 16px 8px', background: 'var(--bg-primary)', borderTop: '1px solid var(--card-border)' }}>
                <form onSubmit={handleSendMessage} style={{ background: "var(--card-bg)", border: `1px solid var(--card-border)`, borderRadius: 24, padding: "6px 10px", display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: `var(--card-border)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>😊</div>
                    <input
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder={t('message_placeholder')}
                        style={{ flex: 1, background: "none", border: "none", color: "var(--text-primary)", fontSize: 14, outline: "none", padding: '6px 0' }}
                    />
                    {newMessage.trim() && (
                        <button type="submit" disabled={sending} style={{ width: 32, height: 32, borderRadius: '50%', background: sending ? 'var(--text-secondary)' : "var(--brand-accent)", color: "#fff", border: "none", display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: "pointer", padding: 0, flexShrink: 0 }}>
                            <span style={{ fontSize: '16px' }}>↑</span>
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
};

export default CommunityPage;
