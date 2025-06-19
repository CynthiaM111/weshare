const reminderService = require('../services/reminderService');

// POST /reminders/trigger - Manually trigger ride reminders (for testing)
const triggerReminders = async (req, res) => {
    try {
        const result = await reminderService.triggerReminders();

        if (result.success) {
            res.status(200).json({
                message: 'Reminders triggered successfully',
                remindersSent: result.remindersSent
            });
        } else {
            res.status(500).json({
                error: 'Failed to trigger reminders',
                details: result.error
            });
        }
    } catch (error) {
        console.error('Error triggering reminders:', error);
        res.status(500).json({ error: 'Failed to trigger reminders', details: error.message });
    }
};

// POST /reminders/private - Manually trigger private ride reminders (for testing)
const triggerPrivateRideReminders = async (req, res) => {
    try {
        const result = await reminderService.sendPrivateRideReminders();

        if (result.success) {
            res.status(200).json({
                message: 'Private ride reminders triggered successfully',
                remindersSent: result.remindersSent
            });
        } else {
            res.status(500).json({
                error: 'Failed to trigger private ride reminders',
                details: result.error
            });
        }
    } catch (error) {
        console.error('Error triggering private ride reminders:', error);
        res.status(500).json({ error: 'Failed to trigger private ride reminders', details: error.message });
    }
};

module.exports = {
    triggerReminders,
    triggerPrivateRideReminders
}; 