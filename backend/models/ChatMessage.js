const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String },
    isSystem: { type: Boolean, default: false }, // If sent by admin/system as a button offer
    offerAction: {
        type: String, // e.g., 'buy_special_menu'
    },
    offerData: {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        specialPrice: { type: Number },
        maxUses: { type: Number },
        currentUses: { type: Number, default: 0 }
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
