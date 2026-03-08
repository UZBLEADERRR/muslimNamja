const { verifyPaymentScreenshot } = require('../utils/aiVerifier');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const sequelize = require('../config/database');

const aiController = {
    async verifyPayment(req, res) {
        const trans = await sequelize.transaction();
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No image provided' });
            }

            const { transactionId } = req.body;

            // 1. Send the file buffer directly to AI
            const aiResult = await verifyPaymentScreenshot(req.file.buffer, req.file.mimetype);

            if (aiResult.error) {
                return res.status(500).json({ error: aiResult.error });
            }

            let verificationMessage = '';
            let transactionStatus = 'pending';

            // 2. Evaluate AI Result
            if (aiResult.isPayment && aiResult.isVerified && aiResult.amount > 0) {
                verificationMessage = `AI verified payment of ${aiResult.amount}.`;
                transactionStatus = 'completed';
            } else {
                verificationMessage = 'AI could not fully verify the payment via screenshot. Forwarded to Admin.';
                transactionStatus = 'pending';
            }

            // 3. Update Transaction
            let updatedTransaction = null;
            if (transactionId) {
                const [count, transactions] = await Transaction.update(
                    {
                        aiVerified: aiResult.isVerified,
                        status: transactionStatus
                    },
                    {
                        where: { id: transactionId },
                        returning: true,
                        transaction: trans
                    }
                );
                updatedTransaction = transactions[0];

                // If completed, add to user wallet
                if (transactionStatus === 'completed' && updatedTransaction && updatedTransaction.type === 'topup') {
                    await User.increment(
                        { walletBalance: updatedTransaction.amount },
                        {
                            where: { id: updatedTransaction.userId },
                            transaction: trans
                        }
                    );
                }
            }

            await trans.commit();

            res.json({
                message: verificationMessage,
                aiData: aiResult,
                transaction: updatedTransaction
            });

        } catch (error) {
            await trans.rollback();
            console.error('AI Controller Error:', error);
            res.status(500).json({ error: 'Failed to process AI verification' });
        }
    }
};

module.exports = aiController;
