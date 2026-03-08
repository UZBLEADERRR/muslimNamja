const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const ChatMessage = require('../models/ChatMessage');
const { getBot } = require('../utils/globals');
const sequelize = require('../config/database');

const orderController = {
    async createOrder(req, res) {
        const trans = await sequelize.transaction();
        try {
            const { items, paymentMethod, totalAmount, deliveryFee, distance, deliveryType, meetupLocation, giftInfo } = req.body;
            const userId = req.user.userId;

            if (!items || items.length === 0) {
                return res.status(400).json({ error: 'Cart is empty' });
            }

            // 1. Create Order
            const order = await Order.create({
                userId,
                items,
                paymentMethod,
                totalAmount,
                deliveryFee,
                distance,
                deliveryType: deliveryType || 'home',
                meetupLocation: meetupLocation || null,
                giftInfo: giftInfo || null,
                status: 'pending'
            }, { transaction: trans });

            // 2. If payment is via wallet, deduct balance
            if (paymentMethod === 'wallet') {
                const user = await User.findByPk(userId, { transaction: trans });
                if (user.walletBalance < totalAmount) {
                    await trans.rollback();
                    return res.status(400).json({ error: 'Insufficient wallet balance' });
                }
                user.walletBalance -= totalAmount;
                await user.save({ transaction: trans });
            }

            await trans.commit();

            // 3. Send Telegram Notifications (Post-transaction)
            const bot = getBot();
            const adminId = process.env.ADMIN_CHAT_ID;
            const channelId = process.env.ORDERS_CHANNEL_ID;

            const orderDetails = items.map(item => `- ${item.productName || 'Taom'} x ${item.quantity}`).join('\n');
            let deliveryText = `🚚 <b>Yetkazib berish (Uyga):</b> ${deliveryFee} ₩`;
            if (deliveryType === 'pickup') deliveryText = `🚶 <b>Olib ketish (Pick up)</b> (-1000 ₩ chegirma)`;
            if (deliveryType === 'meetup') deliveryText = `📍 <b>Uchrashuv hududi (Meet up):</b> ${meetupLocation}`;

            let giftText = '';
            if (giftInfo?.isGift) {
                giftText = `\n🎁 <b>SOVG'A:</b> Kimga: ${giftInfo.toUserId} | Anonim: ${giftInfo.isAnonymous ? 'Ha' : 'Yoq'}`;
            }

            const message = `
🛍 <b>Yangi Buyurtma!</b> (#${order.id.toString().slice(0, 8)})

👤 <b>Mijoz ID:</b> ${userId.toString().slice(0, 8)}
💰 <b>Jami to'lov:</b> ${totalAmount} ₩ (Maxsulotlar + yo'lkira yig'indisi)
${deliveryText}
📍 <b>Mijoz/Uchrashuv masofasi:</b> ${distance} km
${giftText}

<b>Savat:</b>
${orderDetails}

💳 <b>To'lov:</b> ${paymentMethod === 'wallet' ? 'Hamyon' : 'Naqd'}
`;

            if (bot) {
                if (adminId) bot.sendMessage(adminId, message, { parse_mode: 'HTML' });
                if (channelId) bot.sendMessage(channelId, message, { parse_mode: 'HTML' });
            }

            res.status(201).json({ message: 'Order placed successfully', order });
        } catch (error) {
            await trans.rollback();
            console.error('Order Error:', error);
            res.status(500).json({ error: 'Failed to place order' });
        }
    },

    async getMyOrders(req, res) {
        try {
            const orders = await Order.findAll({
                where: { userId: req.user.userId },
                order: [['createdAt', 'DESC']]
            });
            res.json(orders);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch orders' });
        }
    },

    // Get chat messages for a specific order
    async getOrderChat(req, res) {
        try {
            const { id } = req.params;
            const messages = await ChatMessage.findAll({
                where: { orderId: id, isDeleted: false },
                order: [['createdAt', 'ASC']]
            });
            const populated = await Promise.all(messages.map(async (msg) => {
                const sender = await User.findByPk(msg.senderId, { attributes: ['id', 'firstName', 'role'] });
                return { ...msg.toJSON(), sender };
            }));
            res.json(populated);
        } catch (err) {
            res.status(500).json({ error: 'Failed to fetch order chat' });
        }
    },

    // Post message/image to a specific order chat
    async postOrderChat(req, res) {
        try {
            const { id } = req.params;
            const { text } = req.body;
            const senderId = req.user.userId;

            let imageUrl = null;
            if (req.file) {
                imageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
            }

            if (!text && !imageUrl) return res.status(400).json({ error: 'Message or image required' });

            const msg = await ChatMessage.create({
                orderId: id,
                senderId,
                text: text || '',
                imageUrl
            });

            const sender = await User.findByPk(senderId, { attributes: ['id', 'firstName', 'role'] });
            res.status(201).json({ ...msg.toJSON(), sender });
        } catch (err) {
            res.status(500).json({ error: 'Failed to post order message' });
        }
    },

    // Driver uploads photo -> system sends a message prompting user
    async uploadDeliveryPhoto(req, res) {
        try {
            const { id } = req.params;
            const senderId = req.user.userId;

            if (!req.file) return res.status(400).json({ error: 'Photo is required' });

            const order = await Order.findByPk(id);
            if (!order) return res.status(404).json({ error: 'Order not found' });

            if (order.status !== 'delivering') {
                return res.status(400).json({ error: 'Order must be delivering' });
            }

            const imageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

            // Create standard image message
            await ChatMessage.create({
                orderId: id,
                senderId,
                text: '📸 Yetkazib berildi! Rasmga qarang.',
                imageUrl
            });

            // Create System Action message for User
            await ChatMessage.create({
                orderId: id,
                senderId, // Driver sends it, but it's a prompt
                text: 'Buyurtma oldingizni tasdiqlaysizmi?',
                isSystem: true,
                offerAction: 'confirm_delivery_prompt'
            });

            res.status(200).json({ message: 'Photo uploaded and prompt sent' });
        } catch (err) {
            res.status(500).json({ error: 'Failed to upload photo' });
        }
    },

    // User confirms delivery -> pay driver -> clear chat -> complete order
    async confirmDelivery(req, res) {
        const trans = await sequelize.transaction();
        try {
            const { id } = req.params;
            const order = await Order.findByPk(id, { transaction: trans });

            if (!order || order.status !== 'delivering') {
                await trans.rollback();
                return res.status(400).json({ error: 'Invalid order state' });
            }

            // Pay the driver (Add early driver earnings into driver wallet if needed, but for now we'll just set order status)
            order.status = 'completed';
            order.completedAt = new Date();

            // Driver earning logic (e.g. 80% of delivery fee)
            order.deliveryManEarning = Math.floor(order.deliveryFee * 0.8);
            await order.save({ transaction: trans });

            // Pay Driver Wallet
            if (order.deliveryManId) {
                const driver = await User.findByPk(order.deliveryManId, { transaction: trans });
                if (driver) {
                    driver.walletBalance = (driver.walletBalance || 0) + order.deliveryManEarning;
                    await driver.save({ transaction: trans });
                }
            }

            // Clear the order chat
            await ChatMessage.destroy({
                where: { orderId: id },
                transaction: trans
            });

            await trans.commit();

            // Notify Admin
            const bot = getBot();
            const adminId = process.env.ADMIN_CHAT_ID;
            if (bot && adminId) {
                bot.sendMessage(adminId, `✅ <b>Buyurtma yakunlandi!</b> (#${order.id.toString().slice(0, 8)})\n\nMijoz tasdiqladi. Haydovchiga to'landi: ${order.deliveryManEarning} ₩`, { parse_mode: 'HTML' });
            }

            res.json({ message: 'Delivery confirmed and chat closed' });
        } catch (err) {
            await trans.rollback();
            console.error(err);
            res.status(500).json({ error: 'Failed to confirm delivery' });
        }
    }
};

module.exports = orderController;
