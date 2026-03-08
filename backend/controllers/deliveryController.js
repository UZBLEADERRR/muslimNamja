const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const { Op } = require('sequelize');

const deliveryController = {
    // --- Delivery Endpoints ---
    async getAvailableOrders(req, res) {
        try {
            // Find orders that are 'preparing' and not assigned
            const orders = await Order.findAll({
                where: { status: 'preparing', deliveryManId: null }
            });

            // Populate User and Items' Products (items is JSONB)
            const populatedOrders = await Promise.all(orders.map(async (order) => {
                const user = await User.findByPk(order.userId, { attributes: ['location', 'address', 'distanceFromRestaurant'] });

                // Fetch products for items in JSONB
                const productIds = order.items.map(item => item.productId);
                const products = await Product.findAll({ where: { id: productIds }, attributes: ['id', 'name', 'category'] });
                const productMap = products.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});

                const itemsWithProduct = order.items.map(item => ({
                    ...item,
                    product: productMap[item.productId]
                }));

                return {
                    ...order.toJSON(),
                    user,
                    items: itemsWithProduct
                };
            }));

            res.json(populatedOrders);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to fetch available orders' });
        }
    },

    async acceptOrder(req, res) {
        try {
            const { orderId } = req.params;
            const deliveryManId = req.user.userId;

            const [count, orders] = await Order.update(
                { status: 'delivering', deliveryManId: deliveryManId },
                {
                    where: { id: orderId, status: 'preparing', deliveryManId: null },
                    returning: true
                }
            );

            if (count === 0) {
                return res.status(400).json({ error: 'Order not available' });
            }

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

            if (!order) {
                return res.status(404).json({ error: 'Order not found or invalid status' });
            }

            const earning = 3000 + (order.distance * 500);

            order.status = 'completed';
            order.completedAt = new Date();
            order.deliveryManEarning = earning;
            await order.save();

            res.json({ message: 'Order completed', order, earning });
        } catch (error) {
            res.status(500).json({ error: 'Failed to complete order' });
        }
    }
};

module.exports = deliveryController;
