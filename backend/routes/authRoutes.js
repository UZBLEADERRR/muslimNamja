const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

// Login or Register via Telegram WebApp initData
router.post('/login', authController.telegramLogin);

// Get current user profile (Protected route)
router.get('/me', authMiddleware(), async (req, res) => {
    try {
        const User = require('../models/User');
        const user = await User.findByPk(req.user.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Return same format as telegramLogin for consistency
        res.json({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            role: user.role,
            walletBalance: user.walletBalance,
            distanceFromRestaurant: user.distanceFromRestaurant,
            phone: user.phone,
            address: user.address,
            location: user.location,
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
