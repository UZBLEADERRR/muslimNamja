const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    telegramId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    firstName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lastName: DataTypes.STRING,
    username: DataTypes.STRING,
    phone: DataTypes.STRING,
    address: DataTypes.STRING,
    location: {
        type: DataTypes.JSONB, // Stores { lat, lng }
    },
    registrationIp: DataTypes.STRING,
    lastLoginIp: DataTypes.STRING,
    gender: {
        type: DataTypes.ENUM('male', 'female'),
        allowNull: true
    },
    distanceFromRestaurant: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    role: {
        type: DataTypes.ENUM('user', 'admin', 'delivery'),
        defaultValue: 'user'
    },
    walletBalance: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    timestamps: true
});

module.exports = User;
