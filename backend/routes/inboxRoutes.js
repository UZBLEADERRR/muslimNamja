const express = require('express');
const router = express.Router();
const multer = require('multer');
const inboxController = require('../controllers/inboxController');
const authMiddleware = require('../middlewares/authMiddleware');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Get list of conversations for current user
router.get('/', authMiddleware(), inboxController.getInbox);

// Get messages for a specific direct message conversation
router.get('/:targetId', authMiddleware(), inboxController.getDMMessages);

// Send a direct message
router.post('/:targetId', authMiddleware(), upload.single('image'), inboxController.postDMMessage);

module.exports = router;
