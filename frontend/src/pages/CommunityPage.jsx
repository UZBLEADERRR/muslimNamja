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
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (user) {
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
                    }));
                    setPosts(messages);
                })
                .catch(err => console.error('Fetch chat error:', err))
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        scrollToBottom();
    }, [posts]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            const res = await api.post('/chat', { text: newMessage });
            const newPost = {
                id: res.data.id || Date.now(),
                user: user?.firstName || 'You',
                avatar: '👤',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                text: newMessage,
                likes: 0,
                comments: 0,
                tag: 'chat'
            };
            setPosts(prev => [...prev, newPost]);
            setNewMessage('');
            setTimeout(scrollToBottom, 50);
        } catch (err) {
            console.error('Failed to send:', err);
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
        <div className="animate-fade-in" style={{ padding: "8px 20px 100px", minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'sticky', top: '70px', background: 'var(--bg-primary)', paddingBottom: '10px', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--card-border)' }}>
                <div>
                    <h2 style={{ color: "var(--text-primary)", fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 900, marginBottom: 4 }}>
                        {t('campus_feed')} 🏫
                    </h2>
                    <p style={{ color: "var(--text-secondary)", fontSize: 12, margin: 0 }}>{posts.length} {t('messages')} · {t('online')}</p>
                </div>
                <div style={{ background: 'rgba(255,107,53,0.1)', color: 'var(--brand-accent)', padding: '6px 12px', borderRadius: '14px', fontSize: '12px', fontWeight: 700 }}>{t('live')}</div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '14px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>{t('loading')}</div>
                ) : posts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>No messages yet. Be the first!</p>
                    </div>
                ) : (
                    posts.map(post => (
                        <div key={post.id} style={{ background: "var(--card-bg)", border: `1px solid ${post.pinned ? 'var(--brand-accent)' : 'var(--card-border)'}`, borderRadius: 18, padding: 16, boxShadow: "var(--shadow-main)" }}>
                            {post.pinned && <div style={{ color: "var(--brand-accent)", fontSize: 11, fontWeight: 700, marginBottom: 8 }}>{t('pinned')}</div>}

                            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{post.avatar}</div>
                                <div>
                                    <div style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 13 }}>{post.user}</div>
                                    <div style={{ color: "var(--text-secondary)", fontSize: 11 }}>{post.time}</div>
                                </div>
                                <span style={{ marginLeft: "auto", background: "rgba(255,255,255,0.08)", color: "var(--text-secondary)", fontSize: 10, padding: "3px 8px", borderRadius: 20, fontWeight: 600 }}>#{post.tag}</span>
                            </div>

                            <p style={{ color: "var(--text-primary)", fontSize: 14, lineHeight: 1.5, margin: "0 0 12px" }}>{post.text}</p>

                            {post.offerData && (
                                <div style={{ background: "rgba(255,107,53,0.1)", border: `1px solid rgba(255,107,53,0.3)`, borderRadius: 12, padding: "10px 14px", marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ color: "var(--brand-accent)", fontSize: 11, fontWeight: 700 }}>{t('exclusive_offer')}</div>
                                        <div style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 600 }}>₩{post.offerData.specialPrice?.toLocaleString()}</div>
                                    </div>
                                    <button onClick={() => claimOffer(post)} style={{ background: "#fff", color: "var(--brand-accent)", padding: "6px 12px", borderRadius: "8px", border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>{t('claim')}</button>
                                </div>
                            )}

                            <div style={{ display: "flex", gap: 16 }}>
                                <button onClick={() => setLikedPosts(l => ({ ...l, [post.id]: !l[post.id] }))} style={{ background: "none", border: "none", color: likedPosts[post.id] ? "#FF3CAC" : "var(--text-secondary)", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
                                    {likedPosts[post.id] ? "❤️" : "🤍"} {post.likes + (likedPosts[post.id] ? 1 : 0)}
                                </button>
                                <button style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}>💬 {post.comments}</button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Fixed Bottom Input */}
            <div style={{ position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, padding: '10px 20px', background: 'var(--bg-primary)', borderTop: '1px solid var(--card-border)', zIndex: 150, boxSizing: 'border-box' }}>
                <form onSubmit={handleSendMessage} style={{ background: "var(--card-bg)", border: `1px solid var(--card-border)`, borderRadius: 24, padding: "8px 12px", display: "flex", gap: 12, alignItems: "center", boxShadow: '0 -4px 12px rgba(0,0,0,0.05)' }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: `var(--card-border)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>😊</div>
                    <input
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder={t('message_placeholder')}
                        style={{ flex: 1, background: "none", border: "none", color: "var(--text-primary)", fontSize: 14, outline: "none", padding: '8px 0' }}
                    />
                    {newMessage.trim() && (
                        <button type="submit" style={{ width: 36, height: 36, borderRadius: '50%', background: "var(--brand-accent)", color: "#fff", border: "none", display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: "pointer", padding: 0 }}>
                            <span style={{ fontSize: '18px' }}>↑</span>
                        </button>
                    )}
                </form>
            </div>

            <div ref={messagesEndRef} style={{ height: 20 }} />
        </div>
    );
};

export default CommunityPage;
