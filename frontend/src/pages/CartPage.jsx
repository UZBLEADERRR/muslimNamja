import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import api from '../utils/api';

const CartPage = () => {
    const { t } = useTranslation();
    const { user, cart, removeFromCart, clearCart, updateQuantity } = useAppStore();
    const navigate = useNavigate();

    const [isProcessing, setIsProcessing] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);

    // Delivery Type States
    const [deliveryType, setDeliveryType] = useState('home');
    const [meetupLocation, setMeetupLocation] = useState('');
    const [availableMeetupSpots, setAvailableMeetupSpots] = useState([]);

    const distance = user?.distanceFromRestaurant || 0;
    const isTooFar = distance > 2;

    useEffect(() => {
        // If too far, auto-select pickup
        if (isTooFar && deliveryType === 'home') {
            setDeliveryType('pickup');
        }
    }, [isTooFar, deliveryType]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/users/settings/meetupSpots');
                if (res.data?.value) {
                    setAvailableMeetupSpots(JSON.parse(res.data.value));
                }
            } catch (err) { console.error("Failed to load meetup spots", err); }
        };
        fetchSettings();
    }, []);

    const subtotal = cart.reduce((sum, item) => sum + (item.product?.price || item.priceAtTime || 0) * (item.quantity || 1), 0);

    let deliveryFee = 0;
    if (deliveryType === 'home') {
        deliveryFee = 1000; // Fixed fee for home delivery
    } else if (deliveryType === 'pickup') {
        deliveryFee = -1000; // Discount for pickup
    } else if (deliveryType === 'meetup') {
        deliveryFee = 0; // Free for meetup
    }

    const total = subtotal + deliveryFee;
    const walletBalance = user?.walletBalance || 0;
    const canAfford = walletBalance >= total;

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        if (deliveryType === 'meetup' && !meetupLocation) {
            return alert(t('select_meetup'));
        }
        if (!canAfford) {
            return alert(t('insufficient_balance'));
        }
        if (!user?.address || user.address.trim() === '') {
            return alert("Buyurtma berish uchun doimiy manzilingizni kiriting! Profil sahifasida 'Tahrirlash' tugmasini bosing va manzilni to'ldiring.");
        }

        setIsProcessing(true);
        try {
            const items = cart.map(item => ({
                productId: item.product?._id || item.product?.id,
                productName: item.product?.name || 'Item',
                quantity: item.quantity || 1,
                price: item.product?.price || item.priceAtTime || 0,
                extras: item.extras || []
            }));

            await api.post('/orders', {
                items,
                paymentMethod: 'wallet',
                totalAmount: total,
                deliveryFee,
                distance,
                deliveryType,
                meetupLocation: deliveryType === 'meetup' ? meetupLocation : null,
                giftInfo: null
            });

            clearCart();
            setOrderPlaced(true);
        } catch (err) {
            console.error('Checkout error:', err);
            alert(err.response?.data?.error || 'Failed to place order');
        } finally {
            setIsProcessing(false);
        }
    };

    if (orderPlaced) {
        return (
            <div className="animate-slide-up" style={{ padding: 20, textAlign: 'center', paddingTop: 80 }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
                <h2 style={{ color: "var(--text-primary)", fontFamily: "'Fraunces', serif", marginBottom: 8 }}>{t('order_success')}</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 24 }}>Buyurtmangiz oshxonaga yuborildi!</p>
                <button onClick={() => { setOrderPlaced(false); navigate('/'); }} style={{ background: "var(--brand-accent)", color: "#fff", border: "none", borderRadius: 14, padding: "14px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>{t('go_to_menu')}</button>
            </div>
        );
    }

    if (cart.length === 0) {
        return (
            <div className="animate-slide-up" style={{ padding: 20, textAlign: 'center', paddingTop: 60 }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🛒</div>
                <h3 style={{ color: "var(--text-primary)", marginBottom: 8 }}>{t('empty_cart')}</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 24 }}>{t('add_items')}</p>
                <button onClick={() => navigate('/')} style={{ background: "var(--brand-accent)", color: "#fff", border: "none", borderRadius: 14, padding: "14px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>{t('go_to_menu')}</button>
            </div>
        );
    }

    return (
        <div className="animate-slide-up" style={{ padding: 20, paddingBottom: 40 }}>
            <h2 style={{ color: "var(--text-primary)", fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 900, marginBottom: 4 }}>
                {t('your_cart')} 🛍️
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 20 }}>{cart.length} {t('items')}</p>

            {/* Cart Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                {cart.map((item, i) => {
                    const product = item.product || {};
                    return (
                        <div key={i} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: 'var(--shadow-main)' }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,107,53,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0, overflow: 'hidden' }}>
                                {product.emoji?.startsWith('data:image')
                                    ? <img src={product.emoji} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : (product.emoji || '🍽️')
                                }
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 14 }}>{product.name || 'Item'}</div>
                                {item.extras?.length > 0 && (
                                    <div style={{ color: 'var(--brand-accent)', fontSize: 10, marginBottom: 2 }}>
                                        +{item.extras.map(e => e.name).join(', ')}
                                    </div>
                                )}
                                <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 4 }}>₩{((product.price || item.priceAtTime || 0) * (item.quantity || 1)).toLocaleString()}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <button onClick={() => updateQuantity(i, -1)} style={{ width: 26, height: 26, borderRadius: 8, border: 'none', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                                    <span style={{ fontWeight: 800, color: 'var(--text-primary)', width: 20, textAlign: 'center', fontSize: 14 }}>{item.quantity}</span>
                                    <button onClick={() => updateQuantity(i, 1)} style={{ width: 26, height: 26, borderRadius: 8, border: 'none', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                                </div>
                            </div>
                            <button onClick={() => removeFromCart(i)} style={{ background: 'none', border: 'none', color: '#E74C3C', fontSize: 18, cursor: 'pointer', padding: '4px 8px' }}>✕</button>
                        </div>
                    );
                })}
            </div>

            {/* 2km Warning */}
            {isTooFar && (
                <div style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: 14, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 24 }}>⚠️</span>
                    <div>
                        <div style={{ color: '#E74C3C', fontWeight: 700, fontSize: 13 }}>{t('too_far')}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 11 }}>Masofa: {distance.toFixed(1)} km</div>
                    </div>
                </div>
            )}

            {/* Delivery Method Selection */}
            <div style={{ marginBottom: 20 }}>
                <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 14, marginBottom: 10 }}>{t('delivery_method')}</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: deliveryType === 'meetup' ? 12 : 0 }}>
                    {[
                        { id: 'pickup', icon: '🚶', label: t('pickup'), extra: t('pickup_discount'), disabled: false },
                        { id: 'meetup', icon: '📍', label: t('meetup'), extra: t('meetup_fee'), disabled: isTooFar },
                        { id: 'home', icon: '🛵', label: t('home_delivery'), extra: distance > 1 ? t('paid_zone') : t('free_zone'), disabled: isTooFar }
                    ].map(m => (
                        <button key={m.id} onClick={() => !m.disabled && setDeliveryType(m.id)} style={{
                            flex: 1, padding: '10px 4px', borderRadius: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                            background: deliveryType === m.id ? 'var(--brand-accent)' : 'var(--card-bg)',
                            color: deliveryType === m.id ? '#fff' : 'var(--text-secondary)',
                            border: `1px solid ${deliveryType === m.id ? 'var(--brand-accent)' : 'var(--card-border)'}`,
                            cursor: m.disabled ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                            opacity: m.disabled ? 0.4 : 1
                        }}>
                            <span style={{ fontSize: 18 }}>{m.icon}</span>
                            <span style={{ fontWeight: 700, fontSize: 11 }}>{m.label}</span>
                            <span style={{ fontSize: 9, opacity: 0.8 }}>{m.extra}</span>
                        </button>
                    ))}
                </div>

                {deliveryType === 'meetup' && (
                    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 16, padding: '14px', marginTop: 8 }}>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>{t('select_meetup')}:</div>
                        {availableMeetupSpots.length > 0 ? (
                            <select value={meetupLocation} onChange={e => setMeetupLocation(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--card-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}>
                                <option value="" disabled>-- {t('select_meetup')} --</option>
                                {availableMeetupSpots.map(spot => (<option key={spot} value={spot}>{spot}</option>))}
                            </select>
                        ) : (
                            <div style={{ fontSize: 12, color: '#E74C3C' }}>Joylar hozircha kiritilmagan. Admin bilan bog'laning.</div>
                        )}
                    </div>
                )}
            </div>

            {/* Totals */}
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 20, padding: 20, marginBottom: 20, boxShadow: 'var(--shadow-main)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{t('subtotal')}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>₩{subtotal.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{deliveryType === 'pickup' ? t('pickup_discount') : t('delivery_fee')}</span>
                    <span style={{ color: deliveryFee <= 0 ? '#27AE60' : 'var(--text-primary)', fontWeight: 600 }}>
                        {deliveryFee === 0 ? t('free_delivery') : (deliveryFee < 0 ? `-₩${Math.abs(deliveryFee).toLocaleString()}` : `₩${deliveryFee.toLocaleString()}`)}
                    </span>
                </div>
                <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 16 }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{t('grand_total')}</span>
                    <span style={{ color: 'var(--brand-accent)', fontWeight: 900, fontFamily: "'Fraunces', serif", fontSize: 20 }}>₩{Math.max(0, total).toLocaleString()}</span>
                </div>
            </div>

            {/* Wallet Balance */}
            <div style={{ background: canAfford ? 'rgba(39,174,96,0.08)' : 'rgba(231,76,60,0.08)', border: `1px solid ${canAfford ? 'rgba(39,174,96,0.3)' : 'rgba(231,76,60,0.3)'}`, borderRadius: 16, padding: '14px 18px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>💳 {t('wallet_balance')}</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: canAfford ? '#27AE60' : '#E74C3C', fontFamily: "'Fraunces', serif" }}>₩{walletBalance.toLocaleString()}</div>
                </div>
                {!canAfford && (
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#E74C3C', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>{t('insufficient_balance')}</div>
                        <button onClick={() => navigate('/profile')} style={{ background: '#E74C3C', color: '#fff', border: 'none', borderRadius: 10, padding: '6px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                            {t('top_up')}
                        </button>
                    </div>
                )}
            </div>

            {/* Address Missing Warning */}
            {(!user?.address || user.address.trim() === '') && (
                <div onClick={() => navigate('/profile')} style={{ background: 'rgba(243,156,18,0.1)', border: '1px solid rgba(243,156,18,0.3)', borderRadius: 16, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                    <span style={{ fontSize: 24 }}>🏠</span>
                    <div style={{ flex: 1 }}>
                        <div style={{ color: '#F39C12', fontWeight: 700, fontSize: 13 }}>Doimiy manzil kiritilmagan!</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 11 }}>Buyurtma berish uchun profildan manzilni to'ldiring →</div>
                    </div>
                </div>
            )}

            {/* Checkout Button */}
            <button
                onClick={handleCheckout}
                disabled={isProcessing || !canAfford}
                style={{
                    width: '100%', padding: '16px', borderRadius: 16, border: 'none',
                    background: !canAfford ? '#95a5a6' : `linear-gradient(135deg, var(--brand-accent), #FF3CAC)`,
                    color: '#fff', fontWeight: 800, fontSize: 16, cursor: !canAfford ? 'not-allowed' : 'pointer',
                    boxShadow: canAfford ? '0 4px 16px rgba(255,107,53,0.4)' : 'none', transition: 'all 0.3s',
                    opacity: isProcessing ? 0.7 : 1
                }}
            >
                {isProcessing ? t('processing') : !canAfford ? t('wallet_required') : `${t('checkout')} · ₩${Math.max(0, total).toLocaleString()}`}
            </button>
        </div>
    );
};

export default CartPage;
