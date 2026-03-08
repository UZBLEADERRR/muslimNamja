const Order = require('../models/Order');

const deliveryController = {
    // --- Delivery Endpoints ---
    async getAvailableOrders(req, res) {
        try {
            // Find orders that are 'preparing' and not assigned
            const orders = await Order.find({ status: 'preparing', deliveryMan: null })
                .populate('user', 'location address distance')
                .populate('items.product', 'name category');
            res.json(orders);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch available orders' });
        }
    },

    async acceptOrder(req, res) {
        try {
            const { orderId } = req.params;
            const deliveryManId = req.user.userId;

            const order = await Order.findOneAndUpdate(
                { _id: orderId, status: 'preparing', deliveryMan: null },
                { status: 'delivering', deliveryMan: deliveryManId },
                { new: true }
            );

            if (!order) {
                return res.status(400).json({ error: 'Order not available' });
            }

            res.json({ message: 'Order accepted', order });
        } catch (error) {
            res.status(500).json({ error: 'Failed to accept order' });
        }
    },

    async completeOrder(req, res) {
        try {
            const { orderId } = req.params;
            const deliveryManId = req.user.userId;

            // Finish order and compute delivery earning (mock calculation: base fee + distance fee)
            const order = await Order.findOne({ _id: orderId, deliveryMan: deliveryManId, status: 'delivering' });

            if (!order) {
                return res.status(404).json({ error: 'Order not found or invalid status' });
            }

            const earning = 3000 + (order.distance * 500); // 3000 won base + 500 won per km

            order.status = 'completed';
            order.completedAt = new Date();
            order.deliveryManEarning = earning;
            await order.save();

            // We should also add this to delivery man's wallet (or just record it as owed by system)

            res.json({ message: 'Order completed', order, earning });
        } catch (error) {
            res.status(500).json({ error: 'Failed to complete order' });
        }
    }
};

module.exports = deliveryController;
