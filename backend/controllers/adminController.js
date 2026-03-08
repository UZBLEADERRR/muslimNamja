const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');

// Default seed data for initial menu
const SEED_PRODUCTS = [
    { name: { en: "Osh (Plov)", ko: "우즈벡 필라프", uz: "Osh", ru: "Плов" }, description: { en: "Traditional Uzbek pilaf with lamb & carrots", ko: "양고기와 당근을 넣은 우즈벡 필라프", uz: "Qo'y go'shti va sabzi bilan o'zbek oshi", ru: "Узбекский плов с бараниной и морковью" }, price: 8900, category: "uzbek", imageUrl: "🍚", ingredients: [{ name: "Meat", cost: 3000 }, { name: "Rice", cost: 1500 }, { name: "Spices", cost: 500 }], ingredientCost: 5000 },
    { name: { en: "Samsa", ko: "삼사", uz: "Somsa", ru: "Самса" }, description: { en: "Crispy pastry with meat & onions", ko: "고기와 양파를 넣은 바삭한 페이스트리", uz: "Go'sht va piyozli qarsildoq pishiriq", ru: "Хрустящая выпечка с мясом и луком" }, price: 3500, category: "uzbek", imageUrl: "🥟", ingredients: [{ name: "Dough", cost: 500 }, { name: "Meat", cost: 1500 }], ingredientCost: 2000 },
    { name: { en: "Manti", ko: "만티", uz: "Manti", ru: "Манты" }, description: { en: "Steamed dumplings with beef & onion", ko: "쇠고기와 양파를 넣은 찐 만두", uz: "Mol go'shti va piyoz bilan bug'da pishirilgan", ru: "Паровые пельмени с говядиной и луком" }, price: 7500, category: "uzbek", imageUrl: "🥠", ingredients: [{ name: "Dough", cost: 500 }, { name: "Beef", cost: 2500 }], ingredientCost: 3000 },
    { name: { en: "Tteokbokki", ko: "떡볶이", uz: "Tteokbokki", ru: "Токпокки" }, description: { en: "Spicy rice cakes in gochujang sauce", ko: "고추장 소스의 매운 떡볶이", uz: "Gochujang sousidagi achchiq guruch keklari", ru: "Острые рисовые лепёшки в соусе кочуджан" }, price: 6500, category: "korean", imageUrl: "🌶️", ingredients: [{ name: "Rice cakes", cost: 1500 }, { name: "Sauce", cost: 800 }], ingredientCost: 2300 },
    { name: { en: "Bibimbap", ko: "비빔밥", uz: "Bibimbap", ru: "Пибимпап" }, description: { en: "Mixed rice bowl with vegetables & egg", ko: "야채와 달걀을 넣은 비빔밥", uz: "Sabzavot va tuxumli aralash guruch", ru: "Рис с овощами и яйцом" }, price: 7900, category: "korean", imageUrl: "🥗", ingredients: [{ name: "Rice", cost: 800 }, { name: "Vegetables", cost: 1200 }, { name: "Egg", cost: 300 }], ingredientCost: 2300 },
    { name: { en: "Burger Combo", ko: "버거 콤보", uz: "Burger Combo", ru: "Бургер Комбо" }, description: { en: "Double patty + fries + cola", ko: "더블 패티 + 감자튀김 + 콜라", uz: "Ikki qavatli kotlet + fri + kola", ru: "Двойной бургер + картофель фри + кола" }, price: 9500, category: "fastfood", imageUrl: "🍔", ingredients: [{ name: "Buns", cost: 500 }, { name: "Patty", cost: 2000 }, { name: "Fries", cost: 800 }], ingredientCost: 3300 },
    { name: { en: "Boba Tea", ko: "버블티", uz: "Boba Choyi", ru: "Бабл Ти" }, description: { en: "Brown sugar milk tea with tapioca", ko: "흑설탕 밀크티와 타피오카", uz: "Tapioka bilan jigarrang shakar sutli choy", ru: "Молочный чай с тапиокой" }, price: 4500, category: "drinks", imageUrl: "🧋", ingredients: [{ name: "Tea", cost: 300 }, { name: "Tapioca", cost: 500 }, { name: "Milk", cost: 400 }], ingredientCost: 1200 },
    { name: { en: "Hotteok", ko: "호떡", uz: "Hotteok", ru: "Хотток" }, description: { en: "Sweet pancake filled with brown sugar", ko: "흑설탕을 넣은 달콤한 팬케이크", uz: "Jigarrang shakar bilan to'ldirilgan shirin quymoq", ru: "Сладкий блинчик с коричневым сахаром" }, price: 2000, category: "desserts", imageUrl: "🥞", ingredients: [{ name: "Dough", cost: 300 }, { name: "Sugar", cost: 200 }], ingredientCost: 500 },
];

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

    async deleteProduct(req, res) {
        try {
            await Product.destroy({ where: { id: req.params.id } });
            res.json({ message: 'Product deleted' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete product' });
        }
    },

    async getAllProducts(req, res) {
        try {
            const products = await Product.findAll({ order: [['createdAt', 'DESC']] });
            res.json(products);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch products' });
        }
    },

    // --- Order Management ---
    async getAllOrders(req, res) {
        try {
            const orders = await Order.findAll({ order: [['createdAt', 'DESC']], limit: 50 });
            const stats = {
                total: await Order.count(),
                pending: await Order.count({ where: { status: 'pending' } }),
                preparing: await Order.count({ where: { status: 'preparing' } }),
                delivering: await Order.count({ where: { status: 'delivering' } }),
                completed: await Order.count({ where: { status: 'completed' } }),
            };
            res.json({ orders, stats });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch orders' });
        }
    },

    async updateOrderStatus(req, res) {
        try {
            const { status } = req.body;
            const [count, updated] = await Order.update(
                { status },
                { where: { id: req.params.id }, returning: true }
            );
            if (count === 0) return res.status(404).json({ error: 'Order not found' });
            res.json(updated[0]);
        } catch (error) {
            res.status(500).json({ error: 'Failed to update order' });
        }
    },

    // --- User Management ---
    async getAllUsers(req, res) {
        try {
            const users = await User.findAll({
                attributes: ['id', 'firstName', 'lastName', 'username', 'phone', 'role', 'walletBalance', 'distanceFromRestaurant', 'createdAt'],
                order: [['createdAt', 'DESC']]
            });
            res.json({ users, total: users.length });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch users' });
        }
    },

    // --- Role Management ---
    async setRole(req, res) {
        try {
            const { userId, role } = req.body;
            if (!['user', 'admin', 'delivery'].includes(role)) {
                return res.status(400).json({ error: 'Invalid role' });
            }
            const [count, users] = await User.update({ role }, {
                where: { id: userId },
                returning: true
            });
            if (count === 0) return res.status(404).json({ error: 'User not found' });
            res.json(users[0]);
        } catch (error) {
            res.status(500).json({ error: 'Failed to update role' });
        }
    },

    // --- Seed Products ---
    async seedProducts(req, res) {
        try {
            const existing = await Product.count();
            if (existing > 0) {
                return res.status(400).json({ error: `Menu already has ${existing} products. Delete them first or skip seeding.` });
            }
            const created = await Product.bulkCreate(SEED_PRODUCTS);
            res.status(201).json({ message: `${created.length} products seeded successfully!`, products: created });
        } catch (error) {
            console.error('Seed error:', error);
            res.status(500).json({ error: 'Failed to seed products' });
        }
    },

    // --- AI Profit Analysis ---
    async getProfitAnalysis(req, res) {
        try {
            const completedOrders = await Order.findAll({ where: { status: 'completed' } });

            let totalRevenue = 0;
            let totalIngredientCost = 0;
            let totalDeliveryPay = 0;

            const productIds = new Set();
            completedOrders.forEach(order => {
                if (order.items) {
                    order.items.forEach(item => {
                        if (item.productId) productIds.add(item.productId);
                    });
                }
            });

            const products = productIds.size > 0
                ? await Product.findAll({ where: { id: Array.from(productIds) } })
                : [];
            const productMap = products.reduce((acc, p) => { acc[p.id] = p; return acc; }, {});

            completedOrders.forEach(order => {
                totalRevenue += order.totalAmount || 0;
                totalDeliveryPay += order.deliveryManEarning || 0;

                if (order.items) {
                    order.items.forEach(item => {
                        const product = productMap[item.productId];
                        if (product && product.ingredients) {
                            const prodCost = product.ingredients.reduce((sum, ing) => sum + (ing.cost || 0), 0);
                            totalIngredientCost += (prodCost * (item.quantity || 1));
                        }
                    });
                }
            });

            const netProfit = totalRevenue - totalIngredientCost - totalDeliveryPay;

            // AI Summary
            let aiSummary = `Jami daromad: ${totalRevenue.toLocaleString()}₩. Xarajatlar: ${(totalIngredientCost + totalDeliveryPay).toLocaleString()}₩. Sof foyda: ${netProfit.toLocaleString()}₩.`;

            try {
                const { GoogleGenerativeAI } = require('@google/generative-ai');
                const apiKey = process.env.AI_API_KEY;
                if (apiKey) {
                    const genAI = new GoogleGenerativeAI(apiKey);
                    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
                    const prompt = `You are a business analyst for a food delivery startup called Muslim Namja near Sejong University, Seoul. Analyze these numbers and give a brief 2-3 sentence summary in Uzbek language:
                    Total Revenue: ${totalRevenue}₩
                    Ingredient Cost: ${totalIngredientCost}₩  
                    Delivery Pay: ${totalDeliveryPay}₩
                    Net Profit: ${netProfit}₩
                    Total Orders: ${completedOrders.length}`;
                    const result = await model.generateContent(prompt);
                    aiSummary = result.response.text().trim();
                }
            } catch (aiErr) {
                console.error('AI Summary error (non-critical):', aiErr.message);
            }

            res.json({ totalRevenue, totalIngredientCost, totalDeliveryPay, netProfit, aiSummary });
        } catch (error) {
            console.error('Profit Analysis error:', error);
            res.status(500).json({ error: 'Profit analysis failed' });
        }
    }
};

module.exports = adminController;
