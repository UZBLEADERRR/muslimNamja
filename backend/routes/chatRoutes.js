const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware());

// Get all messages
router.get('/', chatController.getMessages);

// Post a regular chat message
router.post('/', chatController.postMessage);

// Admin posts a special offer
router.post('/offer', authMiddleware('admin'), chatController.postOffer);

// User claims a special offer
router.post('/:messageId/claim', chatController.claimOffer);

module.exports = router;
