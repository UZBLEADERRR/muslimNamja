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

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Complete an order (takes a photo file upload)
router.post('/orders/:orderId/complete', upload.single('photo'), deliveryController.completeOrder);

// Update delivery location
router.post('/location', deliveryController.updateLocation);

// Get delivery location
router.get('/orders/:orderId/location', deliveryController.getOrderLocation);

// Call user (Push notification to open chat)
router.post('/orders/:orderId/call-user', deliveryController.callUser);

module.exports = router;
