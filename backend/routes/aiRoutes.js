const express = require('express');
const router = express.Router();
const multer = require('multer');
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middlewares/authMiddleware');

// Set up Multer for memory storage since we send it to AI directly
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.use(authMiddleware()); // Only logged-in users or admins can verify payments

// Upload and verify a screenshot
router.post('/verify-payment', upload.single('screenshot'), aiController.verifyPayment);

// Reverse geocode GPS coordinates to address via AI
router.post('/reverse-geocode', aiController.reverseGeocode);

module.exports = router;
