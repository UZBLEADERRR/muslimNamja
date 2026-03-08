const TelegramBot = require('node-telegram-bot-api');

function setupBot(botToken, appUrl) {
    if (!botToken) {
        console.warn('Telegram Bot Token not provided. Bot not started.');
        return null;
    }

    const token = botToken.trim();
    // Polling bot setup
    const bot = new TelegramBot(token, { polling: true });
    // Use User model for registration checks
    const User = require('./models/User');
    const { calculateDistance } = require('./utils/distance');
    const RESTAURANT_LAT = 37.5503; // Sejong University coords
    const RESTAURANT_LNG = 127.0731;

    console.log('Telegram Bot Polling started!');

    const getWelcomeMessage = (name) => `
Assalomu alaykum, <b>${name}</b>! 🍱
<b>Muslim Namja</b> botiga xush kelibsiz.

Buyurtma berish uchun iltimos, ro'yxatdan o'ting. Pastdagi tugmalardan foydalanib telefon raqamingiz va manzilingizni yuboring.
`;

    const getAppKeyboard = (appUrl) => ({
        inline_keyboard: [
            [{ text: "🛍️ Buyurtma Berish / Menyu", web_app: { url: appUrl } }]
        ]
    });

    const getRegistrationKeyboard = () => ({
        keyboard: [
            [{ text: "📱 Telefon raqamni yuborish", request_contact: true }],
            [{ text: "📍 Manzilni yuborish (GPS)", request_location: true }]
        ],
        resize_keyboard: true,
        one_time_keyboard: false
    });

    bot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id;
        const tgUser = msg.from;

        try {
            let user = await User.findOne({ where: { telegramId: tgUser.id.toString() } });

            if (user && user.phone && user.location) {
                bot.sendMessage(chatId, `Xush kelibsiz, ${user.firstName}! Siz ro'yxatdan o'tgansiz.`, {
                    reply_markup: getAppKeyboard(appUrl),
                    parse_mode: 'HTML'
                });
            } else {
                bot.sendMessage(chatId, getWelcomeMessage(tgUser.first_name), {
                    reply_markup: getRegistrationKeyboard(),
                    parse_mode: 'HTML'
                });
            }
        } catch (err) {
            console.error('Start command error:', err);
            bot.sendMessage(chatId, "Xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.");
        }
    });

    bot.on('contact', async (msg) => {
        const chatId = msg.chat.id;
        const contact = msg.contact;
        const tgId = msg.from.id.toString();

        if (contact.user_id.toString() !== tgId) {
            return bot.sendMessage(chatId, "Iltimos, o'zingizning telefon raqamingizni yuboring.");
        }

        try {
            let [user] = await User.findOrCreate({
                where: { telegramId: tgId },
                defaults: {
                    firstName: msg.from.first_name,
                    lastName: msg.from.last_name,
                    username: msg.from.username,
                    role: (process.env.ADMIN_CHAT_ID === tgId) ? 'admin' : 'user'
                }
            });

            user.phone = contact.phone_number;
            await user.save();

            if (user.location) {
                bot.sendMessage(chatId, "Telefon raqamingiz saqlandi! Endi menyuga kirishingiz mumkin.", {
                    reply_markup: { remove_keyboard: true }
                });
                bot.sendMessage(chatId, "Tayyormisiz? 👇", { reply_markup: getAppKeyboard(appUrl) });
            } else {
                bot.sendMessage(chatId, "Telefon raqamingiz saqlandi! Endi iltimos, 'Manzilni yuborish' tugmasini bosing.");
            }
        } catch (err) {
            console.error('Contact handler error:', err);
        }
    });

    bot.on('location', async (msg) => {
        const chatId = msg.chat.id;
        const loc = msg.location;
        const tgId = msg.from.id.toString();

        try {
            let user = await User.findOne({ where: { telegramId: tgId } });

            if (!user) {
                user = await User.create({
                    telegramId: tgId,
                    firstName: msg.from.first_name,
                    lastName: msg.from.last_name,
                    username: msg.from.username,
                    role: (process.env.ADMIN_CHAT_ID === tgId) ? 'admin' : 'user'
                });
            }

            const dist = calculateDistance(RESTAURANT_LAT, RESTAURANT_LNG, loc.latitude, loc.longitude);
            user.location = { lat: loc.latitude, lng: loc.longitude };
            user.distanceFromRestaurant = dist;
            user.address = "Shared via Telegram GPS";
            await user.save();

            if (user.phone) {
                bot.sendMessage(chatId, "Manzilingiz saqlandi! Endi barcha imkoniyatlar ochiq.", {
                    reply_markup: { remove_keyboard: true }
                });
                bot.sendMessage(chatId, "Xaridni boshlaymiz: 👇", { reply_markup: getAppKeyboard(appUrl) });
            } else {
                bot.sendMessage(chatId, "Manzilingiz saqlandi! Endi iltimos, 'Telefon raqamni yuborish' tugmasini bosing.");
            }
        } catch (err) {
            console.error('Location handler error:', err);
        }
    });

    bot.on('message', (msg) => {
        if (msg.text && !msg.text.startsWith('/start') && !msg.contact && !msg.location) {
            const chatId = msg.chat.id;
            // bot.sendMessage(chatId, "Iltimos, ilovaga kirish uchun /start ni bosing yoki menyuga kiring.");
        }
    });

    bot.on('polling_error', (error) => {
        console.error('Bot Polling Error:', error.message);
        if (error.message.includes('401')) {
            console.error('CRITICAL: Telegram Bot Token is invalid. Stopping polling.');
            bot.stopPolling();
        }
    });

    return bot;
}

module.exports = setupBot;
