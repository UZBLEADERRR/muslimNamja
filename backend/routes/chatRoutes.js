const express = require('express');
const router = express.Router();
const multer = require('multer');
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middlewares/authMiddleware');

// Multer for in-memory file uploads (images)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Public: anyone can read messages
router.get('/', chatController.getMessages);

// Protected: must be logged in to post text/images, edit, or delete
router.post('/', authMiddleware(), chatController.postMessage);
router.post('/image', authMiddleware(), upload.single('image'), chatController.postImageMessage);
router.put('/:id', authMiddleware(), chatController.editMessage);
router.delete('/:id', authMiddleware(), chatController.deleteMessage);

module.exports = router;
