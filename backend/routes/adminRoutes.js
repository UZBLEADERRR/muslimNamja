const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

// Only allow Admins
router.use(authMiddleware('admin'));

// Product Management
router.get('/products', adminController.getAllProducts);
router.post('/products', upload.single('image'), adminController.addProduct);
router.put('/products/:id', upload.single('image'), adminController.updateProduct);
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

// Daily/Monthly Stats & Demographics
router.get('/stats', adminController.getFullStats);

// Manual Expenses
router.post('/expenses', adminController.addExpense);

// AI Inventory Manager
router.get('/ai-inventory', adminController.getAiInventoryAnalysis);

// System Settings
router.get('/settings/:key', adminController.getSetting);
router.post('/settings', adminController.setSetting);

module.exports = router;
