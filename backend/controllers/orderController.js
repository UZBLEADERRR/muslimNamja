const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const { getBot } = require('../utils/globals');
const sequelize = require('../config/database');

const orderController = {
    async createOrder(req, res) {
        const trans = await sequelize.transaction();
        try {
            const { items, paymentMethod, totalAmount, deliveryFee, distance } = req.body;
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
            const message = `
🛍 <b>Yangi Buyurtma!</b> (#${order.id.toString().slice(0, 8)})

👤 <b>Mijoz ID:</b> ${userId.toString().slice(0, 8)}
💰 <b>Jami:</b> ${totalAmount} ₩
🚚 <b>Yetkazib berish:</b> ${deliveryFee} ₩
📍 <b>Masofa:</b> ${distance} km

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
    }
};

module.exports = orderController;
