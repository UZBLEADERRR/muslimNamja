const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['topup', 'spend', 'refund', 'salary'], required: true },
    description: { type: String }, // e.g., "AI verified screenshot" or "Order #123 payment"
    screenshotUrl: { type: String }, // Cloud storage URL if it was a topup
    aiVerified: { type: Boolean, default: false },
    adminApproved: { type: Boolean, default: false }, // If AI fails, admin approves
    status: { type: String, enum: ['pending', 'completed', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', transactionSchema);
