const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Expense = sequelize.define('Expense', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    adminId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    amount: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    category: {
        type: DataTypes.STRING,
        allowNull: false // e.g., 'ingredients', 'delivery_pay', 'refund', 'other'
    },
    description: DataTypes.STRING,
}, {
    timestamps: true
});

module.exports = Expense;
