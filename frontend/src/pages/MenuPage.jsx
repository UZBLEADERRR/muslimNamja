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

    useEffect(() => {
        api.get('/products')
            .then(res => setProducts(res.data || []))
            .catch(err => console.error('Fetch products error:', err))
            .finally(() => setLoading(false));
    }, []);

    const handleAddToCart = (food) => {
        const name = typeof food.name === 'object' ? (food.name[lang] || food.name.en || Object.values(food.name)[0]) : food.name;
        const cartItem = {
            _id: food.id || food._id,
            name,
            price: food.price,
            emoji: food.imageUrl || '🍽️'
        };
        addToCart(cartItem, 1, []);
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
                                    <span style={{ fontSize: 48 }}>{emoji}</span>
                                </div>
                                <div style={{ padding: "12px 12px 14px" }}>
                                    <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{getName(food)}</div>
                                    <div style={{ color: "var(--text-secondary)", fontSize: 10, marginBottom: 8, lineHeight: 1.4 }}>{getDesc(food).substring(0, 40)}</div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                        <span style={{ color: "var(--brand-accent)", fontWeight: 800, fontSize: 15, fontFamily: "'Fraunces', serif" }}>₩{food.price?.toLocaleString()}</span>
                                    </div>
                                    <button onClick={() => handleAddToCart(food)} style={{ width: "100%", background: addedFoodId === fid ? 'var(--brand-accent2)' : `linear-gradient(135deg, var(--brand-accent), #FF3CAC)`, color: "#fff", border: "none", borderRadius: 10, padding: "9px 0", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.3s" }}>
                                        {addedFoodId === fid ? t('added') : t('add')}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MenuPage;
