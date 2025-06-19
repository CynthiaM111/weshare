const reminderService = require('./reminderService');

// Simple interval-based scheduler (in production, you'd use a proper cron library)
let reminderInterval = null;

// Start the reminder scheduler
const startReminderScheduler = () => {
    console.log('Starting reminder scheduler...');

    // Run every 30 minutes
    reminderInterval = setInterval(async () => {
        console.log('Running scheduled reminder check...');
        try {
            await reminderService.sendRideReminders();
        } catch (error) {
            console.error('Error in scheduled reminder check:', error);
        }
    }, 30 * 60 * 1000); // 30 minutes

    console.log('Reminder scheduler started. Will run every 30 minutes.');
};

// Stop the reminder scheduler
const stopReminderScheduler = () => {
    if (reminderInterval) {
        clearInterval(reminderInterval);
        reminderInterval = null;
        console.log('Reminder scheduler stopped.');
    }
};

// Get scheduler status
const getSchedulerStatus = () => {
    return {
        isRunning: reminderInterval !== null,
        nextRun: reminderInterval ? 'Every 30 minutes' : 'Not running'
    };
};

// Manual trigger for immediate execution
const triggerScheduledReminders = async () => {
    console.log('Manually triggering scheduled reminders...');
    try {
        const result = await reminderService.sendRideReminders();
        console.log('Manual scheduled reminder result:', result);
        return result;
    } catch (error) {
        console.error('Error in manual scheduled reminder trigger:', error);
        throw error;
    }
};

module.exports = {
    startReminderScheduler,
    stopReminderScheduler,
    getSchedulerStatus,
    triggerScheduledReminders
}; 