const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');

// Only allow Admins
router.use(authMiddleware('admin'));

// Product Management
router.get('/products', adminController.getAllProducts);
router.post('/products', adminController.addProduct);
router.put('/products/:id', adminController.updateProduct);
router.delete('/products/:id', adminController.deleteProduct);

// Order Management
router.get('/orders', adminController.getAllOrders);
router.put('/orders/:id', adminController.updateOrderStatus);

// User & Role Management
router.get('/users', adminController.getAllUsers);
router.post('/role', adminController.setRole);

// Seed initial products
router.post('/seed', adminController.seedProducts);

// Profit & Analytics
router.get('/profit', adminController.getProfitAnalysis);

module.exports = router;
