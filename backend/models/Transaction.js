const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Transaction = sequelize.define('Transaction', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    amount: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('topup', 'spend', 'refund', 'salary'),
        allowNull: false
    },
    description: DataTypes.STRING,
    screenshotUrl: DataTypes.STRING,
    aiVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    adminApproved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'completed', 'rejected'),
        defaultValue: 'pending'
    }
}, {
    timestamps: true
});

module.exports = Transaction;
