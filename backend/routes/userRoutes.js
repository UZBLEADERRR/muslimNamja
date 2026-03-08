const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

// All routes require user to be authenticated
router.use(authMiddleware());

router.post('/topup', userController.topUpWallet);
router.put('/profile', userController.updateProfile);

module.exports = router;
