const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const messagingService = require('../services/messagingService');
const { notificationConfig } = require('../config/notificationConfig');

// Get notification configuration
router.get('/config', authController.protect, async (req, res) => {
    try {
        res.json({
            enableSMS: notificationConfig.ENABLE_SMS,
            criticalCancellationThreshold: notificationConfig.CRITICAL_CANCELLATION_THRESHOLD,
            criticalUpdateThreshold: notificationConfig.CRITICAL_UPDATE_THRESHOLD
        });
    } catch (error) {
        console.error('Error getting notification config:', error);
        res.status(500).json({ error: 'Failed to get notification config' });
    }
});

// Get notification statistics
router.get('/stats', authController.protect, async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const stats = await messagingService.getDeliveryStats(req.user.id, days);
        res.json({ stats });
    } catch (error) {
        console.error('Error getting notification stats:', error);
        res.status(500).json({ error: 'Failed to get notification stats' });
    }
});

// Get unread count by priority
router.get('/unread-by-priority', authController.protect, async (req, res) => {
    try {
        const counts = await messagingService.getUnreadCountByPriority(req.user.id);
        res.json(counts);
    } catch (error) {
        console.error('Error getting unread count by priority:', error);
        res.status(500).json({ error: 'Failed to get unread count' });
    }
});

// Mark all notifications as read
router.put('/mark-all-read', authController.protect, async (req, res) => {
    try {
        const { priority } = req.body;
        const filter = { recipientId: req.user.id, recipientModel: 'User', isRead: false };

        if (priority) {
            filter['metadata.notificationPriority'] = priority;
        }

        const result = await messagingService.markAllAsRead(filter);
        res.json({ message: 'Notifications marked as read', updatedCount: result.modifiedCount });
    } catch (error) {
        console.error('Error marking notifications as read:', error);
        res.status(500).json({ error: 'Failed to mark notifications as read' });
    }
});

// Test notification (for development)
router.post('/test', authController.protect, async (req, res) => {
    try {
        const { type, rideId } = req.body;

        if (!type || !rideId) {
            return res.status(400).json({ error: 'Type and rideId are required' });
        }

        const message = await messagingService.createAndSendMessage(
            req.user.id,
            'User',
            rideId,
            type
        );

        res.json({ message: 'Test notification sent', messageId: message._id });
    } catch (error) {
        console.error('Error sending test notification:', error);
        res.status(500).json({ error: 'Failed to send test notification' });
    }
});

module.exports = router; 