const { Sequelize } = require('sequelize');

const databaseUrl = process.env.DATABASE_URL;

const sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    logging: false, // Set to console.log to see SQL queries
    dialectOptions: (databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1')) ? {} : {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    }
});

module.exports = sequelize;
