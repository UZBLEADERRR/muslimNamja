let bot = null;

module.exports = {
    getBot: () => bot,
    setBot: (newBot) => { bot = newBot; }
};
