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
            const { items, totalAmount, deliveryFee, distance, deliveryType, meetupLocation, giftInfo } = req.body;
            const userId = req.user.userId;
            const paymentMethod = 'wallet'; // Wallet-only enforcement

            if (!items || items.length === 0) {
                return res.status(400).json({ error: 'Cart is empty' });
            }

            // 2km radius enforcement — beyond 2km only pickup allowed
            if (distance > 2 && deliveryType !== 'pickup') {
                await trans.rollback();
                return res.status(400).json({ error: '2km dan uzoq manzilga faqat olib ketish (pick up) mumkin' });
            }

            // 1. Wallet balance check — deduct first
            const userRecord = await User.findByPk(userId, { transaction: trans });
            if (!userRecord || userRecord.walletBalance < totalAmount) {
                await trans.rollback();
                return res.status(400).json({ error: 'Hamyonda mablag\' yetarli emas. Iltimos to\'ldiring.' });
            }
            userRecord.walletBalance -= totalAmount;
            await userRecord.save({ transaction: trans });

            // 2. Create Order
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

            await trans.commit();

            // Ensure we have user details for the message
            let user = await User.findByPk(userId);

            // 3. Send Telegram Notifications (Post-transaction)
            const bot = getBot();
            const adminId = process.env.ADMIN_CHAT_ID;
            const channelId = process.env.ORDERS_CHANNEL_ID;

            const orderDetails = items.map(item => {
                let line = `- ${item.productName || 'Taom'} x ${item.quantity}`;
                if (item.extras && item.extras.length > 0) {
                    const extraNames = item.extras.map(e => e.name).join(', ');
                    line += ` (➕ ${extraNames})`;
                }
                return line;
            }).join('\n');
            let deliveryText = `🚚 <b>Yetkazib berish (Uyga):</b> ${deliveryFee} ₩`;
            if (deliveryType === 'pickup') deliveryText = `🚶 <b>Olib ketish (Pick up)</b> (-1000 ₩ chegirma)`;
            if (deliveryType === 'meetup') deliveryText = `📍 <b>Uchrashuv hududi (Meet up):</b> ${meetupLocation}`;

            let giftText = '';
            if (giftInfo?.isGift) {
                giftText = `\n🎁 <b>SOVG'A:</b> Kimga: ${giftInfo.toUserId} | Anonim: ${giftInfo.isAnonymous ? 'Ha' : 'Yoq'}`;
            }

            const paymentText = paymentMethod === 'wallet'
                ? '💳 Hamyondan yechildi (Deposit)'
                : '💵 Naqd pul (Cash)';

            const message = `
🛍 <b>Yangi Buyurtma!</b> (#${order.id.toString().slice(0, 8)})

👤 <b>Mijoz:</b> ${user ? user.firstName : 'Noma\'lum'}
📞 <b>Tel:</b> ${user ? user.phone : 'Noma\'lum'}
📍 <b>Manzil:</b> ${user ? user.address : 'Noma\'lum'}
📍 <b>Mijoz/Uchrashuv masofasi:</b> ${distance} km

💰 <b>Jami to'lov:</b> ${totalAmount} ₩ (Maxsulotlar + yo'lkira yig'indisi)
${deliveryText}${giftText}
To'lov turi: <b>${paymentText}</b>

<b>Savat:</b>
${orderDetails}
`;

            const inlineKeyboard = {
                inline_keyboard: [
                    [
                        { text: "✅ Tasdiqlash", callback_data: `accept_order_${order.id}` },
                        { text: "❌ Rad etish", callback_data: `reject_order_${order.id}` }
                    ]
                ]
            };

            if (bot) {
                if (adminId) bot.sendMessage(adminId, message, { parse_mode: 'HTML', reply_markup: inlineKeyboard });
                if (channelId) bot.sendMessage(channelId, message, { parse_mode: 'HTML', reply_markup: inlineKeyboard });
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

    // Live Tracking & Smart Queue logic
    async getTracking(req, res) {
        try {
            const { id } = req.params;
            const order = await Order.findByPk(id);
            if (!order) return res.status(404).json({ error: 'Order not found' });

            let queuePosition = 0;
            let driverLocation = null;
            let driverPhone = null;

            if (order.deliveryManId && order.status === 'delivering') {
                // Get driver location from memory
                const { driverLocations } = require('./deliveryController');
                driverLocation = driverLocations[order.deliveryManId] || null;

                // Get driver details
                const driver = await User.findByPk(order.deliveryManId, { attributes: ['phone', 'firstName'] });
                if (driver) driverPhone = driver.phone;

                // Determine Queue Position:
                // Find all active orders for this driver sorted by distance
                const activeOrders = await Order.findAll({
                    where: { deliveryManId: order.deliveryManId, status: 'delivering' },
                    order: [['distance', 'ASC']],
                    attributes: ['id']
                });

                const index = activeOrders.findIndex(o => o.id === order.id);
                // If it's the first one, position is 0 (Next). If second, position is 1.
                queuePosition = index !== -1 ? index : 0;
            }

            res.json({
                order,
                queuePosition,
                driverLocation,
                driverPhone
            });
        } catch (error) {
            console.error('Tracking Error:', error);
            res.status(500).json({ error: 'Failed to fetch tracking data' });
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
                text: 'Buyurtma oldingizni tasdiqlaysizmi? (Iltimos, baholang)',
                isSystem: true,
                offerAction: 'confirm_delivery_prompt'
            });

            // Transition state
            order.status = 'delivered_awaiting_review';
            order.deliveryPhotoUrl = imageUrl;
            await order.save();

            res.status(200).json({ message: 'Photo uploaded and prompt sent', order });
        } catch (err) {
            res.status(500).json({ error: 'Failed to upload photo' });
        }
    },

    // User confirms delivery -> pay driver -> clear chat -> complete order
    async confirmDelivery(req, res) {
        const trans = await sequelize.transaction();
        try {
            const { id } = req.params;
            const { rating, reviewText } = req.body || {};
            const order = await Order.findByPk(id, { transaction: trans });

            if (!order || (order.status !== 'delivering' && order.status !== 'delivered_awaiting_review')) {
                await trans.rollback();
                return res.status(400).json({ error: 'Invalid order state' });
            }

            // Pay the driver
            order.status = 'completed';
            order.completedAt = new Date();

            // Apply rating
            if (rating) order.rating = rating;
            if (reviewText) order.reviewText = reviewText;

            // Driver earning logic 
            // If already set by deliveryController, keep it. Else calculate.
            if (!order.deliveryManEarning) {
                order.deliveryManEarning = Math.floor(order.deliveryFee * 0.8) || 3000;
            }
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
                bot.sendMessage(adminId, `✅ <b>Buyurtma yakunlandi!</b> (#${order.id.toString().slice(0, 8)})\n\nMijoz tasdiqladi. Baho: ${rating ? '⭐'.repeat(rating) : 'yoq'}\nHaydovchiga to'landi: ${order.deliveryManEarning} ₩`, { parse_mode: 'HTML' });
            }

            res.json({ message: 'Delivery confirmed and chat closed', order });
        } catch (err) {
            await trans.rollback();
            console.error(err);
            res.status(500).json({ error: 'Failed to confirm delivery' });
        }
    },

    // Notify user that driver is nearby (within 300m)
    async notifyNearby(req, res) {
        try {
            const orderId = req.params.id;
            const order = await Order.findByPk(orderId, { include: [{ model: User, as: 'user' }] });
            if (!order) return res.status(404).json({ error: 'Order not found' });

            const bot = getBot();
            if (bot && order.user?.telegramId) {
                const miniAppUrl = process.env.MINI_APP_URL || 'https://muslimnamja-production.up.railway.app';
                await bot.sendMessage(order.user.telegramId,
                    `🎉 Kuryer yaqinlashdi! Taomingiz tez orada yetib keladi.\n\n📍 Kuryer 300m ichida!`,
                    {
                        reply_markup: {
                            inline_keyboard: [[
                                { text: '📍 Kuzatish', web_app: { url: `${miniAppUrl}?startapp=tracking` } }
                            ]]
                        }
                    }
                ).catch(console.error);
            }

            res.json({ success: true });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to notify' });
        }
    }
};

module.exports = orderController;
