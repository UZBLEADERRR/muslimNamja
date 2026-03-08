const ChatMessage = require('../models/ChatMessage');

const chatController = {
    // Get all messages
    async getMessages(req, res) {
        try {
            const messages = await ChatMessage.find()
                .populate('sender', 'firstName role')
                .populate('offerData.productId', 'name price')
                .sort({ createdAt: -1 }) // Newest first
                .limit(50);

            res.json(messages.reverse());
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch messages' });
        }
    },

    // Post a normal message (User/Admin/Delivery)
    async postMessage(req, res) {
        try {
            const { text } = req.body;
            const sender = req.user.userId;

            if (!text) return res.status(400).json({ error: 'Message text is required' });

            const msg = new ChatMessage({ sender, text });
            await msg.save();

            const populatedMsg = await msg.populate('sender', 'firstName role');
            res.status(201).json(populatedMsg);
        } catch (error) {
            res.status(500).json({ error: 'Failed to post message' });
        }
    },

    // Post a special offer (Admin Only)
    async postOffer(req, res) {
        try {
            const { text, productId, specialPrice, maxUses } = req.body;
            const sender = req.user.userId;

            if (!productId || !specialPrice || !maxUses) {
                return res.status(400).json({ error: 'Missing offer details' });
            }

            const msg = new ChatMessage({
                sender,
                text: text || 'Special offer from Admin!',
                isSystem: true,
                offerAction: 'buy_special_menu',
                offerData: {
                    productId,
                    specialPrice,
                    maxUses,
                    currentUses: 0
                }
            });

            await msg.save();
            const populatedMsg = await msg.populate([{ path: 'sender', select: 'firstName role' }, { path: 'offerData.productId', select: 'name price' }]);
            res.status(201).json(populatedMsg);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create offer' });
        }
    },

    // Claim a special offer
    async claimOffer(req, res) {
        try {
            const { messageId } = req.params;
            const userId = req.user.userId;

            // Logic to claim offer 
            // Need atomicity (e.g., test maxUses in the update query)
            const msg = await ChatMessage.findOneAndUpdate(
                {
                    _id: messageId,
                    'offerData.currentUses': { $lt: '$offerData.maxUses' }
                    // Note: basic mongo $lt on same doc requires aggregation in update or simple read then write. 
                    // For simplicity, we just check and increment but might race condition. Better approach:
                },
                {},
                { new: false }
            );

            const checkMsg = await ChatMessage.findById(messageId);
            if (!checkMsg || !checkMsg.isSystem || checkMsg.offerData.currentUses >= checkMsg.offerData.maxUses) {
                return res.status(400).json({ error: 'Offer has expired or max users reached.' });
            }

            // Increment safely
            const updatedMsg = await ChatMessage.findOneAndUpdate(
                { _id: messageId, 'offerData.currentUses': { $lt: checkMsg.offerData.maxUses } },
                { $inc: { 'offerData.currentUses': 1 } },
                { new: true }
            );

            if (!updatedMsg) {
                return res.status(400).json({ error: 'Offer just reached its limit.' });
            }

            // Successfully grabbed offer. User can now proceed to cart with the `updatedMsg.offerData.specialPrice`.
            // The frontend would apply this price.
            res.json({ message: 'Offer claimed successfully!', offerData: updatedMsg.offerData });
        } catch (error) {
            res.status(500).json({ error: 'Failed to claim offer' });
        }
    }
};

module.exports = chatController;
