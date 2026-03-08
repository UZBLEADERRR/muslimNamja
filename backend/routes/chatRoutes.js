const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middlewares/authMiddleware');

// Public: anyone can read messages
router.get('/', chatController.getMessages);

// Protected: must be logged in to post
router.post('/', authMiddleware(), chatController.postMessage);

// Admin posts a special offer
router.post('/offer', authMiddleware('admin'), chatController.postOffer);

// User claims a special offer
router.post('/:messageId/claim', authMiddleware(), chatController.claimOffer);

module.exports = router;
