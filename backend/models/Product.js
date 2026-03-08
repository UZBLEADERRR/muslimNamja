const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        en: { type: String, required: true },
        ko: { type: String, required: true },
        uz: { type: String, required: true },
        ru: { type: String, required: true },
    },
    description: {
        en: { type: String },
        ko: { type: String },
        uz: { type: String },
        ru: { type: String },
    },
    price: { type: Number, required: true },
    category: { type: String, required: true }, // e.g., 'Food', 'Drinks', 'Salads'
    imageUrl: { type: String },
    ingredients: [{
        name: { type: String },
        cost: { type: Number }
    }],
    addons: [{
        name: {
            en: { type: String },
            ko: { type: String },
            uz: { type: String },
            ru: { type: String },
        },
        price: { type: Number }
    }],
    ingredientCost: { type: Number, default: 0 }, // For admin profit calculation
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
