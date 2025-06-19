const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');
const authController = require('../controllers/authController');

// All reminder routes require authentication
router.use(authController.protect);

// POST /reminders/trigger - Manually trigger ride reminders (for testing)
router.post('/trigger', reminderController.triggerReminders);

// POST /reminders/private - Manually trigger private ride reminders (for testing)
router.post('/private', reminderController.triggerPrivateRideReminders);

module.exports = router; 