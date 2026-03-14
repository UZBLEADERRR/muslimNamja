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
    },

    async reverseGeocode(req, res) {
        try {
            const { lat, lng } = req.body;
            if (!lat || !lng) return res.status(400).json({ error: 'lat and lng are required' });

            let address = `${lat.toFixed(6)}, ${lng.toFixed(6)} (GPS koordinata)`;

            try {
                const { GoogleGenerativeAI } = require('@google/generative-ai');
                const apiKey = process.env.AI_API_KEY;
                if (apiKey) {
                    const genAI = new GoogleGenerativeAI(apiKey);
                    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

                    const prompt = `You are a geocoding assistant. Given these GPS coordinates: latitude=${lat}, longitude=${lng}

This location is likely in South Korea (Seoul area near Sejong University).

Please determine the actual street address for these coordinates. Provide the response in this exact JSON format:
{
  "address_korean": "Full address in Korean (e.g., 서울특별시 광진구 능동로 209)",
  "address_uzbek": "Same address transliterated/described in Uzbek (e.g., Seul shahri, Gvangjin-gu, Neungdong-ro 209)",
  "district": "District name (e.g., 광진구 / Gwangjin-gu)",
  "neighborhood": "Neighborhood (e.g., 능동 / Neungdong)"
}
Respond ONLY with the JSON, no markdown formatting.`;

                    const result = await model.generateContent(prompt);
                    const rawResponse = result.response.text().trim();
                    let cleanJsonStr = rawResponse;
                    if (cleanJsonStr.startsWith('```json')) {
                        cleanJsonStr = cleanJsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '');
                    }
                    if (cleanJsonStr.startsWith('```')) {
                        cleanJsonStr = cleanJsonStr.replace(/^```\n?/, '').replace(/\n?```$/, '');
                    }
                    const parsed = JSON.parse(cleanJsonStr);
                    address = parsed.address_uzbek || parsed.address_korean || address;

                    return res.json({
                        address,
                        addressKorean: parsed.address_korean,
                        addressUzbek: parsed.address_uzbek,
                        district: parsed.district,
                        neighborhood: parsed.neighborhood
                    });
                }
            } catch (aiErr) {
                console.error('AI Reverse Geocode error:', aiErr.message);
            }

            res.json({ address });
        } catch (error) {
            console.error('Reverse geocode error:', error);
            res.status(500).json({ error: 'Failed to reverse geocode' });
        }
    }
};

module.exports = aiController;
