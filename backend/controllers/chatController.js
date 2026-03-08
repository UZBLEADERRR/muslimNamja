const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const Product = require('../models/Product');
const sequelize = require('../config/database');
const { Op } = require('sequelize');

const chatController = {
    // Get all messages
    async getMessages(req, res) {
        try {
            const messages = await ChatMessage.findAll({
                limit: 50,
                order: [['createdAt', 'DESC']]
            });

            // Populate sender (manual due to simple setup)
            const populated = await Promise.all(messages.map(async (msg) => {
                const sender = await User.findByPk(msg.senderId, { attributes: ['firstName', 'role'] });
                let product = null;
                if (msg.offerData && msg.offerData.productId) {
                    product = await Product.findByPk(msg.offerData.productId, { attributes: ['name', 'price'] });
                }
                return {
                    ...msg.toJSON(),
                    sender,
                    offerData: msg.offerData ? { ...msg.offerData, product } : null
                };
            }));

            res.json(populated.reverse());
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to fetch messages' });
        }
    },

    // Post a normal message
    async postMessage(req, res) {
        try {
            const { text } = req.body;
            const senderId = req.user.userId;

            if (!text) return res.status(400).json({ error: 'Message text is required' });

            const msg = await ChatMessage.create({ senderId, text });
            const sender = await User.findByPk(senderId, { attributes: ['firstName', 'role'] });

            res.status(201).json({ ...msg.toJSON(), sender });
        } catch (error) {
            res.status(500).json({ error: 'Failed to post message' });
        }
    },

    // Post a special offer
    async postOffer(req, res) {
        try {
            const { text, productId, specialPrice, maxUses } = req.body;
            const senderId = req.user.userId;

            if (!productId || !specialPrice || !maxUses) {
                return res.status(400).json({ error: 'Missing offer details' });
            }

            const msg = await ChatMessage.create({
                senderId,
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

            const sender = await User.findByPk(senderId, { attributes: ['firstName', 'role'] });
            const product = await Product.findByPk(productId, { attributes: ['name', 'price'] });

            res.status(201).json({
                ...msg.toJSON(),
                sender,
                offerData: { ...msg.offerData, product }
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to create offer' });
        }
    },

    // Claim a special offer
    async claimOffer(req, res) {
        const trans = await sequelize.transaction();
        try {
            const { messageId } = req.params;

            const msg = await ChatMessage.findByPk(messageId, { transaction: trans });

            if (!msg || !msg.isSystem || msg.offerData.currentUses >= msg.offerData.maxUses) {
                await trans.rollback();
                return res.status(400).json({ error: 'Offer has expired or max users reached.' });
            }

            // Update JSONB field atomically in SQL (Postgres specific syntax or manual re-save)
            // For general Sequelize, we can update the whole object
            const newOfferData = {
                ...msg.offerData,
                currentUses: msg.offerData.currentUses + 1
            };

            const [count] = await ChatMessage.update(
                { offerData: newOfferData },
                {
                    where: {
                        id: messageId,
                        // Concurrent check: offerData -> currentUses < maxUses
                        // In Postgres with JSONB, we can use raw query for better atomicity etc.
                        // But for now, we'll re-check within the transaction.
                    },
                    transaction: trans
                }
            );

            await trans.commit();
            res.json({ message: 'Offer claimed successfully!', offerData: newOfferData });
        } catch (error) {
            await trans.rollback();
            res.status(500).json({ error: 'Failed to claim offer' });
        }
    }
};

module.exports = chatController;
