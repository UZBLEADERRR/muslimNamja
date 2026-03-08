const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    deliveryMan: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: { type: Number, required: true },
        addons: [{ type: String }],
        priceAtTime: { type: Number, required: true } // Snapshot of price
    }],
    totalAmount: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'preparing', 'delivering', 'completed', 'cancelled'],
        default: 'pending'
    },
    deliveryFee: { type: Number, default: 0 },
    distance: { type: Number, default: 0 }, // Distance from restaurant when ordered
    deliveryManEarning: { type: Number, default: 0 }, // Computed when completed
    paymentMethod: { type: String, enum: ['wallet', 'cash'], default: 'wallet' },
    createdAt: { type: Date, default: Date.now },
    completedAt: { type: Date }
});

module.exports = mongoose.model('Order', orderSchema);
