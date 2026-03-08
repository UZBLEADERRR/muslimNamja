import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import { Search, Plus, X, Info, ChevronRight } from 'lucide-react';

const MenuPage = () => {
    const { t, lang } = useTranslation();
    const { addToCart } = useAppStore();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('All');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedModifiers, setSelectedModifiers] = useState({});

    // Hardcoded for now with enhanced features
    const fetchProducts = async () => {
        try {
            const mockProducts = [
                {
                    _id: '1',
                    name: { en: 'Spicy Chicken Combo', ko: '매운 치킨 세트', uz: 'Achchiq Tovuq Set', ru: 'Острый комбо-набор' },
                    description: { en: 'Spicy fried chicken served with your choice of drink and side.', ko: '음료와 사이드 메뉴를 곁들인 매운 프라이드 치킨.', uz: 'Achchiq tovuq, ichimlik va yonma-ovqat bilan.', ru: 'Острая курица с напитком и гарниром на выбор.' },
                    category: 'Food',
                    price: 12000,
                    imageUrl: 'https://images.unsplash.com/photo-1569058242253-1df34b062115?w=500&q=80',
                    isSet: true,
                    modifiers: [
                        {
                            id: 'drink', name: { en: 'Select Drink', uz: 'Ichimlik tanlang' }, options: [
                                { id: 'cola', name: { en: 'Cola', uz: 'Kola' }, extraPrice: 0 },
                                { id: 'sprite', name: { en: 'Sprite', uz: 'Sprite' }, extraPrice: 0 },
                                { id: 'fanta', name: { en: 'Fanta', uz: 'Fanta' }, extraPrice: 0 }
                            ]
                        },
                        {
                            id: 'extra', name: { en: 'Add-ons', uz: 'Qo\'shimchalar' }, options: [
                                { id: 'cheese', name: { en: 'Extra Cheese', uz: 'Qo\'shimcha pishloq' }, extraPrice: 2000 },
                                { id: 'sauce', name: { en: 'Extra Sauce', uz: 'Qo\'shimcha sous' }, extraPrice: 1000 }
                            ], multiple: true
                        }
                    ]
                },
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

    const handleProductClick = (product) => {
        setSelectedProduct(product);
        setSelectedModifiers({});
    };

    const handleModifierChange = (modId, optionId, multiple) => {
        setSelectedModifiers(prev => {
            const current = prev[modId] || [];
            if (multiple) {
                if (current.includes(optionId)) {
                    return { ...prev, [modId]: current.filter(id => id !== optionId) };
                }
                return { ...prev, [modId]: [...current, optionId] };
            }
            return { ...prev, [modId]: [optionId] };
        });
    };

    const calculateTotalPrice = () => {
        if (!selectedProduct) return 0;
        let total = selectedProduct.price;
        if (selectedProduct.modifiers) {
            selectedProduct.modifiers.forEach(mod => {
                const selectedIds = selectedModifiers[mod.id] || [];
                mod.options.forEach(opt => {
                    if (selectedIds.includes(opt.id)) {
                        total += opt.extraPrice;
                    }
                });
            });
        }
        return total;
    };

    const categories = ['All', 'Food', 'Drinks', 'Salads'];
    const filteredProducts = activeCategory === 'All'
        ? products
        : products.filter(p => p.category === activeCategory);

    return (
        <div className="animate-slide-up" style={{ paddingBottom: '40px' }}>
            {/* Stunning Header Section */}
            <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '28px', color: 'var(--text-primary)', maxWidth: '200px', lineHeight: '1.1' }}>
                        {t('explore_menu')}
                    </h2>
                    <div className="glass" style={{ padding: '10px', borderRadius: '14px', color: 'var(--brand-gold)' }}>
                        <Info size={20} />
                    </div>
                </div>

                <div style={{ position: 'relative' }}>
                    <input
                        type="text"
                        placeholder={t('search_placeholder')}
                        style={{
                            width: '100%', padding: '16px 16px 16px 48px', borderRadius: '20px',
                            border: '1px solid var(--glass-border)', background: 'var(--glass-bg)',
                            color: 'var(--text-primary)', outline: 'none',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: '15px'
                        }}
                    />
                    <Search size={22} color="var(--brand-primary)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
            </div>

            {/* Premium Category Scroll */}
            <div className="hide-scrollbar" style={{ display: 'flex', gap: '14px', overflowX: 'auto', marginBottom: '32px', padding: '4px 0' }}>
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        style={{
                            padding: '12px 24px', borderRadius: '18px', whiteSpace: 'nowrap',
                            background: activeCategory === cat ? 'linear-gradient(135deg, var(--brand-primary), #065f46)' : 'var(--glass-bg)',
                            color: activeCategory === cat ? 'white' : 'var(--text-secondary)',
                            border: activeCategory === cat ? 'none' : '1px solid var(--glass-border)',
                            boxShadow: activeCategory === cat ? '0 8px 20px rgba(16, 185, 129, 0.3)' : 'none',
                            fontWeight: 700, fontSize: '14px', transition: 'all 0.3s ease'
                        }}
                    >
                        {cat === 'All' ? t('menu_all') : t(`category_${cat.toLowerCase()}`)}
                    </button>
                ))}
            </div>

            {/* Stunning Product Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {filteredProducts.map(product => (
                    <div
                        key={product._id}
                        onClick={() => handleProductClick(product)}
                        className="glass card-premium"
                        style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.08)'
                        }}
                    >
                        <div style={{ height: '140px', width: '100%', overflow: 'hidden', position: 'relative' }}>
                            <img src={product.imageUrl} alt={product.name[lang]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{
                                position: 'absolute', top: '10px', right: '10px',
                                background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
                                borderRadius: '10px', padding: '4px 8px', fontSize: '10px', fontWeight: 700, color: 'white'
                            }}>
                                ⭐ 4.9
                            </div>
                        </div>
                        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', fontWeight: 700, lineHeight: '1.2' }}>
                                {product.name[lang] || product.name.en}
                            </h3>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                <span style={{ fontWeight: 800, color: 'var(--brand-gold)', fontSize: '16px' }}>{product.price.toLocaleString()} ₩</span>
                                <div style={{
                                    background: 'var(--brand-primary)', color: 'white',
                                    width: '32px', height: '32px', borderRadius: '12px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)'
                                }}>
                                    <Plus size={18} />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Luxury Product Detail Modal */}
            {selectedProduct && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', alignItems: 'flex-end',
                    backdropFilter: 'blur(10px)'
                }}>
                    <div className="animate-slide-up" style={{
                        width: '100%', background: 'var(--bg-primary)', borderTopLeftRadius: '40px',
                        borderTopRightRadius: '40px', maxHeight: '92vh', overflowY: 'auto',
                        padding: '32px 24px', position: 'relative', borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', margin: '-16px auto 24px' }}></div>

                        <button
                            onClick={() => setSelectedProduct(null)}
                            className="glass"
                            style={{ position: 'absolute', right: '24px', top: '24px', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}
                        >
                            <X size={20} />
                        </button>

                        <div style={{ height: '280px', width: '100%', borderRadius: '32px', overflow: 'hidden', marginBottom: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
                            <img src={selectedProduct.imageUrl} alt={selectedProduct.name[lang]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <h2 style={{ fontSize: '28px', color: 'var(--text-primary)', fontWeight: 800 }}>{selectedProduct.name[lang] || selectedProduct.name.en}</h2>
                                <span style={{ fontSize: '22px', fontWeight: 900, color: 'var(--brand-gold)' }}>{selectedProduct.price.toLocaleString()} ₩</span>
                            </div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: '1.6' }}>
                                {selectedProduct.description?.[lang] || selectedProduct.name[lang]}
                            </p>
                        </div>

                        {/* Modifiers */}
                        {selectedProduct.modifiers?.map(mod => (
                            <div key={mod.id} style={{ marginBottom: '32px' }}>
                                <h4 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {mod.name[lang] || mod.name.en}
                                    <span style={{ fontSize: '11px', color: 'var(--brand-primary)', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '8px', fontWeight: 700, textTransform: 'uppercase' }}>
                                        {mod.multiple ? 'Barchasini tanlang' : 'Bittasini tanlang'}
                                    </span>
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {mod.options.map(opt => (
                                        <label key={opt.id} style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '16px 20px', borderRadius: '20px', border: '1px solid var(--glass-border)',
                                            background: (selectedModifiers[mod.id] || []).includes(opt.id) ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.02)',
                                            cursor: 'pointer', transition: 'all 0.2s ease'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                <input
                                                    type={mod.multiple ? 'checkbox' : 'radio'}
                                                    name={mod.id}
                                                    checked={(selectedModifiers[mod.id] || []).includes(opt.id)}
                                                    onChange={() => handleModifierChange(mod.id, opt.id, mod.multiple)}
                                                    style={{ accentColor: 'var(--brand-primary)', width: '20px', height: '20px' }}
                                                />
                                                <span style={{ fontSize: '16px', fontWeight: 600 }}>{opt.name[lang] || opt.name.en}</span>
                                            </div>
                                            {opt.extraPrice > 0 && (
                                                <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--brand-gold)' }}>+{opt.extraPrice.toLocaleString()} ₩</span>
                                            )}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Luxury Add to Cart Button */}
                        <div style={{ marginTop: '10px' }}>
                            <button
                                onClick={() => {
                                    addToCart(selectedProduct, 1, selectedModifiers);
                                    setSelectedProduct(null);
                                }}
                                className="btn-gold"
                                style={{
                                    width: '100%', padding: '20px', borderRadius: '24px',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    fontSize: '18px', boxShadow: '0 12px 30px rgba(217, 119, 6, 0.3)'
                                }}
                            >
                                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <ShoppingCart size={22} /> {t('add_to_cart')}
                                </span>
                                <span style={{ fontWeight: 900 }}>{calculateTotalPrice().toLocaleString()} ₩</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MenuPage;
