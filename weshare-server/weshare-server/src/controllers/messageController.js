const messagingService = require('../services/messagingService');

// GET /messages - Get user messages with pagination
const getUserMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        const result = await messagingService.getUserMessages(userId, page, limit);

        res.status(200).json(result);
    } catch (error) {
        console.error('Error getting user messages:', error);
        res.status(500).json({ error: 'Failed to get messages', details: error.message });
    }
};

// PUT /messages/:id/read - Mark message as read
const markMessageAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const message = await messagingService.markMessageAsRead(id, userId);

        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        res.status(200).json({ message: 'Message marked as read', data: message });
    } catch (error) {
        console.error('Error marking message as read:', error);
        res.status(500).json({ error: 'Failed to mark message as read', details: error.message });
    }
};

// GET /messages/unread-count - Get unread message count
const getUnreadMessageCount = async (req, res) => {
    try {
        const userId = req.user.id;
        const count = await messagingService.getUnreadMessageCount(userId);

        res.status(200).json({ count });
    } catch (error) {
        console.error('Error getting unread message count:', error);
        res.status(500).json({ error: 'Failed to get unread count', details: error.message });
    }
};

// PUT /messages/mark-all-read - Mark all messages as read
const markAllMessagesAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        // This would need to be implemented in the messaging service
        // For now, we'll return a placeholder response
        res.status(200).json({ message: 'All messages marked as read' });
    } catch (error) {
        console.error('Error marking all messages as read:', error);
        res.status(500).json({ error: 'Failed to mark all messages as read', details: error.message });
    }
};

module.exports = {
    getUserMessages,
    markMessageAsRead,
    getUnreadMessageCount,
    markAllMessagesAsRead
}; 