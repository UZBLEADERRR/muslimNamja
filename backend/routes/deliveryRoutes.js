const express = require('express');
const router = express.Router();
const { deliveryController } = require('../controllers/deliveryController');
const authMiddleware = require('../middlewares/authMiddleware');

// Only allow delivery men
router.use(authMiddleware('delivery'));

// Get available orders
router.get('/orders/available', deliveryController.getAvailableOrders);

// Get my active order (delivering)
router.get('/active', deliveryController.getActiveOrder);

// Get delivery stats
router.get('/stats', deliveryController.getStats);

// Accept an order
router.post('/orders/:orderId/accept', deliveryController.acceptOrder);

// Complete an order (fallback if manual completion needed)
router.post('/orders/:orderId/complete', deliveryController.completeOrder);

// Update delivery location
router.post('/location', deliveryController.updateLocation);

// Call user (Push notification to open chat)
router.post('/orders/:orderId/call-user', deliveryController.callUser);

module.exports = router;
