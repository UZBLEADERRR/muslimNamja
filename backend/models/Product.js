const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.JSONB, // { en, ko, uz, ru }
        allowNull: false
    },
    description: {
        type: DataTypes.JSONB // { en, ko, uz, ru }
    },
    price: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    category: {
        type: DataTypes.STRING,
        allowNull: false
    },
    imageUrl: {
        type: DataTypes.TEXT // Changed from STRING to TEXT to support base64 images
    },
    stock: {
        type: DataTypes.INTEGER,
        allowNull: true, // null means unlimited
        defaultValue: null
    },
    minOrderQuantity: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    ingredients: {
        type: DataTypes.JSONB, // Array of { name, cost }
        defaultValue: []
    },
    ingredientCost: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    timestamps: true
});

module.exports = Product;
