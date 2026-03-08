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
        <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
            {/* Header / Search */}
            <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', color: 'var(--text-primary)', marginBottom: '16px' }}>{t('explore_menu')}</h2>
                <div style={{ position: 'relative' }}>
                    <input
                        type="text"
                        placeholder={t('search_placeholder')}
                        style={{
                            width: '100%', padding: '14px 16px 14px 44px', borderRadius: '16px',
                            border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)', outline: 'none',
                            boxShadow: 'var(--shadow-md)', fontSize: '15px'
                        }}
                    />
                    <Search size={20} color="var(--brand-primary)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
            </div>

            {/* Categories */}
            <div className="hide-scrollbar" style={{ display: 'flex', gap: '12px', overflowX: 'auto', marginBottom: '28px', padding: '4px 0' }}>
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        style={{
                            padding: '10px 20px', borderRadius: '14px', whiteSpace: 'nowrap',
                            background: activeCategory === cat ? 'var(--brand-primary)' : 'var(--bg-secondary)',
                            color: activeCategory === cat ? 'white' : 'var(--text-secondary)',
                            border: 'none',
                            boxShadow: activeCategory === cat ? '0 4px 12px rgba(5, 150, 105, 0.3)' : 'var(--shadow-sm)',
                            fontWeight: 600, fontSize: '14px'
                        }}
                    >
                        {cat === 'All' ? t('menu_all') : t(`category_${cat.toLowerCase()}`)}
                    </button>
                ))}
            </div>

            {/* Product List */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {filteredProducts.map(product => (
                    <div
                        key={product._id}
                        onClick={() => handleProductClick(product)}
                        className="glass"
                        style={{
                            borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                            cursor: 'pointer', transition: 'transform 0.2s ease', position: 'relative'
                        }}
                    >
                        <div style={{ height: '120px', width: '100%', overflow: 'hidden' }}>
                            <img src={product.imageUrl} alt={product.name[lang]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                            <h3 style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '8px', fontWeight: 600, lineHeight: '1.3' }}>
                                {product.name[lang] || product.name.en}
                            </h3>
                            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 800, color: 'var(--brand-primary)', fontSize: '15px' }}>{product.price.toLocaleString()} ₩</span>
                                <div style={{ background: 'var(--brand-primary)', color: 'white', borderRadius: '10px', padding: '4px' }}>
                                    <Plus size={16} />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Product Detail Modal */}
            {selectedProduct && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-end'
                }}>
                    <div className="animate-fade-in" style={{
                        width: '100%', background: 'var(--bg-primary)', borderTopLeftRadius: '32px',
                        borderTopRightRadius: '32px', maxHeight: '90vh', overflowY: 'auto',
                        padding: '24px', position: 'relative'
                    }}>
                        <button
                            onClick={() => setSelectedProduct(null)}
                            style={{ position: 'absolute', right: '24px', top: '24px', background: 'var(--bg-tertiary)', border: 'none', borderRadius: '50%', padding: '6px' }}
                        >
                            <X size={20} />
                        </button>

                        <div style={{ height: '240px', width: '100%', borderRadius: '24px', overflow: 'hidden', marginBottom: '20px' }}>
                            <img src={selectedProduct.imageUrl} alt={selectedProduct.name[lang]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>

                        <h2 style={{ fontSize: '24px', color: 'var(--text-primary)', marginBottom: '8px' }}>{selectedProduct.name[lang] || selectedProduct.name.en}</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.5', marginBottom: '24px' }}>
                            {selectedProduct.description?.[lang] || selectedProduct.name[lang]}
                        </p>

                        {/* Modifiers */}
                        {selectedProduct.modifiers?.map(mod => (
                            <div key={mod.id} style={{ marginBottom: '24px' }}>
                                <h4 style={{ fontSize: '16px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                                    {mod.name[lang] || mod.name.en}
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>
                                        {mod.multiple ? '(Many)' : '(Single)'}
                                    </span>
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {mod.options.map(opt => (
                                        <label key={opt.id} style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '12px 16px', borderRadius: '16px', border: '1px solid var(--border-color)',
                                            background: (selectedModifiers[mod.id] || []).includes(opt.id) ? 'rgba(5, 150, 105, 0.05)' : 'transparent',
                                            cursor: 'pointer'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <input
                                                    type={mod.multiple ? 'checkbox' : 'radio'}
                                                    name={mod.id}
                                                    checked={(selectedModifiers[mod.id] || []).includes(opt.id)}
                                                    onChange={() => handleModifierChange(mod.id, opt.id, mod.multiple)}
                                                    style={{ accentColor: 'var(--brand-primary)', width: '18px', height: '18px' }}
                                                />
                                                <span style={{ fontSize: '15px' }}>{opt.name[lang] || opt.name.en}</span>
                                            </div>
                                            {opt.extraPrice > 0 && (
                                                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--brand-primary)' }}>+{opt.extraPrice} ₩</span>
                                            )}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Add to Cart Button */}
                        <div style={{ paddingTop: '10px', paddingBottom: '20px' }}>
                            <button
                                onClick={() => {
                                    addToCart(selectedProduct, 1, selectedModifiers);
                                    setSelectedProduct(null);
                                }}
                                style={{
                                    width: '100%', padding: '16px', borderRadius: '18px',
                                    background: 'var(--brand-primary)', color: 'white',
                                    border: 'none', fontWeight: 700, fontSize: '17px',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    boxShadow: '0 8px 24px rgba(5, 150, 105, 0.3)'
                                }}
                            >
                                <span>{t('add_to_cart')}</span>
                                <span>{calculateTotalPrice().toLocaleString()} ₩</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MenuPage;
