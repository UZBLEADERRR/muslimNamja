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
        type: DataTypes.ENUM('pending', 'accepted', 'preparing', 'ready_for_pickup', 'delivering', 'delivered_awaiting_review', 'completed', 'cancelled'),
        defaultValue: 'pending'
    },
    deliveryType: {
        type: DataTypes.ENUM('pickup', 'meetup', 'home'),
        defaultValue: 'home'
    },
    meetupLocation: {
        type: DataTypes.STRING,
        allowNull: true
    },
    giftInfo: {
        type: DataTypes.JSONB, // { isGift: boolean, toUserId: string, isAnonymous: boolean }
        allowNull: true
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
    deliveryPhotoUrl: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    rating: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    reviewText: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    completedAt: {
        type: DataTypes.DATE
    }
}, {
    timestamps: true
});

module.exports = Order;
