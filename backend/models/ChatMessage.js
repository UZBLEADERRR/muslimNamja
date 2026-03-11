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
        allowNull: true // If null and receiverId is null, it's a community message
    },
    receiverId: {
        type: DataTypes.UUID,
        allowNull: true // If orderId is null and this is set, it's a direct message (DM)
    },
    text: DataTypes.TEXT,
    isSystem: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    offerAction: DataTypes.STRING,
    offerData: {
        type: DataTypes.JSONB,
        defaultValue: {}
    },
    imageUrl: DataTypes.TEXT,
    isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    editedAt: DataTypes.DATE,
    replyToId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    isPinned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    timestamps: true
});

module.exports = ChatMessage;
