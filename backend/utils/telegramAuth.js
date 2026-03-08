const crypto = require('crypto');

/**
 * Validates Telegram WebApp initData
 * @param {string} initData - The raw initData string from Telegram
 * @param {string} botToken - Telegram Bot Token
 * @returns {Object|boolean} - Returns parsed user data if valid, otherwise false
 */
function validateTelegramWebAppData(initData, botToken) {
    try {
        const urlParams = new URLSearchParams(initData);
        const hash = urlParams.get('hash');
        urlParams.delete('hash');

        const dataCheckString = Array.from(urlParams.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');

        const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
        const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

        if (calculatedHash === hash) {
            const user = JSON.parse(urlParams.get('user'));
            return user;
        }
        return false;
    } catch (err) {
        console.error('Error validating Telegram data:', err);
        return false;
    }
}

module.exports = { validateTelegramWebAppData };
