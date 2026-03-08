const Product = require('../models/Product');
const User = require('../models/User');

const adminController = {
    // --- Product Management ---
    async addProduct(req, res) {
        try {
            const product = await Product.create(req.body);
            res.status(201).json(product);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to add product' });
        }
    },

    async updateProduct(req, res) {
        try {
            const product = await Product.update(req.body, {
                where: { id: req.params.id },
                returning: true
            });
            res.json(product[1][0]);
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

            const user = await User.update({ role }, {
                where: { id: userId },
                returning: true
            });
            res.json(user[1][0]);
        } catch (error) {
            res.status(500).json({ error: 'Failed to update role' });
        }
    },

    // --- AI Profit Analysis ---
    async getProfitAnalysis(req, res) {
        try {
            const Order = require('../models/Order');

            // Fetch all completed orders
            const completedOrders = await Order.findAll({ where: { status: 'completed' } });

            let totalRevenue = 0;
            let totalIngredientCost = 0;
            let totalDeliveryPay = 0;

            // To avoid N+1, gather all unique product IDs
            const productIds = new Set();
            completedOrders.forEach(order => {
                order.items.forEach(item => {
                    if (item.productId) productIds.add(item.productId);
                });
            });

            // Fetch all relevant products
            const products = await Product.findAll({
                where: { id: Array.from(productIds) }
            });
            const productMap = products.reduce((acc, p) => {
                acc[p.id] = p;
                return acc;
            }, {});

            completedOrders.forEach(order => {
                totalRevenue += order.totalAmount;
                totalDeliveryPay += order.deliveryManEarning || 0;

                order.items.forEach(item => {
                    const product = productMap[item.productId];
                    if (product && product.ingredients) {
                        const prodCost = product.ingredients.reduce((sum, ing) => sum + (ing.cost || 0), 0);
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
