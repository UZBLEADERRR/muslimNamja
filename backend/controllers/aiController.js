const { verifyPaymentScreenshot } = require('../utils/aiVerifier');
const Transaction = require('../models/Transaction');

const aiController = {
    async verifyPayment(req, res) {
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
                // Automatically approve if amount matches the expected transaction amount? 
                // We can just mark as AI verified and let admin double check, or auto-complete it.
                verificationMessage = `AI verified payment of ${aiResult.amount}.`;
                transactionStatus = 'completed'; // Auto-approve for seamless flow
            } else {
                verificationMessage = 'AI could not fully verify the payment via screenshot. Forwarded to Admin.';
                transactionStatus = 'pending'; // Leave for admin
            }

            // 3. Update Transaction if ID was provided
            let updatedTransaction = null;
            if (transactionId) {
                updatedTransaction = await Transaction.findByIdAndUpdate(
                    transactionId,
                    {
                        aiVerified: aiResult.isVerified,
                        status: transactionStatus
                    },
                    { new: true }
                );

                // If completed, add to user wallet
                if (transactionStatus === 'completed' && updatedTransaction && updatedTransaction.type === 'topup') {
                    const User = require('../models/User');
                    await User.findByIdAndUpdate(updatedTransaction.user, {
                        $inc: { walletBalance: updatedTransaction.amount }
                    });
                }
            }

            res.json({
                message: verificationMessage,
                aiData: aiResult,
                transaction: updatedTransaction
            });

        } catch (error) {
            console.error('AI Controller Error:', error);
            res.status(500).json({ error: 'Failed to process AI verification' });
        }
    }
};

module.exports = aiController;
