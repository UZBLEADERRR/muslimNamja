import React, { useState } from 'react';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store/useAppStore';

const CartPage = () => {
    const { t, lang } = useTranslation();
    const { cart, removeFromCart, addToCart, clearCart, user } = useAppStore();
    const [isProcessing, setIsProcessing] = useState(false);
    const [screenshot, setScreenshot] = useState(null);

    // Mock Delivery logic
    const deliveryDistance = user?.distanceFromRestaurant || 0;
    const deliveryFee = deliveryDistance <= 1 ? 0 : 3000;

    const itemsTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const grandTotal = itemsTotal + deliveryFee;

    const handleCheckout = async () => {
        if (!user) return alert('Please login via Profile page first.');

        if (user.walletBalance < grandTotal && !screenshot) {
            return alert('Insufficient wallet balance. Please upload a payment screenshot for AI Verification.');
        }

        setIsProcessing(true);
        try {
            await new Promise(r => setTimeout(r, 1500));
            alert('Order Placed Successfully! AI/Admin is verifying your payment. Check Track tab.');
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

    return (
        <div className="animate-slide-up" style={{ padding: 20 }}>
            <h2 style={{ color: "var(--text-primary)", fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 900, marginBottom: 20 }}>
                🛒 {t('cart') || 'Cart'}
            </h2>

            {cart.length === 0 ? (
                <div style={{ textAlign: "center", padding: 60 }}>
                    <div style={{ fontSize: 64, marginBottom: 16 }}>🍽️</div>
                    <div style={{ color: "var(--text-secondary)", fontSize: 15 }}>Your cart is empty</div>
                </div>
            ) : (
                <>
                    {cart.map(item => (
                        <div key={item.id} style={{ background: "var(--card-bg)", borderRadius: 16, padding: 14, marginBottom: 12, display: "flex", gap: 12, alignItems: "center", border: `1px solid var(--card-border)` }}>
                            <span style={{ fontSize: 36 }}>{item.emoji || '🍱'}</span>
                            <div style={{ flex: 1 }}>
                                <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 14 }}>{item.name}</div>
                                <div style={{ color: "var(--brand-accent)", fontWeight: 800, fontSize: 15 }}>₩{(item.price * item.quantity).toLocaleString()}</div>
                            </div>
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <button onClick={() => {
                                    if (item.quantity > 1) addToCart(item, -1, {});
                                    else removeFromCart(cart.findIndex(i => i.id === item.id));
                                }} style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", color: "var(--text-primary)", cursor: "pointer", fontWeight: 700, fontSize: 16 }}>−</button>
                                <span style={{ color: "var(--text-primary)", fontWeight: 700, minWidth: 20, textAlign: "center" }}>{item.quantity}</span>
                                <button onClick={() => addToCart(item, 1, {})} style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--brand-accent)", border: "none", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 16 }}>+</button>
                            </div>
                        </div>
                    ))}

                    <div style={{ background: "var(--card-bg)", borderRadius: 16, padding: 16, marginTop: 8, border: `1px solid var(--card-border)` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, color: "var(--text-secondary)", fontSize: 13 }}>
                            <span>Subtotal</span><span style={{ color: "var(--text-primary)" }}>₩{itemsTotal.toLocaleString()}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, color: "var(--text-secondary)", fontSize: 13 }}>
                            <span>Delivery</span>
                            <span style={{ color: deliveryFee === 0 ? "#27AE60" : "var(--text-primary)", fontWeight: deliveryFee === 0 ? 700 : 500 }}>
                                {deliveryFee === 0 ? 'FREE 🎉' : `+₩${deliveryFee.toLocaleString()}`}
                            </span>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, color: "var(--text-primary)", fontWeight: 800, fontSize: 17, borderTop: `1px solid var(--card-border)`, paddingTop: 12 }}>
                            <span>Total</span><span style={{ color: "var(--brand-accent)" }}>₩{grandTotal.toLocaleString()}</span>
                        </div>

                        {/* Screenshot Input */}
                        {(!user || user.walletBalance < grandTotal) && (
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: 11, color: "var(--brand-accent)", marginBottom: 6 }}>Upload Bank Transfer Receipt (AI Verification)</div>
                                <label style={{ display: "block", background: "rgba(255,255,255,0.05)", border: "1px dashed rgba(255,255,255,0.2)", borderRadius: 12, padding: "12px", textAlign: "center", color: "var(--text-secondary)", fontSize: 12, cursor: "pointer" }}>
                                    {screenshot ? screenshot.name : "Tap to upload receipt 📸"}
                                    <input type="file" onChange={handleScreenshotChange} accept="image/*" style={{ display: "none" }} />
                                </label>
                            </div>
                        )}

                        <button onClick={handleCheckout} disabled={isProcessing} style={{ width: "100%", background: `linear-gradient(135deg, var(--brand-accent), #FF3CAC)`, color: "#fff", border: "none", borderRadius: 14, padding: "16px 0", fontSize: 16, fontWeight: 800, cursor: isProcessing ? "not-allowed" : "pointer", opacity: isProcessing ? 0.7 : 1 }}>
                            {isProcessing ? "Processing..." : "💳 Checkout via KakaoPay / Card"}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default CartPage;
