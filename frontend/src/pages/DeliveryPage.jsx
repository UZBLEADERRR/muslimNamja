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
        <div className="animate-fade-in">
            <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Truck color="var(--brand-primary)" /> Delivery Dashboard
            </h2>

            {/* Active Order UI */}
            {activeOrder && (
                <div style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-hover))', color: 'white', padding: '24px', borderRadius: '24px', marginBottom: '32px', boxShadow: 'var(--shadow-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>ACTIVE DELIVERY</span>
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>{activeOrder.user.distance} km away</span>
                    </div>

                    <h3 style={{ margin: '0 0 4px 0', fontSize: '20px' }}>Delivery to:</h3>
                    <p style={{ margin: '0 0 16px 0', fontSize: '16px', opacity: 0.9 }}>{activeOrder.user.address}</p>

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                        <a href={`tel:${activeOrder.user.phone}`} className="btn-primary" style={{ flex: 1, background: 'white', color: 'var(--brand-primary)', textDecoration: 'none' }}>
                            Call Customer
                        </a>
                    </div>

                    <button onClick={handleComplete} className="btn-primary" style={{ width: '100%', background: 'var(--success-color)', color: 'white' }}>
                        <CheckCircle size={20} /> Complete Delivery
                    </button>
                </div>
            )}

            {/* Available Orders Hub */}
            <h3 style={{ marginBottom: '16px' }}>Available Orders ({orders.length})</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {orders.length === 0 && !activeOrder && (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', margin: '40px 0' }}>No available orders right now.</p>
                )}

                {orders.map(order => (
                    <div key={order._id} className="glass" style={{ padding: '20px', borderRadius: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <span style={{ fontWeight: 600, fontSize: '18px' }}>{order.totalAmount.toLocaleString()} ₩</span>
                            <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <MapPin size={16} /> {order.user.distance} km
                            </span>
                        </div>

                        <p style={{ margin: '0 0 16px 0', color: 'var(--text-secondary)' }}>To: {order.user.address}</p>

                        <button
                            onClick={() => handleAccept(order)}
                            disabled={!!activeOrder}
                            className="btn-primary"
                            style={{ width: '100%', opacity: activeOrder ? 0.5 : 1 }}
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
