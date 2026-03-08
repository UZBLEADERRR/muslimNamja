const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validateTelegramWebAppData } = require('../utils/telegramAuth');
const { calculateDistance } = require('../utils/distance');

// Sejong University Coordinates (Default Restaurant Location)
const RESTAURANT_LAT = 37.5503;
const RESTAURANT_LNG = 127.0731;

const authController = {
    async telegramLogin(req, res) {
        try {
            const { initData, location, address, phone } = req.body;

            if (!initData) {
                return res.status(400).json({ error: 'initData is required' });
            }

            const botToken = process.env.TELEGRAM_BOT_TOKEN;
            if (!botToken) {
                return res.status(500).json({ error: 'Server configuration error' });
            }

            // 1. Validate the initData
            const tgUser = validateTelegramWebAppData(initData, botToken.trim());

            if (!tgUser) {
                return res.status(401).json({ error: 'Invalid Telegram data.' });
            }

            // 2. Check if user exists (Sequelize findOne)
            let user = await User.findOne({ where: { telegramId: tgUser.id.toString() } });
            const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

            // 3. If new user, create them
            if (!user) {
                if (!location || !location.lat || !location.lng || !address || !phone) {
                    return res.status(400).json({
                        error: 'Registration requires location, address, and phone number',
                        requiresRegistration: true,
                        tgUser
                    });
                }

                const distance = calculateDistance(RESTAURANT_LAT, RESTAURANT_LNG, location.lat, location.lng);

                if (distance > 3) {
                    return res.status(403).json({
                        error: `Delivery only within 3km of Sejong University. You are ${distance.toFixed(1)}km away.`,
                        distance
                    });
                }

                user = await User.create({
                    telegramId: tgUser.id.toString(),
                    firstName: tgUser.first_name,
                    lastName: tgUser.last_name,
                    username: tgUser.username,
                    phone,
                    address,
                    registrationIp: userIp,
                    lastLoginIp: userIp,
                    location,
                    distanceFromRestaurant: distance
                });
            } else {
                user.lastLoginIp = userIp;
                await user.save();
            }

            // 4. Generate JWT
            const token = jwt.sign(
                { userId: user.id, role: user.role },
                process.env.JWT_SECRET || 'fallback_secret',
                { expiresIn: '7d' }
            );

            res.status(200).json({
                token,
                user: {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    walletBalance: user.walletBalance,
                    distanceFromRestaurant: user.distanceFromRestaurant
                }
            });
        } catch (error) {
            console.error('Login Error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

module.exports = authController;
