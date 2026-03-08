import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store/useAppStore';

// Temporary Mock Data with emoji/colors for the new UI
const MOCK_FOODS = [
    { _id: "1", name: { en: "Osh (Plov)", ko: "우즈벡 필라프", uz: "Osh", ru: "Плов" }, emoji: "🍚", desc: { en: "Traditional Uzbek pilaf with lamb & carrots", uz: "Qo'y go'shti va sabzi bilan o'zbek oshi" }, price: 8900, cal: 620, time: 15, spicy: 0, halal: true, category: "uzbek", stock: 7, color: "#F5A623" },
    { _id: "2", name: { en: "Tteokbokki", ko: "떡볶이", uz: "Tteokbokki", ru: "Токпокки" }, emoji: "🌶️", desc: { en: "Spicy rice cakes in gochujang sauce", uz: "Gochujang sousidagi achchiq guruch keklari" }, price: 6500, cal: 380, time: 10, spicy: 3, halal: false, category: "korean", stock: 12, color: "#E74C3C" },
    { _id: "3", name: { en: "Samsa", ko: "삼사", uz: "Somsa", ru: "Самса" }, emoji: "🥟", desc: { en: "Crispy pastry with meat & onions", uz: "Go'sht va piyozli qarsildoq pishiriq" }, price: 3500, cal: 290, time: 8, spicy: 1, halal: true, category: "uzbek", stock: 20, color: "#D4A017" },
    { _id: "4", name: { en: "Bibimbap", ko: "비빔밥", uz: "Bibimbap", ru: "Пибимпап" }, emoji: "🥗", desc: { en: "Mixed rice bowl with vegetables & egg", uz: "Sabzavot va tuxumli aralash guruch idishi" }, price: 7900, cal: 520, time: 12, spicy: 2, halal: false, category: "korean", stock: 5, color: "#27AE60" },
    { _id: "5", name: { en: "Burger Combo", ko: "버거 콤보", uz: "Burger Combo", ru: "Бургер Комбо" }, emoji: "🍔", desc: { en: "Double patty + fries + cola", uz: "Ikki qavatli kotlet + fri + kola" }, price: 9500, cal: 890, time: 7, spicy: 0, halal: false, category: "fastfood", stock: 15, color: "#E67E22" },
    { _id: "6", name: { en: "Boba Tea", ko: "버블티", uz: "Boba Choyi", ru: "Бабл Ти" }, emoji: "🧋", desc: { en: "Brown sugar milk tea with tapioca", uz: "Tapioka bilan jigarrang shakar sutli choy" }, price: 4500, cal: 280, time: 5, spicy: 0, halal: true, category: "drinks", stock: 30, color: "#8E44AD" },
    { _id: "7", name: { en: "Manti", ko: "만티", uz: "Manti", ru: "Манты" }, emoji: "🥠", desc: { en: "Steamed dumplings with beef & onion", uz: "Mol go'shti va piyoz bilan bug'da pishirilgan chuchvara" }, price: 7500, cal: 450, time: 18, spicy: 1, halal: true, category: "uzbek", stock: 8, color: "#C0392B" },
    { _id: "8", name: { en: "Hotteok", ko: "호떡", uz: "Hotteok", ru: "Хотток" }, emoji: "🥞", desc: { en: "Sweet pancake filled with brown sugar", uz: "Jigarrang shakar bilan to'ldirilgan shirin quymoq" }, price: 2000, cal: 180, time: 5, spicy: 0, halal: true, category: "desserts", stock: 25, color: "#F39C12" },
];

const CATEGORIES = [
    { id: "all", label: "All", emoji: "✨" },
    { id: "uzbek", label: "Uzbek", emoji: "🇺🇿" },
    { id: "korean", label: "Korean", emoji: "🇰🇷" },
    { id: "fastfood", label: "Fast Food", emoji: "🍔" },
    { id: "drinks", label: "Drinks", emoji: "🧋" },
    { id: "desserts", label: "Desserts", emoji: "🍮" },
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

    const [products, setProducts] = useState(MOCK_FOODS);
    const [category, setCategory] = useState("all");
    const [offerClaimed, setOfferClaimed] = useState(false);
    const [countdown, setCountdown] = useState(600);
    const [addedFoodId, setAddedFoodId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!offerClaimed) {
            const tId = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 0), 1000);
            return () => clearInterval(tId);
        }
    }, [offerClaimed]);

    const fmt = s => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

    const handleAddToCart = (food) => {
        // Map mock food to expected cart format
        const cartItem = {
            id: food._id,
            productId: food._id,
            name: food.name[lang] || food.name.en,
            price: food.price,
            quantity: 1,
            emoji: food.emoji // keep emoji for cart display
        };
        addToCart(cartItem, 1, {});

        setAddedFoodId(food._id);
        setTimeout(() => setAddedFoodId(null), 900);
    };

    const handleClaimOffer = () => {
        setOfferClaimed(true);
        const specialOffer = MOCK_FOODS[0]; // Example: Osh
        handleAddToCart({ ...specialOffer, price: 8900 });
    };

    const filtered = products.filter(f => {
        const matchesCat = category === "all" || f.category === category;
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = !searchQuery ||
            (f.name.en && f.name.en.toLowerCase().includes(searchLower)) ||
            (f.name.uz && f.name.uz.toLowerCase().includes(searchLower)) ||
            (f.name.ko && f.name.ko.toLowerCase().includes(searchLower));
        return matchesCat && matchesSearch;
    });

    return (
        <div className="animate-slide-up">
            {/* Hero */}
            <div style={{ padding: "8px 20px 0" }}>
                <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>{t('greeting') || 'Good afternoon,'}</div>
                <h2 style={{ color: "var(--text-primary)", fontFamily: "'Fraunces', serif", fontSize: 24, margin: "2px 0 16px", fontWeight: 900 }}>
                    {t('sub') || 'What are you craving today?'} 😋
                </h2>

                {/* Search */}
                <div style={{ background: "var(--card-bg)", border: `1px solid var(--card-border)`, borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, marginBottom: 20, boxShadow: "var(--shadow-main)" }}>
                    <span style={{ fontSize: 16 }}>🔍</span>
                    <input
                        placeholder={t('search') || 'Search food...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ background: "none", border: "none", outline: "none", color: "var(--text-primary)", fontSize: 14, flex: 1 }}
                    />
                </div>

                {/* Flash Deal Banner */}
                <div style={{ background: `linear-gradient(135deg, #FF6B35, #FF3CAC)`, borderRadius: 20, padding: "18px 20px", marginBottom: 20, position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", right: -10, top: -10, fontSize: 80, opacity: 0.15 }}>🔥</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", fontWeight: 600, marginBottom: 4 }}>⚡ {t('today') || "Today's Fast Deal"}</div>
                    <div style={{ color: "#fff", fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 900, marginBottom: 4 }}>First 3 Osh Orders — ₩8,900</div>
                    <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, marginBottom: 12 }}>Only <strong style={{ color: "#fff" }}>{3}</strong> spots left · Ends in <strong style={{ color: "#FFE600" }}>{fmt(countdown)}</strong></div>
                    <button onClick={handleClaimOffer} style={{ background: offerClaimed ? "rgba(255,255,255,0.3)" : "#fff", color: offerClaimed ? "#fff" : "#FF6B35", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                        {offerClaimed ? "✓ Claimed!" : "Claim Offer"}
                    </button>
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
                        {c.emoji} {c.label}
                    </button>
                ))}
            </div>

            {/* Food Grid */}
            <div style={{ padding: "0 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {filtered.map(food => (
                    <div key={food._id} style={{ background: 'var(--card-bg)', borderRadius: 20, overflow: "hidden", border: `1px solid var(--card-border)`, boxShadow: 'var(--shadow-main)', transition: "transform 0.2s", transform: addedFoodId === food._id ? "scale(0.96)" : "scale(1)" }}>
                        <div style={{ height: 100, background: `linear-gradient(135deg, ${food.color}33, ${food.color}66)`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                            <span style={{ fontSize: 48 }}>{food.emoji}</span>
                            {food.halal && <span style={{ position: "absolute", top: 8, right: 8, background: "#27AE60", color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 20 }}>Halal</span>}
                            {food.stock <= 8 && <span style={{ position: "absolute", bottom: 6, left: 8, color: "#FF6B35", fontSize: 9, fontWeight: 700 }}>{food.stock} left</span>}
                        </div>
                        <div style={{ padding: "12px 12px 14px" }}>
                            <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{food.name[lang] || food.name.en}</div>
                            <div style={{ color: "var(--text-secondary)", fontSize: 10, marginBottom: 8, lineHeight: 1.4 }}>{(food.desc[lang] || food.desc.en).substring(0, 32)}...</div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                <span style={{ color: "var(--brand-accent)", fontWeight: 800, fontSize: 15, fontFamily: "'Fraunces', serif" }}>₩{food.price.toLocaleString()}</span>
                                {food.spicy > 0 && <SpicyDots level={food.spicy} />}
                            </div>
                            <div style={{ display: "flex", gap: 6, color: "var(--text-secondary)", fontSize: 10, marginBottom: 10 }}>
                                <span>🔥 {food.cal}kcal</span>
                                <span>⏱ {food.time}m</span>
                            </div>
                            <button onClick={() => handleAddToCart(food)} style={{ width: "100%", background: addedFoodId === food._id ? 'var(--brand-accent2)' : `linear-gradient(135deg, var(--brand-accent), #FF3CAC)`, color: "#fff", border: "none", borderRadius: 10, padding: "9px 0", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.3s" }}>
                                {addedFoodId === food._id ? "✓ Added!" : `+ Add`}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MenuPage;
