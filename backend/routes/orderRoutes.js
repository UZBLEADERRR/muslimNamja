const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middlewares/authMiddleware');

// Create order
router.post('/', authMiddleware(), orderController.createOrder);
router.post('/create', authMiddleware(), orderController.createOrder);

// Get my orders
router.get('/my', authMiddleware(), orderController.getMyOrders);
router.get('/my-orders', authMiddleware(), orderController.getMyOrders);

module.exports = router;
