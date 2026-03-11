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

            if (isAdmin) {
                // Admin inbox: all users who ever DMed the admin OR admin DMed them
                // Find all unique users in DMs with any admin (where receiverId is an admin or senderId is an admin)
                // Actually, admins share one Support inbox. So any DM with receiverId=null and orderId=null?
                // No, DM means orderId is null AND receiverId is NOT null.
                
                const dmUsers = await ChatMessage.findAll({
                    attributes: ['senderId', 'receiverId'],
                    where: {
                        orderId: null,
                        [Op.or]: [
                            { receiverId: userId },
                            { senderId: userId }
                        ]
                    },
                    group: ['senderId', 'receiverId']
                });

                const uniqueUserIds = new Set();
                dmUsers.forEach(m => {
                    if (m.senderId !== userId) uniqueUserIds.add(m.senderId);
                    if (m.receiverId !== userId) uniqueUserIds.add(m.receiverId);
                });

                // Get last msg for each
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
                        name: `${u.role === 'driver' ? '🛵' : '👤'} ${u.firstName}`,
                        lastMessage: lastMsg ? lastMsg.text || (lastMsg.imageUrl ? '📷 Rasm' : '') : '',
                        updatedAt: lastMsg ? lastMsg.createdAt : new Date()
                    });
                }
            } else {
                // Normal User or Driver inbox: 
                // 1) Active Orders (where they are buyer or driver)
                const activeOrders = await Order.findAll({
                    where: user.role === 'driver' ? { deliveryManId: userId, status: { [Op.notIn]: ['completed', 'cancelled'] } } 
                                                  : { userId: userId, status: { [Op.notIn]: ['completed', 'cancelled'] } },
                    include: [
                        { model: User, as: 'user', attributes: ['firstName'] }
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
                        name: user.role === 'driver' ? `Buyurtma: ${order.user?.firstName}` : `Buyurtma #${order.id.slice(0, 8)} (Kuryer bilan)`,
                        lastMessage: lastMsg ? lastMsg.text || (lastMsg.imageUrl ? '📷 Rasm' : '') : 'Chatni boshlash',
                        updatedAt: lastMsg ? lastMsg.createdAt : order.createdAt,
                        orderData: order
                    });
                }

                // 2) Support (DM with Admin)
                // Find an admin to chat with. For simplicity, any message sent to an admin.
                const admins = await User.findAll({ where: { role: 'admin' } });
                const mainAdminId = admins.length > 0 ? admins[0].id : null;

                if (mainAdminId) {
                    const lastDmMsg = await ChatMessage.findOne({
                        where: {
                            orderId: null,
                            [Op.or]: [
                                { senderId: userId, receiverId: mainAdminId },
                                { senderId: mainAdminId, receiverId: userId }
                            ]
                        },
                        order: [['createdAt', 'DESC']]
                    });

                    conversations.push({
                        id: `dm_${mainAdminId}`,
                        type: 'dm',
                        targetId: mainAdminId,
                        name: '🛡️ Yordam Markazi (Support)',
                        lastMessage: lastDmMsg ? lastDmMsg.text || (lastDmMsg.imageUrl ? '📷 Rasm' : '') : 'Admin bilan bog\'lanish',
                        updatedAt: lastDmMsg ? lastDmMsg.createdAt : new Date(0)
                    });
                }
            }

            // Sort by latest message
            conversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
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
            
            // Note: Broadcasting logic via Socket.IO should probably use the targetId directly 
            // e.g., io.to(`user_${targetId}`).emit(...)
            // We will let the frontend listen to private events or broadcast to `dm_${senderId}_${targetId}`.
            
            res.status(201).json({ ...msg.toJSON(), sender });
        } catch (error) {
            console.error('postDM error', error);
            res.status(500).json({ error: 'Failed to send DM' });
        }
    }
};

module.exports = inboxController;
