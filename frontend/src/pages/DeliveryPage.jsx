import React, { useState, useEffect } from 'react';
import { Truck, MapPin, CheckCircle } from 'lucide-react';

const DeliveryPage = () => {
    const [orders, setOrders] = useState([]);
    const [activeOrder, setActiveOrder] = useState(null);

    // Mock data for UI
    useEffect(() => {
        setOrders([
            { _id: '1', user: { address: 'Sejong University Dormitory A', phone: '010-1234-5678', distance: 0.8 }, totalAmount: 15000, status: 'preparing' },
            { _id: '2', user: { address: 'Gunja Station Exit 1', phone: '010-9876-5432', distance: 1.5 }, totalAmount: 32000, status: 'preparing' }
        ]);
    }, []);

    const handleAccept = (order) => {
        // In real app: call API to accept order status
        setActiveOrder({ ...order, status: 'delivering' });
        setOrders(orders.filter(o => o._id !== order._id));
    };

    const handleComplete = () => {
        // Call API to complete order and compute AI salary
        alert(`Order delivered! You earned: ${(3000 + (activeOrder.user.distance * 500)).toLocaleString()}₩`);
        setActiveOrder(null);
    };

    return (
        <div className="animate-slide-up" style={{ padding: '20px', paddingBottom: '40px' }}>
            <h2 style={{ fontSize: '24px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-primary)', fontFamily: "'Fraunces', serif" }}>
                <div style={{ background: 'var(--brand-accent2)', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(78,205,196,0.3)' }}>
                    <Truck size={20} color="white" />
                </div>
                SEJONG DELIVERY
            </h2>

            {/* Active Order UI */}
            {activeOrder && (
                <div style={{ background: 'linear-gradient(135deg, var(--brand-accent), #FF3CAC)', color: 'white', padding: '24px', borderRadius: '24px', marginBottom: '32px', boxShadow: '0 8px 24px rgba(255,107,53,0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, letterSpacing: 1 }}>ACTIVE DELIVERY</span>
                        <span style={{ fontSize: '12px', fontWeight: 700 }}>{activeOrder.user.distance} km away</span>
                    </div>

                    <h3 style={{ margin: '0 0 6px 0', fontSize: '14px', opacity: 0.9 }}>Delivery to:</h3>
                    <p style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 700, fontFamily: "'Fraunces', serif" }}>{activeOrder.user.address}</p>

                    <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                        <a href={`tel:${activeOrder.user.phone}`} style={{ flex: 1, background: 'rgba(255,255,255,0.2)', color: '#fff', textDecoration: 'none', padding: '12px', borderRadius: '14px', textAlign: 'center', fontWeight: 700, fontSize: '13px' }}>
                            Call Customer
                        </a>
                    </div>

                    <button onClick={handleComplete} style={{ width: '100%', background: '#fff', color: 'var(--brand-accent)', border: 'none', padding: '14px', borderRadius: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                        <CheckCircle size={18} /> Complete Delivery
                    </button>
                </div>
            )}

            {/* Available Orders Hub */}
            <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)', fontSize: '18px' }}>Available Orders ({orders.length})</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {orders.length === 0 && !activeOrder && (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', margin: '40px 0' }}>No available orders right now.</p>
                )}

                {orders.map(order => (
                    <div key={order._id} style={{ padding: '20px', borderRadius: '20px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-main)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                            <span style={{ fontWeight: 900, fontSize: '20px', color: 'var(--brand-accent)', fontFamily: "'Fraunces', serif" }}>{order.totalAmount.toLocaleString()} ₩</span>
                            <span style={{ color: 'var(--brand-accent2)', background: 'rgba(78,205,196,0.1)', padding: '6px 12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700 }}>
                                <MapPin size={14} /> {order.user.distance} km
                            </span>
                        </div>

                        <p style={{ margin: '0 0 16px 0', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>To: {order.user.address}</p>

                        <button
                            onClick={() => handleAccept(order)}
                            disabled={!!activeOrder}
                            style={{ width: '100%', padding: '14px', borderRadius: '14px', border: 'none', background: !!activeOrder ? 'var(--card-border)' : 'var(--text-primary)', color: 'var(--bg-primary)', fontWeight: 700, cursor: !!activeOrder ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
                        >
                            Accept Delivery
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DeliveryPage;
