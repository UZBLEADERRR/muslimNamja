const Product = require('../models/Product');
const User = require('../models/User');

const adminController = {
    // --- Product Management ---
    async addProduct(req, res) {
        try {
            const product = new Product(req.body);
            await product.save();
            res.status(201).json(product);
        } catch (error) {
            res.status(500).json({ error: 'Failed to add product' });
        }
    },

    async updateProduct(req, res) {
        try {
            const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
            res.json(product);
        } catch (error) {
            res.status(500).json({ error: 'Failed to update product' });
        }
    },

    // --- Role Management ---
    async setRole(req, res) {
        try {
            const { userId, role } = req.body;
            if (!['user', 'admin', 'delivery'].includes(role)) {
                return res.status(400).json({ error: 'Invalid role' });
            }

            const user = await User.findByIdAndUpdate(userId, { role }, { new: true });
            res.json(user);
        } catch (error) {
            res.status(500).json({ error: 'Failed to update role' });
        }
    },

    // --- AI Profit Analysis (Requested by user) ---
    async getProfitAnalysis(req, res) {
        try {
            const Order = require('../models/Order');

            // Fetch all completed orders
            const completedOrders = await Order.find({ status: 'completed' }).populate('items.product');

            let totalRevenue = 0;
            let totalIngredientCost = 0;
            let totalDeliveryPay = 0;

            completedOrders.forEach(order => {
                totalRevenue += order.totalAmount;
                totalDeliveryPay += order.deliveryManEarning || 0;

                order.items.forEach(item => {
                    if (item.product && item.product.ingredients) {
                        const prodCost = item.product.ingredients.reduce((sum, ing) => sum + (ing.cost || 0), 0);
                        totalIngredientCost += (prodCost * item.quantity);
                    }
                });
            });

            const netProfit = totalRevenue - totalIngredientCost - totalDeliveryPay;

            res.json({
                totalRevenue,
                totalIngredientCost,
                totalDeliveryPay,
                netProfit,
                aiSummary: `Total revenue: ${totalRevenue}₩, Expenses: ${totalIngredientCost + totalDeliveryPay}₩, Net Profit: ${netProfit}₩.`
            });

        } catch (error) {
            console.error('Profit Analysis error:', error);
            res.status(500).json({ error: 'Profit analysis failed' });
        }
    }
};

module.exports = adminController;
