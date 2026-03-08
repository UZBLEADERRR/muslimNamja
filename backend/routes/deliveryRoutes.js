const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const authMiddleware = require('../middlewares/authMiddleware');

// Only allow delivery men
router.use(authMiddleware('delivery'));

// Get available orders
router.get('/orders/available', deliveryController.getAvailableOrders);

// Accept an order
router.post('/orders/:orderId/accept', deliveryController.acceptOrder);

// Complete an order
router.post('/orders/:orderId/complete', deliveryController.completeOrder);

module.exports = router;
