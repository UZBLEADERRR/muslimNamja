import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import api from '../utils/api';

const CATEGORIES = [
    { id: "all", emoji: "✨" },
    { id: "uzbek", emoji: "🇺🇿" },
    { id: "korean", emoji: "🇰🇷" },
    { id: "fastfood", emoji: "🍔" },
    { id: "drinks", emoji: "🧋" },
    { id: "desserts", emoji: "🍮" },
];

function SpicyDots({ level }) {
    return (
        <div style={{ display: "flex", gap: 2 }}>
            {[1, 2, 3].map(i => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: i <= level ? "#e74c3c" : "rgba(255,255,255,0.2)" }} />
            ))}
        </div>
    );
}

const MenuPage = () => {
    const { t, lang } = useTranslation();
    const { addToCart } = useAppStore();

    const [products, setProducts] = useState([]);
    const [category, setCategory] = useState("all");
    const [addedFoodId, setAddedFoodId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [winner, setWinner] = useState(null);
    const [adBanners, setAdBanners] = useState([]);
    const [currentAdIndex, setCurrentAdIndex] = useState(0);
    const [isStoreOpen, setIsStoreOpen] = useState(true);

    useEffect(() => {
        api.get('/products')
            .then(res => setProducts(res.data || []))
            .catch(err => console.error('Fetch products error:', err))
            .finally(() => setLoading(false));

        // Fetch monthly winner & ad banners (public, no auth needed)
        fetch((import.meta.env.VITE_API_URL || '/api') + '/public/monthly-winner').then(r => r.json()).then(d => setWinner(d)).catch(() => { });
        fetch((import.meta.env.VITE_API_URL || '/api') + '/public/store-status').then(r => r.json()).then(d => setIsStoreOpen(d.isOpen)).catch(() => { });
        fetch((import.meta.env.VITE_API_URL || '/api') + '/admin/settings/adBanners').then(r => r.json()).then(d => {
            try {
                const parsed = JSON.parse(d);
                if (Array.isArray(parsed)) setAdBanners(parsed);
            } catch (e) { }
        }).catch(() => { });
    }, []);

    // Auto-slide ads every 4 seconds
    useEffect(() => {
        if (adBanners.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentAdIndex(prev => (prev + 1) % adBanners.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [adBanners]);

    const handleAddToCart = (food) => {
        const name = typeof food.name === 'object' ? (food.name[lang] || food.name.en || Object.values(food.name)[0]) : food.name;
        const cartItem = {
            _id: food.id || food._id,
            name,
            price: food.price,
            emoji: food.imageUrl || '🍽️',
            stock: food.stock,
            minOrderQuantity: food.minOrderQuantity || 1
        };
        const qtyToAdd = food.minOrderQuantity || 1;
        addToCart(cartItem, qtyToAdd, []);
        setAddedFoodId(food.id || food._id);
        setTimeout(() => setAddedFoodId(null), 900);
    };

    const filtered = products.filter(f => {
        const matchesCat = category === "all" || f.category === category;
        const searchLower = searchQuery.toLowerCase();
        const nameObj = typeof f.name === 'object' ? f.name : { en: f.name };
        const matchesSearch = !searchQuery ||
            Object.values(nameObj).some(n => n && n.toLowerCase().includes(searchLower));
        const isActive = f.isActive !== false;
        return matchesCat && matchesSearch && isActive;
    });

    const getName = (food) => {
        if (typeof food.name === 'object') return food.name[lang] || food.name.en || Object.values(food.name)[0];
        return food.name;
    };

    const getDesc = (food) => {
        if (!food.description) return '';
        if (typeof food.description === 'object') return food.description[lang] || food.description.en || '';
        return food.description;
    };

    return (
        <div className="animate-slide-up">
            <div style={{ padding: "8px 20px 0" }}>
                <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>{t('greeting')}</div>
                <h2 style={{ color: "var(--text-primary)", fontFamily: "'Fraunces', serif", fontSize: 24, margin: "2px 0 16px", fontWeight: 900 }}>
                    {t('sub')} 😋
                </h2>

                {/* Monthly Winner */}
                {winner && winner.user && (
                    <div style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,107,53,0.1))', border: '2px solid rgba(255,215,0,0.4)', borderRadius: 18, padding: '14px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #FFD700, #FF6B35)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px solid #FFD700' }}>
                                {winner.user.avatarUrl?.startsWith('data:image')
                                    ? <img src={winner.user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : <span style={{ fontSize: 22 }}>👤</span>}
                            </div>
                            <div style={{ position: 'absolute', top: -6, right: -6, fontSize: 16 }}>👑</div>
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 10, fontWeight: 800, color: '#FFD700', textTransform: 'uppercase', letterSpacing: 1 }}>🏆 Oyning G'olibi</div>
                            <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--text-primary)', fontFamily: "'Fraunces', serif" }}>{winner.user.nickname || winner.user.firstName}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>₩{winner.totalSpent?.toLocaleString()} sarflandi</div>
                        </div>
                        <div style={{ background: '#FFD700', color: '#000', fontWeight: 900, padding: '4px 10px', borderRadius: 8, fontSize: 11 }}>WINNER</div>
                    </div>
                )}

                {/* Ad Banners Carousel */}
                {adBanners.length > 0 && (
                    <div style={{ position: 'relative', width: '100%', borderRadius: 16, overflow: 'hidden', marginBottom: 16, background: 'linear-gradient(135deg, rgba(78,205,196,0.1), rgba(255,107,53,0.08))', border: '1px solid var(--brand-accent2)' }}>
                        <div style={{ display: 'flex', width: `${adBanners.length * 100}%`, transform: `translateX(-${(currentAdIndex * 100) / adBanners.length}%)`, transition: 'transform 0.5s ease-in-out' }}>
                            {adBanners.map(ad => (
                                <div key={ad.id} style={{ width: `${100 / adBanners.length}%`, flexShrink: 0, position: 'relative' }}>
                                    {ad.imageUrl && (
                                        <div style={{ width: '100%', height: 160 }}>
                                            <img src={ad.imageUrl} alt="Ad" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            {/* Gradient overlay for text readability */}
                                            {ad.text && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }} />}
                                        </div>
                                    )}
                                    {ad.text && (
                                        <div style={{ position: ad.imageUrl ? 'absolute' : 'relative', bottom: 0, left: 0, right: 0, padding: '16px', color: ad.imageUrl ? '#fff' : 'var(--text-primary)' }}>
                                            <div style={{ fontSize: 10, fontWeight: 800, color: ad.imageUrl ? '#FFD700' : 'var(--brand-accent)', letterSpacing: 1, marginBottom: 4 }}>📢 E'LON</div>
                                            <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, textShadow: ad.imageUrl ? '0 1px 4px rgba(0,0,0,0.8)' : 'none' }}>{ad.text}</div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Dots */}
                        {adBanners.length > 1 && (
                            <div style={{ position: 'absolute', bottom: 8, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6 }}>
                                {adBanners.map((_, i) => (
                                    <div key={i} style={{ width: i === currentAdIndex ? 16 : 6, height: 6, borderRadius: 3, background: i === currentAdIndex ? 'var(--brand-accent)' : 'rgba(255,255,255,0.5)', transition: 'all 0.3s' }} />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div style={{ background: "var(--card-bg)", border: `1px solid var(--card-border)`, borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, marginBottom: 20, boxShadow: "var(--shadow-main)" }}>
                    <span style={{ fontSize: 16 }}>🔍</span>
                    <input
                        placeholder={t('search')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ background: "none", border: "none", outline: "none", color: "var(--text-primary)", fontSize: 14, flex: 1 }}
                    />
                </div>
            </div>

            {/* Categories */}
            <div className="hide-scrollbar" style={{ paddingLeft: 20, marginBottom: 20, display: "flex", gap: 10, overflowX: "auto" }}>
                {CATEGORIES.map(c => (
                    <button
                        key={c.id}
                        onClick={() => setCategory(c.id)}
                        style={{
                            flexShrink: 0, padding: "8px 16px", borderRadius: 50,
                            border: `1.5px solid ${category === c.id ? 'var(--brand-accent)' : 'var(--card-border)'}`,
                            background: category === c.id ? 'var(--brand-accent)' : 'var(--card-bg)',
                            color: category === c.id ? "#fff" : 'var(--text-primary)',
                            fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s"
                        }}
                    >
                        {c.emoji} {t(c.id)}
                    </button>
                ))}
            </div>

            {/* Food Grid */}
            {loading ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-secondary)" }}>{t('loading')}</div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px" }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🍽️</div>
                    <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>{t('no_products')}</p>
                </div>
            ) : (
                <div style={{ padding: "0 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    {filtered.map(food => {
                        const fid = food.id || food._id;
                        const emoji = food.imageUrl || '🍽️';
                        const color = '#F5A623';
                        return (
                            <div key={fid} style={{ background: 'var(--card-bg)', borderRadius: 20, overflow: "hidden", border: `1px solid var(--card-border)`, boxShadow: 'var(--shadow-main)', transition: "transform 0.2s", transform: addedFoodId === fid ? "scale(0.96)" : "scale(1)" }}>
                                <div style={{ height: 100, background: `linear-gradient(135deg, ${color}33, ${color}66)`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                                    {emoji?.startsWith('data:image')
                                        ? <img src={emoji} alt={getName(food)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        : <span style={{ fontSize: 48 }}>{emoji}</span>
                                    }
                                </div>
                                <div style={{ padding: "12px 12px 14px" }}>
                                    <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{getName(food)}</div>
                                    <div style={{ color: "var(--text-secondary)", fontSize: 10, marginBottom: 6, lineHeight: 1.4, height: 28, overflow: 'hidden' }}>{getDesc(food)}</div>

                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 }}>
                                        <span style={{ color: "var(--brand-accent)", fontWeight: 800, fontSize: 15, fontFamily: "'Fraunces', serif" }}>₩{food.price?.toLocaleString()}</span>
                                        <div style={{ color: "var(--text-secondary)", fontSize: 10, textAlign: 'right' }}>
                                            {food.stock === 0 ? <span style={{ color: '#E74C3C', fontWeight: 800 }}>Tugagan</span> : `Zaxira: ${food.stock === null ? '∞' : food.stock}`}
                                            {food.minOrderQuantity > 1 && <div style={{ color: 'var(--brand-accent2)' }}>Min {food.minOrderQuantity} ta</div>}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleAddToCart(food)}
                                        disabled={food.stock === 0 || !isStoreOpen}
                                        style={{ width: "100%", background: food.stock === 0 || !isStoreOpen ? '#95a5a6' : addedFoodId === fid ? 'var(--brand-accent2)' : `linear-gradient(135deg, var(--brand-accent), #FF3CAC)`, color: "#fff", border: "none", borderRadius: 10, padding: "9px 0", fontSize: 12, fontWeight: 700, cursor: food.stock === 0 || !isStoreOpen ? "not-allowed" : "pointer", transition: "all 0.3s" }}
                                    >
                                        {food.stock === 0 ? 'Sotuvda yoq' : !isStoreOpen ? 'Do\'kon yopiq' : addedFoodId === fid ? t('added') : t('add')}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Store Closed Overlay */}
            {!isStoreOpen && !loading && (
                <div style={{ position: 'fixed', bottom: 85, left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: 400, background: 'rgba(231,76,60,0.95)', color: '#fff', padding: '16px 20px', borderRadius: 16, zIndex: 100, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 8px 32px rgba(231,76,60,0.5)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}>
                    <span style={{ fontSize: 24 }}>🏪</span>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Do'kon hozir yopiq</div>
                        <div style={{ fontSize: 12, opacity: 0.9 }}>Birozdan so'ng xizmat ko'rsatishni davom ettiramiz!</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MenuPage;
