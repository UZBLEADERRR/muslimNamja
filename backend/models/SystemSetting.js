const mongoose = require('mongoose');

const systemSettingSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true }, // e.g., 'MIN_ORDER_AMOUNT', 'FREE_DELIVERY_DISTANCE_KM', 'MAX_DELIVERY_DISTANCE_KM'
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SystemSetting', systemSettingSchema);
