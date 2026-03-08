import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import api from '../utils/api';
import { Search, Plus } from 'lucide-react';

const MenuPage = () => {
    const { t, lang } = useTranslation();
    const { addToCart } = useAppStore();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('All');

    // Hardcoded for now if backend is empty. Real app uses API.
    const fetchProducts = async () => {
        try {
            // Mock data for initial UI build
            const mockProducts = [
                { _id: '1', name: { en: 'Spicy Chicken', ko: '매운 치킨', uz: 'Achchiq Tovuq', ru: 'Острая курица' }, category: 'Food', price: 12000, imageUrl: 'https://images.unsplash.com/photo-1569058242253-1df34b062115?w=500&q=80' },
                { _id: '2', name: { en: 'Beef Kebab', ko: '소고기 케밥', uz: 'Mol Goshtli Kabob', ru: 'Кебаб из говядины' }, category: 'Food', price: 15000, imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&q=80' },
                { _id: '3', name: { en: 'Cola 500ml', ko: '콜라 500ml', uz: 'Kola 500ml', ru: 'Кола 500мл' }, category: 'Drinks', price: 2000, imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80' },
                { _id: '4', name: { en: 'Fresh Salad', ko: '신선한 샐러드', uz: 'Yangi Salat', ru: 'Свежий салат' }, category: 'Salads', price: 8000, imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=80' },
            ];
            setProducts(mockProducts);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const categories = ['All', 'Food', 'Drinks', 'Salads'];

    const filteredProducts = activeCategory === 'All'
        ? products
        : products.filter(p => p.category === activeCategory);

    return (
        <div className="animate-fade-in">
            {/* Search Bar */}
            <div style={{ position: 'relative', marginBottom: '20px' }}>
                <input
                    type="text"
                    placeholder={t('menu')}
                    style={{
                        width: '100%', padding: '12px 16px 12px 40px', borderRadius: '12px',
                        border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)', outline: 'none',
                        boxShadow: 'var(--shadow-sm)'
                    }}
                />
                <Search size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>

            {/* Categories */}
            <div className="hide-scrollbar" style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginBottom: '24px', paddingBottom: '4px' }}>
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        style={{
                            padding: '8px 16px', borderRadius: '20px', whiteSpace: 'nowrap',
                            background: activeCategory === cat ? 'var(--brand-primary)' : 'var(--bg-secondary)',
                            color: activeCategory === cat ? 'white' : 'var(--text-secondary)',
                            border: `1px solid ${activeCategory === cat ? 'var(--brand-primary)' : 'var(--border-color)'}`,
                            boxShadow: activeCategory === cat ? 'var(--shadow-sm)' : 'none',
                            fontWeight: activeCategory === cat ? 600 : 400
                        }}
                    >
                        {cat === 'All' ? t('menu') : t(`category_${cat.toLowerCase()}`)}
                    </button>
                ))}
            </div>

            {/* Product List */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                {filteredProducts.map(product => (
                    <div key={product._id} className="glass" style={{ borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', fontSize: '12px' }}>
                        <div style={{ height: '110px', width: '100%', overflow: 'hidden' }}>
                            <img src={product.imageUrl} alt={product.name[lang]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                            <h3 style={{ fontSize: '13px', marginBottom: '4px', flex: 1, color: 'var(--text-primary)', fontWeight: 500, lineHeight: '1.2' }}>{product.name[lang] || product.name.en}</h3>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                                <span style={{ fontWeight: 700, color: 'var(--brand-primary)', fontSize: '14px' }}>{product.price.toLocaleString()} ₩</span>
                                <button
                                    onClick={() => addToCart(product)}
                                    style={{
                                        background: 'rgba(255, 64, 129, 0.1)', border: 'none', borderRadius: '8px',
                                        width: '28px', height: '28px', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', color: 'var(--brand-primary)'
                                    }}
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MenuPage;
