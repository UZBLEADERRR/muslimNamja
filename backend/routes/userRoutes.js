const express = require('express');
const router = express.Router();
const multer = require('multer');
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

// Multer for in-memory file uploads (screenshots)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// All routes require user to be authenticated
router.use(authMiddleware());

router.post('/topup', upload.single('screenshot'), userController.topUpWallet);
router.put('/profile', userController.updateProfile);

module.exports = router;
