const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/create', authMiddleware(), orderController.createOrder);
router.get('/my-orders', authMiddleware(), orderController.getMyOrders);

module.exports = router;
