import React, { useState } from 'react';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import { Trash2, CreditCard, Wallet } from 'lucide-react';
import api from '../utils/api';

const CartPage = () => {
    const { t, lang } = useTranslation();
    const { cart, removeFromCart, clearCart, user } = useAppStore();
    const [isProcessing, setIsProcessing] = useState(false);
    const [screenshot, setScreenshot] = useState(null);

    // Dummy logic for distance cost
    const deliveryDistance = user?.distanceFromRestaurant || 0;
    const deliveryFee = deliveryDistance <= 1 ? 0 : 3000;

    const itemsTotal = cart.reduce((acc, item) => acc + (item.priceAtTime * item.quantity), 0);
    const grandTotal = itemsTotal + deliveryFee;

    const handleCheckout = async () => {
        if (!user) return alert('Please login via Telegram first');

        // In real app, we handle screenshot upload here or rely on wallet balance
        if (user.walletBalance < grandTotal && !screenshot) {
            return alert('Insufficient wallet balance. Please upload a payment screenshot.');
        }

        setIsProcessing(true);
        try {
            // Mock order creation API call
            // await api.post('/orders', { items: cart, paymentMethod: 'wallet/transfer' });
            await new Promise(r => setTimeout(r, 1500));
            alert('Order Placed Successfully! AI/Admin is verifying your payment if uploaded.');
            clearCart();
        } catch (e) {
            console.error(e);
            alert('Failed to place order');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleScreenshotChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setScreenshot(e.target.files[0]);
        }
    };

    if (cart.length === 0) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
                <ShoppingCartIcon size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                <p>{t('empty_cart')}</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <h2 style={{ marginBottom: '20px' }}>{t('cart')}</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                {cart.map((item, index) => (
                    <div key={index} className="glass" style={{ display: 'flex', gap: '16px', padding: '16px', borderRadius: '16px', alignItems: 'center' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '8px', overflow: 'hidden' }}>
                            <img src={item.product.imageUrl || 'https://via.placeholder.com/64'} alt={item.product.name[lang]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>

                        <div style={{ flex: 1 }}>
                            <h4 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>{item.product.name[lang] || item.product.name.en}</h4>
                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                                {item.priceAtTime.toLocaleString()}₩ x {item.quantity}
                            </p>
                        </div>

                        <button
                            onClick={() => removeFromCart(index)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--danger-color)', padding: '8px' }}
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                ))}
            </div>

            <div className="glass" style={{ padding: '20px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>Items Total</span>
                    <span>{itemsTotal.toLocaleString()}₩</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: deliveryFee ? 'var(--text-secondary)' : 'var(--success-color)' }}>
                    <span>{deliveryFee ? t('fee_delivery') : t('free_delivery')}</span>
                    <span>{deliveryFee ? `+${deliveryFee.toLocaleString()}₩` : 'Free'}</span>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '8px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '18px' }}>
                    <span>{t('total')}</span>
                    <span style={{ color: 'var(--brand-primary)' }}>{grandTotal.toLocaleString()}₩</span>
                </div>

                {/* Payment Screenshot (AI Verification Trigger) */}
                {(user && user.walletBalance < grandTotal) && (
                    <div style={{ marginTop: '16px' }}>
                        <p style={{ fontSize: '12px', color: 'var(--danger-color)', marginBottom: '8px' }}>
                            Insufficient Wallet Balance ({user.walletBalance.toLocaleString()}₩). Please upload transfer receipt:
                        </p>
                        <label style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            padding: '12px', border: '1px dashed var(--brand-primary)', borderRadius: '12px',
                            color: 'var(--brand-primary)', cursor: 'pointer', background: 'var(--bg-primary)'
                        }}>
                            <CreditCard size={20} />
                            <span style={{ fontSize: '14px', fontWeight: 600 }}>
                                {screenshot ? screenshot.name : 'Upload Screenshot for AI Verification'}
                            </span>
                            <input type="file" accept="image/*" onChange={handleScreenshotChange} style={{ display: 'none' }} />
                        </label>
                    </div>
                )}

                <button
                    onClick={handleCheckout}
                    disabled={isProcessing}
                    className="btn-primary"
                    style={{ width: '100%', marginTop: '16px', padding: '16px', fontSize: '16px' }}
                >
                    {isProcessing ? 'Processing AI...' : t('checkout')}
                </button>
            </div>
        </div>
    );
};

// SVG fallback
const ShoppingCartIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
    </svg>
)

export default CartPage;
