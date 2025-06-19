const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authController = require('../controllers/authController');

// All message routes require authentication
router.use(authController.protect);

// GET /messages - Get user messages with pagination
router.get('/', messageController.getUserMessages);

// GET /messages/unread-count - Get unread message count
router.get('/unread-count', messageController.getUnreadMessageCount);

// PUT /messages/:id/read - Mark specific message as read
router.put('/:id/read', messageController.markMessageAsRead);

// PUT /messages/mark-all-read - Mark all messages as read
router.put('/mark-all-read', messageController.markAllMessagesAsRead);

module.exports = router; 