const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const Order = require('../models/Order');
const { Op } = require('sequelize');

const inboxController = {

    // Get list of conversations for the current user
    async getInbox(req, res) {
        try {
            const userId = req.user.userId;
            const user = await User.findByPk(userId);
            if (!user) return res.status(404).json({ error: 'User not found' });

            const isAdmin = user.role === 'admin';
            const conversations = [];

            // Get main admin id — needed for sorting and support chat
            const admins = await User.findAll({ where: { role: 'admin' }, attributes: ['id', 'firstName'], limit: 5 });
            const mainAdminId = admins.length > 0 ? admins[0].id : null;

            // 1) Active Orders (Buyer or Driver)
            const orderWhere = user.role === 'delivery' 
                ? { deliveryManId: userId, status: { [Op.notIn]: ['completed', 'cancelled'] } } 
                : { userId: userId, status: { [Op.notIn]: ['completed', 'cancelled'] } };

            const activeOrders = await Order.findAll({
                where: orderWhere,
                include: [
                    { model: User, as: 'User', attributes: ['firstName'] },
                    { model: User, as: 'DeliveryMan', attributes: ['firstName'] }
                ]
            });

            for (let order of activeOrders) {
                const lastMsg = await ChatMessage.findOne({
                    where: { orderId: order.id },
                    order: [['createdAt', 'DESC']]
                });

                conversations.push({
                    id: `order_${order.id}`,
                    type: 'order',
                    targetId: order.id,
                    name: user.role === 'delivery' 
                        ? `Buyurtma: ${order.User?.firstName || 'Mijoz'}` 
                        : `🛵 Kuryer: ${order.DeliveryMan?.firstName || 'Kutilmoqda...'}`,
                    lastMessage: lastMsg ? lastMsg.text || (lastMsg.imageUrl ? '📷 Rasm' : '') : 'Chatni boshlash',
                    updatedAt: lastMsg ? lastMsg.createdAt : order.createdAt,
                    orderData: order
                });
            }

            // 2) Direct Messages (DMs)
            const dmMessages = await ChatMessage.findAll({
                attributes: ['senderId', 'receiverId'],
                where: {
                    orderId: null,
                    [Op.or]: [
                        { receiverId: userId },
                        { senderId: userId }
                    ]
                },
                raw: true
            });

            const uniqueUserIds = new Set();
            dmMessages.forEach(m => {
                const otherId = String(m.senderId) === String(userId) ? m.receiverId : m.senderId;
                if (otherId && String(otherId) !== String(userId)) uniqueUserIds.add(otherId);
            });

            for (let uid of uniqueUserIds) {
                const u = await User.findByPk(uid, { attributes: ['id', 'firstName', 'role'] });
                if (!u) continue;
                
                const lastMsg = await ChatMessage.findOne({
                    where: {
                        orderId: null,
                        [Op.or]: [
                            { senderId: userId, receiverId: uid },
                            { senderId: uid, receiverId: userId }
                        ]
                    },
                    order: [['createdAt', 'DESC']]
                });

                conversations.push({
                    id: `dm_${uid}`,
                    type: 'dm',
                    targetId: uid,
                    name: uid === mainAdminId ? '🛡️ Yordam Markazi (Support)' : `${u.role === 'delivery' ? '🛵' : '👤'} ${u.firstName}`,
                    lastMessage: lastMsg ? lastMsg.text || (lastMsg.imageUrl ? '📷 Rasm' : '') : (uid === mainAdminId ? 'Admin bilan bog\'lanish' : ''),
                    updatedAt: lastMsg ? lastMsg.createdAt : new Date(0)
                });
            }

            // Ensure Support is always in the list even if no messages
            if (!isAdmin && mainAdminId && !conversations.find(c => c.id === `dm_${mainAdminId}`)) {
                conversations.push({
                    id: `dm_${mainAdminId}`,
                    type: 'dm',
                    targetId: mainAdminId,
                    name: '🛡️ Yordam Markazi (Support)',
                    lastMessage: 'Admin bilan bog\'lanish',
                    updatedAt: new Date(0)
                });
            }

            // Sort by latest message, putting Support/Admin channel always on top for users
            conversations.sort((a, b) => {
                if (!isAdmin && mainAdminId) {
                    if (a.id === `dm_${mainAdminId}`) return -1;
                    if (b.id === `dm_${mainAdminId}`) return 1;
                }
                return new Date(b.updatedAt) - new Date(a.updatedAt);
            });
            res.json(conversations);

        } catch (error) {
            console.error('Inbox error:', error);
            res.status(500).json({ error: 'Failed to load inbox' });
        }
    },

    // Get messages for a specific DM
    async getDMMessages(req, res) {
        try {
            const userId = req.user.userId;
            const targetId = req.params.targetId;

            const messages = await ChatMessage.findAll({
                where: {
                    orderId: null,
                    [Op.or]: [
                        { senderId: userId, receiverId: targetId },
                        { senderId: targetId, receiverId: userId }
                    ]
                },
                order: [['createdAt', 'ASC']]
            });

            const populated = await Promise.all(messages.map(async (msg) => {
                const sender = await User.findByPk(msg.senderId, { attributes: ['id', 'firstName', 'role'] });
                return { ...msg.toJSON(), sender };
            }));

            res.json(populated);
        } catch (error) {
            console.error('getDMMessages error', error);
            res.status(500).json({ error: 'Failed to load DM history' });
        }
    },

    // Post DM message
    async postDMMessage(req, res) {
        try {
            const senderId = req.user.userId;
            const targetId = req.params.targetId;
            const { text } = req.body;

            let imageUrl = null;
            if (req.file) {
                imageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
            }

            if (!text && !imageUrl) return res.status(400).json({ error: 'Message or image required' });

            const msg = await ChatMessage.create({
                senderId,
                receiverId: targetId,
                text: text || '',
                imageUrl
            });

            const sender = await User.findByPk(senderId, { attributes: ['id', 'firstName', 'role'] });
            
            const io = req.app.get('io');
            if (io) {
                const messageData = { ...msg.toJSON(), sender };
                io.to(`dm_${targetId}`).emit('receive-message', messageData);
                io.to(`dm_${senderId}`).emit('receive-message', messageData);
                io.to(`user_${targetId}`).emit('new-message-alert', {
                    text: text || '📷 Rasm',
                    sender: sender,
                    senderId: senderId
                });
            }
            
            res.status(201).json({ ...msg.toJSON(), sender });
        } catch (error) {
            console.error('postDM error', error);
            res.status(500).json({ error: 'Failed to send DM' });
        }
    }
};

module.exports = inboxController;
