const User = require('../models/User');
const Transaction = require('../models/Transaction');
const SystemSetting = require('../models/SystemSetting');
const sequelize = require('../config/database');
const { calculateDistance } = require('../utils/distance');
const { verifyPaymentScreenshot } = require('../utils/aiVerifier');
const { getBot } = require('../utils/globals');

const RESTAURANT_LAT = 37.5503;
const RESTAURANT_LNG = 127.0731;

const userController = {
    // Top up wallet via screenshot upload
    async topUpWallet(req, res) {
        try {
            const userId = req.user.userId;
            const amount = req.body.amount || 0;

            // Handle file upload (multer gives req.file)
            if (!req.file) {
                return res.status(400).json({ error: 'Screenshot is required' });
            }

            // Create a pending transaction
            const transaction = await Transaction.create({
                userId,
                amount: parseFloat(amount),
                type: 'topup',
                description: 'Wallet top-up via screenshot',
                screenshotUrl: 'uploaded',
                status: 'pending'
            });

            // AI verification in background
            try {
                const result = await verifyPaymentScreenshot(req.file.buffer, req.file.mimetype);
                if (result.isVerified && result.isPayment) {
                    const verifiedAmount = result.amount || parseFloat(amount);
                    transaction.status = 'approved';
                    transaction.amount = verifiedAmount;
                    await transaction.save();

                    // Add to wallet
                    const user = await User.findByPk(userId);
                    user.walletBalance = (user.walletBalance || 0) + verifiedAmount;
                    await user.save();

                    return res.status(201).json({
                        message: `AI tasdiqladi! ₩${verifiedAmount.toLocaleString()} hamyonga qo'shildi.`,
                        transaction, walletBalance: user.walletBalance
                    });
                } else {
                    transaction.status = 'pending';
                    await transaction.save();
                    return res.status(201).json({
                        message: 'To\'lov screenshot yuborildi. Admin tekshiradi.',
                        transaction
                    });
                }
            } catch (aiErr) {
                console.error('AI verification failed:', aiErr);
                return res.status(201).json({
                    message: 'Screenshot yuborildi. Admin tekshiradi.',
                    transaction
                });
            }
        } catch (error) {
            console.error('Top-up Error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Update profile
    async updateProfile(req, res) {
        try {
            const { phone, address, location, nickname, isPrivate } = req.body;
            const userId = req.user.userId;

            const updates = {};
            if (phone !== undefined) updates.phone = phone;
            if (address !== undefined) updates.address = address;
            if (nickname !== undefined) updates.nickname = nickname;
            if (isPrivate !== undefined) updates.isPrivate = isPrivate;
            if (location) {
                updates.location = location;
                updates.distanceFromRestaurant = calculateDistance(
                    RESTAURANT_LAT, RESTAURANT_LNG, location.lat, location.lng
                );
            }

            const [count, users] = await User.update(updates, {
                where: { id: userId },
                returning: true
            });

            if (count === 0) return res.status(404).json({ error: 'User not found' });

            const u = users[0];
            res.json({
                user: {
                    id: u.id, firstName: u.firstName, lastName: u.lastName,
                    username: u.username, role: u.role, walletBalance: u.walletBalance,
                    distanceFromRestaurant: u.distanceFromRestaurant,
                    phone: u.phone, address: u.address, location: u.location,
                    nickname: u.nickname, isPrivate: u.isPrivate, avatarUrl: u.avatarUrl,
                }
            });
        } catch (error) {
            console.error('Update Profile Error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Get Global System Setting (e.g., adminBankCard)
    async getSetting(req, res) {
        try {
            const setting = await SystemSetting.findOne({ where: { key: req.params.key } });
            res.json(setting ? setting : null);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch setting' });
        }
    },

    // P2P Money Transfer
    async transferMoney(req, res) {
        const trans = await sequelize.transaction();
        try {
            const { toUserId, amount } = req.body;
            const senderId = req.user.userId;
            const transferAmount = parseInt(amount);

            if (!toUserId || !transferAmount || transferAmount <= 0) {
                await trans.rollback();
                return res.status(400).json({ error: 'Invalid transfer data' });
            }
            if (senderId === toUserId) {
                await trans.rollback();
                return res.status(400).json({ error: 'O\'zingizga pul o\'tkaza olmaysiz' });
            }

            const sender = await User.findByPk(senderId, { transaction: trans });
            const receiver = await User.findByPk(toUserId, { transaction: trans });

            if (!receiver) {
                await trans.rollback();
                return res.status(404).json({ error: 'Qabul qiluvchi topilmadi' });
            }
            if (sender.walletBalance < transferAmount) {
                await trans.rollback();
                return res.status(400).json({ error: 'Hamyoningizda mablag\' yetarli emas' });
            }

            sender.walletBalance -= transferAmount;
            receiver.walletBalance += transferAmount;
            await sender.save({ transaction: trans });
            await receiver.save({ transaction: trans });

            await trans.commit();

            // Notify receiver via bot
            const bot = getBot();
            if (bot && receiver.telegramId) {
                bot.sendMessage(receiver.telegramId, `💸 <b>${sender.firstName}</b> sizga ₩${transferAmount.toLocaleString()} o'tkazdi!`, { parse_mode: 'HTML' }).catch(() => { });
            }

            res.json({ message: `₩${transferAmount.toLocaleString()} muvaffaqiyatli o'tkazildi!`, walletBalance: sender.walletBalance });
        } catch (error) {
            await trans.rollback();
            console.error('Transfer Error:', error);
            res.status(500).json({ error: 'Pul o\'tkazishda xatolik' });
        }
    },

    // Upload Avatar (only if wallet >= 15000)
    async uploadAvatar(req, res) {
        try {
            const userId = req.user.userId;
            if (!req.file) return res.status(400).json({ error: 'Image is required' });

            const user = await User.findByPk(userId);
            if (!user) return res.status(404).json({ error: 'User not found' });
            if (user.walletBalance < 15000) {
                return res.status(403).json({ error: 'Profil rasm qo\'yish uchun hamyoningizda kamida ₩15,000 bo\'lishi kerak!' });
            }

            const avatarUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
            await User.update({ avatarUrl }, { where: { id: userId } });

            res.json({ avatarUrl });
        } catch (error) {
            res.status(500).json({ error: 'Failed to upload avatar' });
        }
    },

    // Get all users (for members list in community) — hide wallet for private users
    async getAllUsers(req, res) {
        try {
            const users = await User.findAll({
                attributes: ['id', 'firstName', 'lastName', 'username', 'role', 'avatarUrl', 'walletBalance', 'nickname', 'isPrivate'],
                order: [['firstName', 'ASC']]
            });
            // Hide wallet for private accounts
            const mapped = users.map(u => {
                const json = u.toJSON();
                if (json.isPrivate) {
                    json.walletBalance = null; // Hidden
                }
                return json;
            });
            res.json(mapped);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch users' });
        }
    }
};

module.exports = userController;
