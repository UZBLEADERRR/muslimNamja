const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');

// Only allow Admins
router.use(authMiddleware('admin'));

// Product Management
router.post('/products', adminController.addProduct);
router.put('/products/:id', adminController.updateProduct);

// User & Role Management
router.post('/role', adminController.setRole);

// Profit & Analytics
router.get('/profit', adminController.getProfitAnalysis);

module.exports = router;
