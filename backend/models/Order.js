const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    deliveryManId: {
        type: DataTypes.UUID
    },
    items: {
        type: DataTypes.JSONB, // Array of { productId, quantity, addons, priceAtTime }
        allowNull: false
    },
    totalAmount: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'accepted', 'preparing', 'delivering', 'completed', 'cancelled'),
        defaultValue: 'pending'
    },
    deliveryFee: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    distance: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    deliveryManEarning: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    paymentMethod: {
        type: DataTypes.ENUM('wallet', 'cash'),
        defaultValue: 'wallet'
    },
    completedAt: {
        type: DataTypes.DATE
    }
}, {
    timestamps: true
});

module.exports = Order;
