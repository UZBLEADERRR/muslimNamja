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

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
