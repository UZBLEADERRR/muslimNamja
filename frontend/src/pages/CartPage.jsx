import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import api from '../utils/api';

const CartPage = () => {
    const { t } = useTranslation();
    const { user, cart, removeFromCart, clearCart } = useAppStore();
    const navigate = useNavigate();

    const [screenshot, setScreenshot] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('wallet');
    const [orderPlaced, setOrderPlaced] = useState(false);

    const subtotal = cart.reduce((sum, item) => sum + (item.product?.price || item.priceAtTime || 0) * (item.quantity || 1), 0);
    const distance = user?.distanceFromRestaurant || 0;
    const deliveryFee = distance > 1 ? 3000 : 0;
    const total = subtotal + deliveryFee;

    const handleCheckout = async () => {
        if (cart.length === 0) return;
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
                distance
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
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,107,53,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                                {product.emoji || '🍽️'}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 14 }}>{product.name || 'Item'}</div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>x{item.quantity} · ₩{((product.price || item.priceAtTime || 0) * (item.quantity || 1)).toLocaleString()}</div>
                            </div>
                            <button onClick={() => removeFromCart(i)} style={{ background: 'none', border: 'none', color: '#E74C3C', fontSize: 18, cursor: 'pointer', padding: '4px 8px' }}>✕</button>
                        </div>
                    );
                })}
            </div>

            {/* Totals */}
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 20, padding: 20, marginBottom: 20, boxShadow: 'var(--shadow-main)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{t('subtotal')}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>₩{subtotal.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{t('delivery_fee')}</span>
                    <span style={{ color: deliveryFee === 0 ? '#27AE60' : 'var(--text-primary)', fontWeight: 600 }}>{deliveryFee === 0 ? t('free_delivery') : `₩${deliveryFee.toLocaleString()}`}</span>
                </div>
                <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 16 }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{t('grand_total')}</span>
                    <span style={{ color: 'var(--brand-accent)', fontWeight: 900, fontFamily: "'Fraunces', serif", fontSize: 20 }}>₩{total.toLocaleString()}</span>
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
