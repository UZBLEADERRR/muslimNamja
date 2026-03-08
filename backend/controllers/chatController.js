const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');

// Helper to save image locally (for MVP/Railway without S3)
// We will return base64 for simplicity in this system to avoid file system persistence issues,
// since Railway ephemeral storage gets wiped on deploy. For a real app, use AWS S3.
// But we'll try to just store base64 in DB or handle it lightweight.
// Actually, storing large base64 in Postgres can bloat it. 
// A better simple approach is a public directory, but Railway wipes it.
// We'll return a base64 string for now in `imageUrl` but prefix it.

const chatController = {
    // Get all messages
    async getMessages(req, res) {
        try {
            const messages = await ChatMessage.findAll({
                limit: 100,
                order: [['createdAt', 'DESC']]
            });

            const populated = await Promise.all(messages.map(async (msg) => {
                const sender = await User.findByPk(msg.senderId, { attributes: ['id', 'firstName', 'role'] });
                return {
                    ...msg.toJSON(),
                    sender
                };
            }));

            res.json(populated.reverse());
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to fetch messages' });
        }
    },

    // Post a normal message
    async postMessage(req, res) {
        try {
            const { text } = req.body;
            const senderId = req.user.userId;

            if (!text || !text.trim()) return res.status(400).json({ error: 'Message text is required' });

            const msg = await ChatMessage.create({ senderId, text: text.trim() });
            const sender = await User.findByPk(senderId, { attributes: ['id', 'firstName', 'role'] });

            res.status(201).json({ ...msg.toJSON(), sender });
        } catch (error) {
            res.status(500).json({ error: 'Failed to post message' });
        }
    },

    // Post an image message
    async postImageMessage(req, res) {
        try {
            const senderId = req.user.userId;

            if (!req.file) {
                return res.status(400).json({ error: 'Image is required' });
            }

            // Convert to base64 for MVP storage
            const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

            const msg = await ChatMessage.create({
                senderId,
                text: req.body.text || '', // Optional caption
                imageUrl: base64Image
            });
            const sender = await User.findByPk(senderId, { attributes: ['id', 'firstName', 'role'] });

            res.status(201).json({ ...msg.toJSON(), sender });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to post image message' });
        }
    },

    // Edit message
    async editMessage(req, res) {
        try {
            const { id } = req.params;
            const { text } = req.body;
            const userId = req.user.userId;

            const msg = await ChatMessage.findByPk(id);
            if (!msg) return res.status(404).json({ error: 'Message not found' });

            if (msg.senderId !== userId) {
                return res.status(403).json({ error: 'Not authorized to edit this message' });
            }
            if (msg.isDeleted) {
                return res.status(400).json({ error: 'Cannot edit deleted message' });
            }

            msg.text = text.trim();
            msg.editedAt = new Date();
            await msg.save();

            res.json(msg);
        } catch (error) {
            res.status(500).json({ error: 'Failed to edit message' });
        }
    },

    // Delete message (Soft delete)
    async deleteMessage(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.userId;

            const msg = await ChatMessage.findByPk(id);
            if (!msg) return res.status(404).json({ error: 'Message not found' });

            const user = await User.findByPk(userId);

            // Only sender or admin can delete
            if (msg.senderId !== userId && user.role !== 'admin') {
                return res.status(403).json({ error: 'Not authorized to delete this message' });
            }

            msg.isDeleted = true;
            msg.text = 'O\'chirilgan xabar';
            msg.imageUrl = null;
            await msg.save();

            res.json({ message: 'Message deleted', msg });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete message' });
        }
    }
};

module.exports = chatController;
