const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const Expense = require('../models/Expense');
const PaymentRequest = require('../models/PaymentRequest');
const SystemSetting = require('../models/SystemSetting');
const { Op } = require('sequelize');
const { getBot } = require('../utils/globals');

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
            const { name, description, price, category, stock, minOrderQuantity, ingredientCost } = req.body;

            // Build product payload
            const payload = {
                name: typeof name === 'string' ? JSON.parse(name) : name,
                description: typeof description === 'string' ? JSON.parse(description) : description,
                price: parseInt(price),
                category,
                stock: stock !== undefined && stock !== '' && stock !== 'null' ? parseInt(stock) : null,
                minOrderQuantity: parseInt(minOrderQuantity) || 1,
                ingredientCost: parseInt(ingredientCost) || 0
            };

            // Handle image upload
            if (req.file) {
                const base64Image = req.file.buffer.toString('base64');
                payload.imageUrl = `data:${req.file.mimetype};base64,${base64Image}`;
            } else if (req.body.imageUrl) {
                payload.imageUrl = req.body.imageUrl;
            }

            const product = await Product.create(payload);
            res.status(201).json(product);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to add product' });
        }
    },

    async updateProduct(req, res) {
        try {
            const { name, description, price, category, stock, minOrderQuantity, ingredientCost, isActive } = req.body;

            const payload = {};
            if (name) payload.name = typeof name === 'string' ? JSON.parse(name) : name;
            if (description) payload.description = typeof description === 'string' ? JSON.parse(description) : description;
            if (price) payload.price = parseInt(price);
            if (category) payload.category = category;
            if (stock !== undefined) payload.stock = stock === 'null' || stock === '' ? null : parseInt(stock);
            if (minOrderQuantity) payload.minOrderQuantity = parseInt(minOrderQuantity);
            if (ingredientCost) payload.ingredientCost = parseInt(ingredientCost);
            if (isActive !== undefined) payload.isActive = isActive === 'true' || isActive === true;

            if (req.file) {
                const base64Image = req.file.buffer.toString('base64');
                payload.imageUrl = `data:${req.file.mimetype};base64,${base64Image}`;
            } else if (req.body.imageUrl === 'null' || req.body.imageUrl === '') {
                // Allows clearing the image
                payload.imageUrl = null;
            }

            const product = await Product.update(payload, {
                where: { id: req.params.id },
                returning: true
            });
            res.json(product[1][0]);
        } catch (error) {
            console.error(error);
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
    // --- Top-Up Approvals ---
    async getPaymentRequests(req, res) {
        try {
            const requests = await PaymentRequest.findAll({
                include: [{ model: User, as: 'User', attributes: ['firstName', 'lastName', 'username'] }],
                order: [['createdAt', 'DESC']]
            });
            res.json(requests);
        } catch (error) {
            console.error('getPaymentRequests error:', error);
            res.status(500).json({ error: 'Failed to fetch payment requests' });
        }
    },

    async handlePaymentRequest(req, res) {
        try {
            const { id } = req.params;
            const { action } = req.body; // 'approve' or 'reject'

            const request = await PaymentRequest.findByPk(id);
            if (!request) return res.status(404).json({ error: 'Payment request not found' });
            if (request.status !== 'pending') return res.status(400).json({ error: 'Request already processed' });

            if (action === 'approve') {
                request.status = 'approved';
                const user = await User.findByPk(request.userId);
                if (user) {
                    user.walletBalance = (user.walletBalance || 0) + request.amount;
                    await user.save();
                }
            } else if (action === 'reject') {
                request.status = 'rejected';
            } else {
                return res.status(400).json({ error: 'Invalid action' });
            }

            await request.save();

            // Send telegram notification to user manually
            const bot = getBot();
            const user = await User.findByPk(request.userId);
            if (bot && user && user.telegramId) {
                const msg = action === 'approve'
                    ? `💰 <b>To'lov tasdiqlandi!</b>\n\nHamyoningizga ₩${request.amount.toLocaleString()} qabul qilindi.\nHozirgi balansingiz: ₩${user.walletBalance.toLocaleString()}`
                    : `❌ <b>To'lov rad etildi!</b>\n\nIltimos skrinshotni qayta tekshirib, boshqattan yuboring.`;
                bot.sendMessage(user.telegramId, msg, { parse_mode: 'HTML' }).catch(() => { });
            }

            res.json(request);
        } catch (error) {
            console.error('handlePaymentRequest error:', error);
            res.status(500).json({ error: 'Failed to process payment request' });
        }
    },

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
            let aiSummary = `Jami daromad: ${totalRevenue.toLocaleString()}₩. Zaruriy Xarajatlar: ${(totalIngredientCost + totalDeliveryPay).toLocaleString()}₩. Qolgan sof foyda (Kanselyariya va qo'shimcha xarajatlarsiz): ${netProfit.toLocaleString()}₩.`;

            // Merge true manual expenses
            const expenses = await Expense.findAll();
            const manualExpensesTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

            const finalNetProfit = netProfit - manualExpensesTotal;

            res.json({
                totalRevenue,
                totalIngredientCost,
                totalDeliveryPay,
                manualExpensesTotal,
                netProfit: finalNetProfit,
                aiSummary
            });
        } catch (error) {
            console.error('Profit Analysis error:', error);
            res.status(500).json({ error: 'Profit analysis failed' });
        }
    },

    // --- Expanded Finance & Demographic Stats ---
    async getFullStats(req, res) {
        try {
            const users = await User.findAll({ attributes: ['id', 'walletBalance', 'gender', 'createdAt'] });

            // Wallet Pool
            const totalWalletPool = users.reduce((sum, u) => sum + (u.walletBalance || 0), 0);

            // Gender Demographics
            let maleCount = 0;
            let femaleCount = 0;
            let unknownCount = 0;
            users.forEach(u => {
                if (u.gender === 'male') maleCount++;
                else if (u.gender === 'female') femaleCount++;
                else unknownCount++;
            });

            // Recent manual expenses
            const recentExpenses = await Expense.findAll({
                order: [['createdAt', 'DESC']],
                limit: 20
            });

            // Peak Hours: group orders by hour
            const allOrders = await Order.findAll({ attributes: ['createdAt', 'totalAmount'] });
            const hourCounts = Array(24).fill(0);
            const dailyRevenueMap = {};

            allOrders.forEach(o => {
                const d = new Date(o.createdAt);
                hourCounts[d.getHours()]++;

                // Daily revenue for last 7 days
                const dayKey = d.toISOString().split('T')[0];
                dailyRevenueMap[dayKey] = (dailyRevenueMap[dayKey] || 0) + (o.totalAmount || 0);
            });

            const peakHours = hourCounts.map((count, hour) => ({ hour: `${hour}:00`, count }));

            // Last 7 days revenue
            const today = new Date();
            const dailyRevenue = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(d.getDate() - i);
                const key = d.toISOString().split('T')[0];
                dailyRevenue.push({ date: key.substring(5), revenue: dailyRevenueMap[key] || 0 });
            }

            res.json({
                totalUsers: users.length,
                totalWalletPool,
                demographics: { male: maleCount, female: femaleCount, unknown: unknownCount },
                recentExpenses,
                peakHours,
                dailyRevenue
            });
        } catch (error) {
            console.error('Stats error:', error);
            res.status(500).json({ error: 'Failed to fetch full stats' });
        }
    },

    async addExpense(req, res) {
        try {
            const { description, amount, category } = req.body;
            if (!description || !amount) return res.status(400).json({ error: 'Description and amount required' });

            const expense = await Expense.create({
                description,
                amount,
                category: category || 'other',
                date: new Date()
            });

            res.status(201).json(expense);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to add expense' });
        }
    },

    // --- AI Inventory Output ---
    async getAiInventoryAnalysis(req, res) {
        try {
            const completedOrders = await Order.findAll({ where: { status: 'completed' } });

            // Map products
            const productUsage = {};
            completedOrders.forEach(o => {
                if (o.items) {
                    o.items.forEach(item => {
                        if (item.productName) {
                            productUsage[item.productName] = (productUsage[item.productName] || 0) + (item.quantity || 1);
                        }
                    });
                }
            });

            let aiInventoryDoc = `Zaxira hisoboti hozircha mavjud emas (AI ulanmadi).`;

            try {
                const { GoogleGenerativeAI } = require('@google/generative-ai');
                const apiKey = process.env.AI_API_KEY;
                if (apiKey && Object.keys(productUsage).length > 0) {
                    const genAI = new GoogleGenerativeAI(apiKey);
                    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

                    const prompt = `You are an AI Inventory Manager for 'Muslim Namja' restaurant.
                    Based on these purchased products and their quantities:
                    ${JSON.stringify(productUsage, null, 2)}
                    
                    Output a JSON object estimating the raw ingredients consumed. 
                    Structure MUST be:
                    {
                      "ingredients": [
                         {"name": "string (e.g., Rice, Meat, Pasta)", "estimated_amount": "string (e.g. 5kg, 10 liters)"}
                      ],
                      "restock_suggestions": ["string"]
                    }
                    Respond ONLY with the JSON, no Markdown formatting.`;

                    const result = await model.generateContent(prompt);
                    const rawResponse = result.response.text().trim();
                    let cleanJsonStr = rawResponse;
                    if (cleanJsonStr.startsWith('```json')) {
                        cleanJsonStr = cleanJsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '');
                    }
                    aiInventoryDoc = JSON.parse(cleanJsonStr);
                } else if (Object.keys(productUsage).length === 0) {
                    aiInventoryDoc = { ingredients: [], restock_suggestions: ["Hali buyurtmalar yo'q, xodimlar e'tibor bersin."] };
                }
            } catch (aiErr) {
                console.error('AI Inventory error:', aiErr.message);
                aiInventoryDoc = { error: "AI ulanishida xatolik" };
            }

            res.json({
                productUsage,
                aiAnalysis: aiInventoryDoc
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to run AI Inventory Analysis' });
        }
    },

    // --- System Settings ---
    async getSetting(req, res) {
        try {
            const setting = await SystemSetting.findOne({ where: { key: req.params.key } });
            res.json(setting ? setting.value : null);
        } catch (err) {
            res.status(500).json({ error: 'Failed to get setting' });
        }
    },

    async setSetting(req, res) {
        try {
            const { key, value } = req.body;
            let setting = await SystemSetting.findOne({ where: { key } });
            if (setting) {
                setting.value = value;
                await setting.save();
            } else {
                setting = await SystemSetting.create({ key, value });
            }
            res.json(setting);
        } catch (err) {
            res.status(500).json({ error: 'Failed to save setting' });
        }
    },

    // --- Ad Banners (Carousel) ---
    async addAdBanner(req, res) {
        try {
            const text = req.body.text || '';
            let imageUrl = '';

            if (req.file) {
                imageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
            }

            if (!text && !imageUrl) return res.status(400).json({ error: 'Matn yoki rasm yuklang' });

            let setting = await SystemSetting.findOne({ where: { key: 'adBanners' } });
            let banners = [];
            if (setting && setting.value) {
                try { banners = JSON.parse(setting.value); } catch (e) { }
            }

            const newBanner = { id: Date.now().toString(), text, imageUrl };
            banners.push(newBanner);

            if (setting) {
                setting.value = JSON.stringify(banners);
                await setting.save();
            } else {
                await SystemSetting.create({ key: 'adBanners', value: JSON.stringify(banners) });
            }

            res.json({ message: 'E\'lon qo\'shildi', banners });
        } catch (error) {
            console.error('addAdBanner error:', error);
            res.status(500).json({ error: 'Failed to add ad banner' });
        }
    },

    async deleteAdBanner(req, res) {
        try {
            const { id } = req.params;
            let setting = await SystemSetting.findOne({ where: { key: 'adBanners' } });
            if (!setting) return res.status(404).json({ error: 'Banners not found' });

            let banners = JSON.parse(setting.value || '[]');
            banners = banners.filter(b => b.id !== id);

            setting.value = JSON.stringify(banners);
            await setting.save();
            res.json({ message: 'O\'chirildi', banners });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete banner' });
        }
    },

    // Broadcast message to all users via Telegram bot
    async broadcast(req, res) {
        try {
            const { message } = req.body;
            if (!message) return res.status(400).json({ error: 'Message is required' });

            const bot = getBot();
            if (!bot) return res.status(500).json({ error: 'Bot is not available' });

            const users = await User.findAll({ attributes: ['telegramId'] });
            let sent = 0;
            for (const u of users) {
                if (u.telegramId) {
                    try {
                        await bot.sendMessage(u.telegramId, `📢 <b>E'lon:</b>\n\n${message}`, { parse_mode: 'HTML' });
                        sent++;
                    } catch (e) { /* skip blocked users */ }
                }
            }
            res.json({ message: `E'lon ${sent} ta foydalanuvchiga yuborildi` });
        } catch (err) {
            res.status(500).json({ error: 'Broadcast failed' });
        }
    }
};

module.exports = adminController;
