const TelegramBot = require('node-telegram-bot-api');

function setupBot(botToken, appUrl) {
    if (!botToken) {
        console.warn('Telegram Bot Token not provided. Bot not started.');
        return null;
    }

    const token = botToken.trim();
    // Polling bot setup
    const bot = new TelegramBot(token, { polling: true });

    console.log('Telegram Bot Polling started!');

    bot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;

        const welcomeMessage = `
Assalomu alaykum, <b>Muslim Namja</b> ga xush kelibsiz! 🍱

Iltimos, pastdagi tugmani bosib, mini-ilovamiz orqali buyurtma bering.
`;

        const options = {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🍔 Menyu / Buyurtma Berish", web_app: { url: appUrl } }]
                ]
            }
        };

        bot.sendMessage(chatId, welcomeMessage, options);
    });

    bot.on('message', (msg) => {
        if (msg.text && !msg.text.startsWith('/start')) {
            const chatId = msg.chat.id;
            bot.sendMessage(chatId, "Iltimos, ilovaga kirish uchun /start ni bosing yoki menyuga kiring.");
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
