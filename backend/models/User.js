const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    telegramId: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String },
    username: { type: String },
    phone: { type: String },
    address: { type: String },
    location: {
        lat: { type: Number },
        lng: { type: Number },
    },
    registrationIp: { type: String },
    lastLoginIp: { type: String },
    distanceFromRestaurant: { type: Number, default: 0 }, // in km
    role: { type: String, enum: ['user', 'admin', 'delivery'], default: 'user' },
    walletBalance: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
