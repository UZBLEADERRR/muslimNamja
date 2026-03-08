const User = require('../models/User');
const Transaction = require('../models/Transaction');

const userController = {
    // Top up wallet via screenshot upload
    async topUpWallet(req, res) {
        try {
            const { amount, screenshotUrl } = req.body;
            const userId = req.user.userId;

            if (!amount || !screenshotUrl) {
                return res.status(400).json({ error: 'Amount and screenshot are required' });
            }

            // Create a pending transaction
            // AI verification happens asynchronously (Phase 3)
            const transaction = new Transaction({
                user: userId,
                amount,
                type: 'topup',
                description: 'Wallet top-up via screenshot',
                screenshotUrl,
                status: 'pending' // Pending AI / Admin verification
            });

            await transaction.save();

            res.status(201).json({ message: 'Top-up request submitted for verification', transaction });
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

            // Note: Recalculate distance if location changes (implementation later)

            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { $set: { phone, address, location } },
                { new: true, runValidators: true }
            );

            res.json(updatedUser);
        } catch (error) {
            console.error('Update Profile Error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

module.exports = userController;
