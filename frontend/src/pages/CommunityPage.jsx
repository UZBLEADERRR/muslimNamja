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

    useEffect(() => {
        scrollToBottom();
    }, [posts]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const newPost = {
            id: Date.now(),
            user: user?.firstName || "Guest",
            avatar: "👤",
            time: "Just now",
            text: newMessage,
            likes: 0,
            comments: 0,
            tag: "chat"
        };
        setPosts(prev => [...prev, newPost]);
        setNewMessage('');
    };

    const claimOffer = (post) => {
        const item = {
            id: post.offerData.productId._id,
            productId: post.offerData.productId._id,
            name: post.offerData.productId.name[lang] || post.offerData.productId.name.en,
            price: post.offerData.specialPrice,
            quantity: 1,
            emoji: post.offerData.emoji
        };
        addToCart(item, 1, {});
        alert(`Claimed: ${item.name} for ₩${item.price.toLocaleString()}`);
    };

    return (
        <div className="animate-slide-up" style={{ padding: "8px 20px 20px" }}>
            <h2 style={{ color: "var(--text-primary)", fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 900, marginBottom: 4 }}>
                Campus Feed 🏫
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 20 }}>Share, ask, discover at Sejong</p>

            {/* Post Input */}
            <form onSubmit={handleSendMessage} style={{ background: "var(--card-bg)", border: `1px solid var(--card-border)`, borderRadius: 16, padding: "12px 14px", marginBottom: 20, display: "flex", gap: 12, alignItems: "center", boxShadow: "var(--shadow-main)" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, var(--brand-accent), #FF3CAC)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>👤</div>
                <input
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Share something with campus... ✍️"
                    style={{ flex: 1, background: "none", border: "none", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
                />
                <button type="submit" style={{ background: "var(--brand-accent)", color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Post</button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
            <div ref={messagesEndRef} style={{ height: 20 }} />
        </div>
    );
};

export default CommunityPage;
