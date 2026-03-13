const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const { Op } = require('sequelize');
const { getBot } = require('../utils/globals');
const { calculateDistance } = require('../utils/distance');

// In-memory store for driver locations. In production, use Redis.
const driverLocations = {};

const deliveryController = {
    // Get available orders
    async getAvailableOrders(req, res) {
        try {
            const orders = await Order.findAll({
                where: { 
                    status: { [Op.in]: ['accepted', 'preparing', 'ready_for_pickup'] }, 
                    deliveryManId: null 
                }
            });

            const populatedOrders = await Promise.all(orders.map(async (order) => {
                const user = await User.findByPk(order.userId, { attributes: ['location', 'address', 'distanceFromRestaurant'] });
                const productIds = order.items.map(item => item.productId);
                const products = await Product.findAll({ where: { id: productIds }, attributes: ['id', 'name', 'category'] });
                const productMap = products.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
                const itemsWithProduct = order.items.map(item => ({ ...item, product: productMap[item.productId] }));

                return { ...order.toJSON(), user, items: itemsWithProduct };
            }));

            res.json(populatedOrders);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to fetch available orders' });
        }
    },

    // Get active orders (supports multiple for smart routing)
    async getActiveOrder(req, res) {
        try {
            const deliveryManId = req.user.userId;
            const orders = await Order.findAll({
                where: { deliveryManId, status: { [Op.in]: ['ready_for_pickup', 'delivering', 'delivered_awaiting_review'] } },
                order: [['distance', 'ASC']] // Smart routing: Nearest first
            });

            if (!orders.length) return res.json(null);

            // Populate user details
            const populated = await Promise.all(orders.map(async (o) => {
                const user = await User.findByPk(o.userId, { attributes: ['id', 'location', 'address', 'phone', 'firstName'] });
                return { ...o.toJSON(), user };
            }));

            // Return array of active orders or just the first one depending on frontend needs. 
            // We'll return an array so frontend can see the queue.
            res.json(populated);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch active orders' });
        }
    },

    async getStats(req, res) {
        try {
            const deliveryManId = req.user.userId;
            const orders = await Order.findAll({
                where: { deliveryManId, status: ['completed', 'delivered_awaiting_review'] },
                attributes: ['distance', 'deliveryManEarning']
            });

            const totalDeliveries = orders.length;
            const totalDistance = orders.reduce((sum, o) => sum + (o.distance || 0), 0);
            const totalEarnings = orders.reduce((sum, o) => sum + (o.deliveryManEarning || 0), 0);

            res.json({ totalDeliveries, totalDistance, totalEarnings });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch delivery stats' });
        }
    },

    async acceptOrder(req, res) {
        try {
            const { orderId } = req.params;
            const deliveryManId = req.user.userId;

            const [count, orders] = await Order.update(
                { status: 'delivering', deliveryManId: deliveryManId },
                { where: { id: orderId, status: { [Op.in]: ['accepted', 'preparing', 'ready_for_pickup'] }, deliveryManId: null }, returning: true }
            );

            if (count === 0) return res.status(400).json({ error: 'Order not available' });

            res.json({ message: 'Order accepted', order: orders[0] });
        } catch (error) {
            res.status(500).json({ error: 'Failed to accept order' });
        }
    },

    async completeOrder(req, res) {
        try {
            const { orderId } = req.params;
            const deliveryManId = req.user.userId;

            const order = await Order.findOne({ where: { id: orderId, deliveryManId: deliveryManId, status: 'delivering' } });
            if (!order) return res.status(404).json({ error: 'Order not found or invalid status' });

            const earning = 3000 + (order.distance * 500);

            order.status = 'delivered_awaiting_review';
            order.completedAt = new Date();
            order.deliveryManEarning = earning;

            if (req.file) {
                // If the app is using multer, the file is saved locally to /uploads or proxy.
                order.deliveryPhotoUrl = `/uploads/${req.file.filename}`;
            }

            await order.save();

            // Add earning to driver's wallet (assuming it happens immediately, but typically after review. We will do it now).
            const driver = await User.findByPk(deliveryManId);
            if (driver) {
                driver.walletBalance = (driver.walletBalance || 0) + earning;
                await driver.save();
            }

            res.json({ message: 'Order delivered, awaiting user review', order, earning });
        } catch (error) {
            res.status(500).json({ error: 'Failed to complete order' });
        }
    },

    // --- NEW: Live Location & Call Features ---

    // Update driver's live location
    async updateLocation(req, res) {
        try {
            const deliveryManId = req.user.userId;
            const { lat, lng, orderId } = req.body;

            if (lat !== undefined && lng !== undefined) {
                driverLocations[deliveryManId] = { lat, lng, timestamp: Date.now() };
            }
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: 'Location update failed' });
        }
    },

    // Get live location of driver for a specific order
    async getOrderLocation(req, res) {
        try {
            const { orderId } = req.params;
            const order = await Order.findByPk(orderId);
            if (!order || !order.deliveryManId) return res.json(null);

            const loc = driverLocations[order.deliveryManId];
            if (loc) {
                return res.json({ lat: loc.lat, lng: loc.lng });
            }
            res.json(null);
        } catch (err) {
            res.status(500).json({ error: 'Failed to get location' });
        }
    },

    // Driver presses "Call User" -> sends Telegram Bot notification to User
    async callUser(req, res) {
        try {
            const { orderId } = req.params;
            const deliveryManId = req.user.userId;

            const order = await Order.findOne({ where: { id: orderId, deliveryManId, status: 'delivering' } });
            if (!order) return res.status(404).json({ error: 'Order not found' });

            const customer = await User.findByPk(order.userId);
            if (!customer || !customer.telegramId) return res.status(400).json({ error: 'User does not have Telegram connected' });

            const driver = await User.findByPk(deliveryManId);
            const bot = getBot();

            if (bot) {
                const appUrl = process.env.APP_URL || 'https://t.me/MuslimNamjaBot/app';
                // We pass query params or generic link to open the app. Inside app, user navigates to orders.
                const inlineKeyboard = {
                    inline_keyboard: [
                        [{ text: "📞 Javob berish (Ilovada)", web_app: { url: `${appUrl}?orderId=${orderId}` } }]
                    ]
                };

                await bot.sendMessage(customer.telegramId, `🔴 <b>Kuryer (${driver.firstName}) sizga qo'ng'iroq qilmoqda!</b>\n\nIltimos, ilovaga kirib xat yoki lokatsiyani tekshiring.`, {
                    parse_mode: 'HTML',
                    reply_markup: inlineKeyboard
                });
                return res.json({ message: 'Notification sent to user!' });
            } else {
                return res.status(500).json({ error: 'Bot is not configured' });
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to call user' });
        }
    }
};

// Export locations so order tracking can access it
module.exports = { deliveryController, driverLocations };
