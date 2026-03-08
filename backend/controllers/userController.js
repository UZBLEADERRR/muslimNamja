const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { calculateDistance } = require('../utils/distance');
const { verifyPaymentScreenshot } = require('../utils/aiVerifier');

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
            const { phone, address, location } = req.body;
            const userId = req.user.userId;

            const updates = {};
            if (phone !== undefined) updates.phone = phone;
            if (address !== undefined) updates.address = address;
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
                }
            });
        } catch (error) {
            console.error('Update Profile Error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

module.exports = userController;
