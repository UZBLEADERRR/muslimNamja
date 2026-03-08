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

            // 2. Check if user exists
            let user = await User.findOne({ where: { telegramId: tgUser.id.toString() } });
            const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

            const adminChatId = process.env.ADMIN_CHAT_ID;
            const isAdmin = adminChatId && adminChatId.toString() === tgUser.id.toString();

            // 3. If new user, create them or signal registration needed
            if (!user) {
                if (!phone || !address || !location) {
                    return res.status(200).json({
                        requiresRegistration: true,
                        tgUser: {
                            id: tgUser.id,
                            first_name: tgUser.first_name,
                            last_name: tgUser.last_name,
                            username: tgUser.username
                        }
                    });
                }

                const distance = calculateDistance(RESTAURANT_LAT, RESTAURANT_LNG, location.lat, location.lng);

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
                    distanceFromRestaurant: distance,
                    role: isAdmin ? 'admin' : 'user'
                });
            } else {
                // Auto-promote if they are admin
                if (isAdmin && user.role !== 'admin') {
                    user.role = 'admin';
                }
                // Update name in case user changed it in Telegram
                user.firstName = tgUser.first_name || user.firstName;
                user.lastName = tgUser.last_name || user.lastName;
                user.username = tgUser.username || user.username;
                user.lastLoginIp = userIp;
                await user.save();
            }

            // 4. Generate JWT
            const token = jwt.sign(
                { userId: user.id, role: user.role },
                process.env.JWT_SECRET || 'fallback_secret',
                { expiresIn: '7d' }
            );

            // 5. Return FULL user data — frontend needs everything
            res.status(200).json({
                token,
                user: {
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
                }
            });
        } catch (error) {
            console.error('Login Error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

module.exports = authController;
