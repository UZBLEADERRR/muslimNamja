const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Get all products (Public route, or user route. We allow anyone to fetch menu)
router.get('/', productController.getAllProducts);

module.exports = router;
