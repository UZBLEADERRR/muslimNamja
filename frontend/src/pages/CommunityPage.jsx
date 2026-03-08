import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store/useAppStore';

const MOCK_POSTS = [
    { id: 1, user: "Azizbek", avatar: "👨‍🎓", time: "2m ago", text: "Osh was 🔥 today! Delivery in 12 mins. Highly recommend!", likes: 24, comments: 5, tag: "review" },
    {
        id: 2, user: "Admin", avatar: "⭐", time: "15m ago", text: "🎉 TONIGHT 10PM: FREE delivery for first 5 orders! Hurry!", likes: 89, comments: 12, tag: "promo", pinned: true,
        offerData: { productId: { _id: "6", name: { en: "Boba Tea" }, price: 4500 }, specialPrice: 0, emoji: "🧋" }
    },
    { id: 3, user: "Yuki", avatar: "👩‍🎓", time: "1h ago", text: "Where can I buy cheap SIM card near campus?", likes: 3, comments: 8, tag: "question", aiReply: "📱 You can get a cheap SIM at GS25 near Gate 2 — SKT prepaid starts at ₩10,000. Also try the international student office!" },
    { id: 4, user: "Ivan", avatar: "🧑‍💻", time: "3h ago", text: "Student Combo deal is insane value. Manti + boba = ₩10,900. Do it.", likes: 41, comments: 3, tag: "tip" },
];

const CommunityPage = () => {
    const { t, lang } = useTranslation();
    const { user, addToCart } = useAppStore();
    const [posts, setPosts] = useState(MOCK_POSTS);
    const [newMessage, setNewMessage] = useState('');
    const [likedPosts, setLikedPosts] = useState({});
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchChats = async () => {
        try {
            const api = (await import('../utils/api')).default;
            const res = await api.get('/chat');
            setPosts(res.data.length ? res.data : MOCK_POSTS);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (user) {
            fetchChats();
        }
    }, [user]);

    useEffect(() => {
        scrollToBottom();
    }, [posts]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            const api = (await import('../utils/api')).default;
            const res = await api.post('/chat', { content: newMessage });

            const newPost = {
                id: res.data.id || Date.now(),
                user: user?.firstName || "You",
                avatar: "👤",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                text: newMessage,
                likes: 0,
                comments: 0,
                tag: "chat"
            };
            setPosts(prev => [...prev, newPost]);
            setNewMessage('');
            setTimeout(scrollToBottom, 50);
        } catch (err) {
            console.error('Failed to send:', err);
        }
    };

    const claimOffer = async (post) => {
        const item = {
            id: post.offerData?.productId?._id || post.id,
            productId: post.offerData?.productId?._id || post.id,
            name: post.offerData?.productId?.name?.en || "Special Offer",
            price: post.offerData?.specialPrice || 0,
            quantity: 1,
            emoji: post.offerData?.emoji || "🎁"
        };
        addToCart(item, 1, {});
        try {
            const api = (await import('../utils/api')).default;
            await api.post(`/chat/${post.id}/claim`);
        } catch (e) { }
        alert(`Claimed: ${item.name} for ₩${item.price.toLocaleString()}`);
    };

    return (
        <div className="animate-fade-in" style={{ padding: "8px 20px 100px", minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'sticky', top: '70px', background: 'var(--bg-primary)', paddingBottom: '10px', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--card-border)' }}>
                <div>
                    <h2 style={{ color: "var(--text-primary)", fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 900, marginBottom: 4 }}>
                        Campus Feed 🏫
                    </h2>
                    <p style={{ color: "var(--text-secondary)", fontSize: 12, margin: 0 }}>{posts.length} messages · Online</p>
                </div>
                <div style={{ background: 'rgba(255,107,53,0.1)', color: 'var(--brand-accent)', padding: '6px 12px', borderRadius: '14px', fontSize: '12px', fontWeight: 700 }}>Live View</div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '14px' }}>
                {posts.map(post => (
                    <div key={post.id} style={{ background: "var(--card-bg)", border: `1px solid ${post.pinned ? 'var(--brand-accent)' : 'var(--card-border)'}`, borderRadius: 18, padding: 16, boxShadow: "var(--shadow-main)" }}>
                        {post.pinned && <div style={{ color: "var(--brand-accent)", fontSize: 11, fontWeight: 700, marginBottom: 8 }}>📌 PINNED BY ADMIN</div>}

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
                                    <div style={{ color: "var(--brand-accent)", fontSize: 11, fontWeight: 700 }}>Exclusive Offer</div>
                                    <div style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 600 }}>{post.offerData.emoji} {post.offerData.productId.name.en} - ₩{post.offerData.specialPrice}</div>
                                </div>
                                <button onClick={() => claimOffer(post)} style={{ background: "#fff", color: "var(--brand-accent)", padding: "6px 12px", borderRadius: "8px", border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Claim</button>
                            </div>
                        )}

                        {post.aiReply && (
                            <div style={{ background: "rgba(78,205,196,0.1)", border: `1px solid rgba(78,205,196,0.2)`, borderRadius: 12, padding: "10px 14px", marginBottom: 12 }}>
                                <div style={{ color: "var(--brand-accent2)", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>🤖 AI Assistant replied:</div>
                                <div style={{ color: "var(--text-primary)", fontSize: 13 }}>{post.aiReply}</div>
                            </div>
                        )}

                        <div style={{ display: "flex", gap: 16 }}>
                            <button onClick={() => setLikedPosts(l => ({ ...l, [post.id]: !l[post.id] }))} style={{ background: "none", border: "none", color: likedPosts[post.id] ? "#FF3CAC" : "var(--text-secondary)", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
                                {likedPosts[post.id] ? "❤️" : "🤍"} {post.likes + (likedPosts[post.id] ? 1 : 0)}
                            </button>
                            <button style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}>💬 {post.comments}</button>
                            <button style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>🔖</button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Post Input (Telegram Fixed Bottom Style) */}
            <div style={{ position: 'fixed', bottom: '85px', left: 0, right: 0, padding: '10px 20px', background: 'var(--bg-primary)', borderTop: '1px solid var(--card-border)', zIndex: 100 }}>
                <form onSubmit={handleSendMessage} style={{ background: "var(--card-bg)", border: `1px solid var(--card-border)`, borderRadius: 24, padding: "8px 12px", display: "flex", gap: 12, alignItems: "center", boxShadow: '0 -4px 12px rgba(0,0,0,0.05)' }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: `var(--card-border)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>😊</div>
                    <input
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Message..."
                        style={{ flex: 1, background: "none", border: "none", color: "var(--text-primary)", fontSize: 14, outline: "none", padding: '8px 0' }}
                    />
                    {newMessage.trim() && (
                        <button type="submit" style={{ width: 36, height: 36, borderRadius: '50%', background: "var(--brand-accent)", color: "#fff", border: "none", display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: "pointer", padding: 0 }}>
                            <span style={{ fontSize: '18px', transform: 'translateX(1px)' }}>↑</span>
                        </button>
                    )}
                </form>
            </div>

            <div ref={messagesEndRef} style={{ height: 20 }} />
        </div>
    );
};

export default CommunityPage;
