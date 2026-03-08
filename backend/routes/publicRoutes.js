const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const SystemSetting = require('../models/SystemSetting');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Monthly top spender (public)
router.get('/monthly-winner', async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const orders = await Order.findAll({
            where: {
                status: 'completed',
                createdAt: { [Op.gte]: startOfMonth }
            },
            attributes: ['userId', 'totalAmount']
        });

        // Sum spending per user
        const spending = {};
        orders.forEach(o => {
            spending[o.userId] = (spending[o.userId] || 0) + (o.totalAmount || 0);
        });

        // Find top spender
        let topUserId = null;
        let topAmount = 0;
        Object.entries(spending).forEach(([uid, amt]) => {
            if (amt > topAmount) {
                topUserId = uid;
                topAmount = amt;
            }
        });

        if (!topUserId) return res.json(null);

        const winner = await User.findByPk(topUserId, {
            attributes: ['id', 'firstName', 'lastName', 'nickname', 'avatarUrl', 'role']
        });

        res.json({
            user: winner,
            totalSpent: topAmount,
            month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to get winner' });
    }
});

// Admin Ad/Banner (public)
router.get('/ad-banner', async (req, res) => {
    try {
        const setting = await SystemSetting.findOne({ where: { key: 'adBanner' } });
        res.json(setting ? JSON.parse(setting.value) : null);
    } catch (err) {
        res.json(null);
    }
});

// Store Open/Close Status (public)
router.get('/store-status', async (req, res) => {
    try {
        const setting = await SystemSetting.findOne({ where: { key: 'isStoreOpen' } });
        const isOpen = setting ? setting.value === 'true' : true; // Default to true if not set
        res.json({ isOpen });
    } catch (err) {
        res.json({ isOpen: true }); // Fallback
    }
});

module.exports = router;
