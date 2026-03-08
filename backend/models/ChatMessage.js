const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ChatMessage = sequelize.define('ChatMessage', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    senderId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    orderId: {
        type: DataTypes.UUID,
        allowNull: true // If null, it's a community message
    },
    text: DataTypes.STRING,
    isSystem: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    offerAction: DataTypes.STRING,
    offerData: {
        type: DataTypes.JSONB, // { productId, specialPrice, maxUses, currentUses }
        defaultValue: {}
    },
    imageUrl: DataTypes.STRING,
    isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    editedAt: DataTypes.DATE
}, {
    timestamps: true
});

module.exports = ChatMessage;
