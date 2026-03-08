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
            const transaction = await Transaction.create({
                userId,
                amount,
                type: 'topup',
                description: 'Wallet top-up via screenshot',
                screenshotUrl,
                status: 'pending'
            });

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

            const [updatedRowsCount, updatedUsers] = await User.update(
                { phone, address, location },
                {
                    where: { id: userId },
                    returning: true
                }
            );

            if (updatedRowsCount === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json(updatedUsers[0]);
        } catch (error) {
            console.error('Update Profile Error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

module.exports = userController;
