const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Create order
router.post('/', authMiddleware(), orderController.createOrder);
router.post('/create', authMiddleware(), orderController.createOrder);

// Get my orders
router.get('/my', authMiddleware(), orderController.getMyOrders);
router.get('/my-orders', authMiddleware(), orderController.getMyOrders);

// Track an order (Live location & Queue position)
router.get('/:id/tracking', authMiddleware(), orderController.getTracking);

// Order-specific Chat & Delivery Flow
router.get('/:id/chat', authMiddleware(), orderController.getOrderChat);
router.post('/:id/chat', authMiddleware(), upload.single('image'), orderController.postOrderChat);

// Delivery Man sends arrival photo
router.post('/:id/delivery-photo', authMiddleware(), upload.single('photo'), orderController.uploadDeliveryPhoto);

// User confirms delivery after seeing photo
router.post('/:id/confirm-delivery', authMiddleware(), orderController.confirmDelivery);
// Driver notifies user they are nearby
router.post('/:id/notify-nearby', authMiddleware(), orderController.notifyNearby);

// Get delivery driver location (accessible to any logged-in user for tracking)
const { deliveryController } = require('../controllers/deliveryController');
router.get('/:id/location', authMiddleware(), deliveryController.getOrderLocation);

module.exports = router;
