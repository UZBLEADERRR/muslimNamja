const TelegramBot = require('node-telegram-bot-api');

function setupBot(botToken, appUrl) {
    if (!botToken) {
        console.warn('Telegram Bot Token not provided. Bot not started.');
        return null;
    }

    const token = botToken.trim();
    const bot = new TelegramBot(token, {
        polling: {
            interval: 1000,
            autoStart: true,
            params: { timeout: 10 }
        }
    });

    const User = require('./models/User');
    const { calculateDistance } = require('./utils/distance');
    const RESTAURANT_LAT = 37.5503;
    const RESTAURANT_LNG = 127.0731;

    console.log('Telegram Bot Polling started!');

    const getWelcomeMessage = (name) => `
Assalomu alaykum, <b>${name}</b>! 🍱
<b>Muslim Namja</b> botiga xush kelibsiz.

Iltimos, ilovaga kiring va ro'yxatdan o'ting.
`;

    const getAppKeyboard = (appUrl) => ({
        inline_keyboard: [
            [{ text: "🛍️ Ilovaga Kirish", web_app: { url: appUrl } }]
        ]
    });

    bot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id;
        const tgUser = msg.from;

        try {
            let user = await User.findOne({ where: { telegramId: tgUser.id.toString() } });

            if (user && user.phone && user.location) {
                bot.sendMessage(chatId, `Xush kelibsiz, ${user.firstName}!`, {
                    reply_markup: getAppKeyboard(appUrl),
                    parse_mode: 'HTML'
                });
            } else {
                bot.sendMessage(chatId, getWelcomeMessage(tgUser.first_name), {
                    reply_markup: getAppKeyboard(appUrl),
                    parse_mode: 'HTML'
                });
            }
        } catch (err) {
            console.error('Start command error:', err);
            bot.sendMessage(chatId, "Xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.");
        }
    });



    bot.on('message', (msg) => {
        if (msg.text && !msg.text.startsWith('/start') && !msg.contact && !msg.location) {
            // Silently ignore unrecognized messages
        }
    });

    // Graceful 409 handling — restart polling after delay
    bot.on('polling_error', (error) => {
        const msg = error.message || '';
        if (msg.includes('409')) {
            console.warn('Bot 409 Conflict detected. Restarting polling in 3s...');
            bot.stopPolling().then(() => {
                setTimeout(() => {
                    bot.startPolling();
                    console.log('Bot polling restarted after 409.');
                }, 3000);
            });
        } else if (msg.includes('401')) {
            console.error('CRITICAL: Telegram Bot Token is invalid. Stopping polling.');
            bot.stopPolling();
        } else {
            console.error('Bot Polling Error:', msg);
        }
    });

    return bot;
}

module.exports = setupBot;
