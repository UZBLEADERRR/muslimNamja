import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import api from '../utils/api';

const CartPage = () => {
    const { t } = useTranslation();
    const { user, cart, removeFromCart, clearCart, updateQuantity } = useAppStore();
    const navigate = useNavigate();

    const [screenshot, setScreenshot] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('wallet');
    const [orderPlaced, setOrderPlaced] = useState(false);

    // New Delivery Type States
    const [deliveryType, setDeliveryType] = useState('home'); // 'pickup', 'meetup', 'home'
    const [meetupLocation, setMeetupLocation] = useState('');
    const [availableMeetupSpots, setAvailableMeetupSpots] = useState([]);

    useEffect(() => {
        // Fetch Admin defined meetup spots
        const fetchSettings = async () => {
            try {
                const res = await api.get('/users/settings/meetupSpots');
                if (res.data?.value) {
                    const spots = JSON.parse(res.data.value);
                    setAvailableMeetupSpots(spots);
                }
            } catch (err) {
                console.error("Failed to load meetup spots", err);
            }
        };
        fetchSettings();
    }, []);

    const subtotal = cart.reduce((sum, item) => sum + (item.product?.price || item.priceAtTime || 0) * (item.quantity || 1), 0);
    const distance = user?.distanceFromRestaurant || 0;

    // Dynamic Delivery Fee Computation
    let deliveryFee = 0;
    if (deliveryType === 'home') {
        deliveryFee = distance > 1 ? 3000 : 0; // First 1km free, else 3000
    } else if (deliveryType === 'pickup') {
        deliveryFee = -1000; // 1000 won discount
    } else if (deliveryType === 'meetup') {
        deliveryFee = 1500; // Flat fee for meetup
    }

    const total = subtotal + deliveryFee;

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        if (deliveryType === 'meetup' && !meetupLocation) {
            return alert("Iltimos uchrashuv joyini tanlang!");
        }

        setIsProcessing(true);
        try {
            const items = cart.map(item => ({
                productId: item.product?._id || item.product?.id,
                productName: item.product?.name || 'Item',
                quantity: item.quantity || 1,
                price: item.product?.price || item.priceAtTime || 0
            }));

            await api.post('/orders', {
                items,
                paymentMethod,
                totalAmount: total,
                deliveryFee,
                distance,
                deliveryType,
                meetupLocation: deliveryType === 'meetup' ? meetupLocation : null,
                giftInfo: null // Default null for now
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

    const handleScreenshotUpload = async () => {
        if (!screenshot) return;
        setIsProcessing(true);
        try {
            const formData = new FormData();
            formData.append('screenshot', screenshot);
            const res = await api.post('/ai/verify-payment', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert(res.data.message || 'AI verification complete');
        } catch (err) {
            console.error('AI verify error:', err);
            alert('Verification failed');
        } finally {
            setIsProcessing(false);
        }
    };

    if (orderPlaced) {
        return (
            <div className="animate-slide-up" style={{ padding: 20, textAlign: 'center', paddingTop: 80 }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
                <h2 style={{ color: "var(--text-primary)", fontFamily: "'Fraunces', serif", marginBottom: 8 }}>{t('order_success')}</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 24 }}>Your order has been sent to the restaurant!</p>
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

            {/* Delivery Method Selection */}
            <div style={{ marginBottom: 20 }}>
                <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Yetkazib berish usuli</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: deliveryType === 'meetup' ? 12 : 0 }}>
                    {[
                        { id: 'pickup', icon: '🚶‍♀️', label: 'Olib ketish', extra: '-₩1000' },
                        { id: 'meetup', icon: '📍', label: 'Meet up', extra: '' },
                        { id: 'home', icon: '🛵', label: 'Uyga', extra: distance > 1 ? '+₩3000' : 'Tekin' }
                    ].map(m => (
                        <button key={m.id} onClick={() => setDeliveryType(m.id)} style={{
                            flex: 1, padding: '10px 4px', borderRadius: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                            background: deliveryType === m.id ? 'var(--brand-accent)' : 'var(--card-bg)',
                            color: deliveryType === m.id ? '#fff' : 'var(--text-secondary)',
                            border: `1px solid ${deliveryType === m.id ? 'var(--brand-accent)' : 'var(--card-border)'}`,
                            cursor: 'pointer', transition: 'all 0.2s'
                        }}>
                            <span style={{ fontSize: 18 }}>{m.icon}</span>
                            <span style={{ fontWeight: 700, fontSize: 11 }}>{m.label}</span>
                            <span style={{ fontSize: 9, opacity: 0.8 }}>{m.extra}</span>
                        </button>
                    ))}
                </div>

                {deliveryType === 'meetup' && (
                    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 16, padding: '14px', marginTop: 8 }}>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>Uchrashuv joyini tanlang:</div>
                        {availableMeetupSpots.length > 0 ? (
                            <select
                                value={meetupLocation}
                                onChange={e => setMeetupLocation(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--card-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                            >
                                <option value="" disabled>-- Joy tanlang --</option>
                                {availableMeetupSpots.map(spot => (
                                    <option key={spot} value={spot}>{spot}</option>
                                ))}
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
                    <span style={{ color: 'var(--text-secondary)' }}>{deliveryType === 'pickup' ? 'Chegirma (Pick up)' : t('delivery_fee')}</span>
                    <span style={{ color: deliveryFee <= 0 ? '#27AE60' : 'var(--text-primary)', fontWeight: 600 }}>
                        {deliveryFee === 0 ? t('free_delivery') : (deliveryFee < 0 ? `-₩${Math.abs(deliveryFee).toLocaleString()}` : `₩${deliveryFee.toLocaleString()}`)}
                    </span>
                </div>
                <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 16 }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{t('grand_total')}</span>
                    <span style={{ color: 'var(--brand-accent)', fontWeight: 900, fontFamily: "'Fraunces', serif", fontSize: 20 }}>₩{Math.max(0, total).toLocaleString()}</span>
                </div>
            </div>

            {/* Payment Method */}
            <div style={{ marginBottom: 20 }}>
                <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 14, marginBottom: 10 }}>{t('payment_method')}</div>
                <div style={{ display: 'flex', gap: 10 }}>
                    {['wallet', 'cash'].map(m => (
                        <button key={m} onClick={() => setPaymentMethod(m)} style={{
                            flex: 1, padding: '12px', borderRadius: 14,
                            background: paymentMethod === m ? 'var(--brand-accent)' : 'var(--card-bg)',
                            color: paymentMethod === m ? '#fff' : 'var(--text-secondary)',
                            border: `1px solid ${paymentMethod === m ? 'var(--brand-accent)' : 'var(--card-border)'}`,
                            fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s'
                        }}>
                            {m === 'wallet' ? `💳 ${t('wallet')}` : `💵 ${t('cash')}`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Screenshot Upload */}
            {paymentMethod === 'wallet' && (
                <div style={{ background: 'var(--card-bg)', border: '1px dashed var(--card-border)', borderRadius: 16, padding: 20, marginBottom: 20, textAlign: 'center' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📸</div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{t('upload_screenshot')}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 12 }}>{t('ai_verify')}</div>
                    <input type="file" accept="image/*" onChange={e => setScreenshot(e.target.files?.[0])} style={{ marginBottom: 10 }} />
                    {screenshot && (
                        <button onClick={handleScreenshotUpload} disabled={isProcessing} style={{ background: 'var(--brand-accent2)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                            {isProcessing ? t('processing') : t('verify')}
                        </button>
                    )}
                </div>
            )}

            {/* Checkout Button */}
            <button
                onClick={handleCheckout}
                disabled={isProcessing}
                style={{
                    width: '100%', padding: '16px', borderRadius: 16, border: 'none',
                    background: `linear-gradient(135deg, var(--brand-accent), #FF3CAC)`,
                    color: '#fff', fontWeight: 800, fontSize: 16, cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(255,107,53,0.4)', transition: 'all 0.3s',
                    opacity: isProcessing ? 0.7 : 1
                }}
            >
                {isProcessing ? t('processing') : `${t('checkout')} · ₩${total.toLocaleString()}`}
            </button>
        </div>
    );
};

export default CartPage;
