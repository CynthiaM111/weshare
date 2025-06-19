const messagingService = require('./messagingService');
const Ride = require('../models/ride');

// Send reminders for rides departing soon
const sendRideReminders = async () => {
    try {
        console.log('Starting ride reminder service...');

        const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
        const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);

        // Find rides departing between 1-2 hours from now
        const rides = await Ride.find({
            departure_time: { $gte: oneHourFromNow, $lte: twoHoursFromNow },
            status: 'active'
        }).populate('bookedBy.userId');

        console.log(`Found ${rides.length} rides departing soon`);

        let totalRemindersSent = 0;

        for (const ride of rides) {
            console.log(`Processing reminders for ride ${ride._id} (${ride.from} to ${ride.to})`);

            const messagePromises = ride.bookedBy.map(booking => {
                console.log(`Sending reminder to user ${booking.userId._id}`);
                return messagingService.createAndSendMessage(
                    booking.userId._id,
                    'User',
                    ride._id,
                    'reminder'
                );
            });

            const results = await Promise.allSettled(messagePromises);

            const successfulReminders = results.filter(result => result.status === 'fulfilled').length;
            totalRemindersSent += successfulReminders;

            console.log(`Sent ${successfulReminders}/${ride.bookedBy.length} reminders for ride ${ride._id}`);
        }

        console.log(`Ride reminder service completed. Sent ${totalRemindersSent} reminders total.`);
        return { success: true, remindersSent: totalRemindersSent };
    } catch (error) {
        console.error('Error in ride reminder service:', error);
        return { success: false, error: error.message };
    }
};

// Send reminders for private rides
const sendPrivateRideReminders = async () => {
    try {
        console.log('Starting private ride reminder service...');

        const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
        const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);

        // Find private rides departing between 1-2 hours from now
        const rides = await Ride.find({
            isPrivate: true,
            departure_time: { $gte: oneHourFromNow, $lte: twoHoursFromNow },
            status: 'active'
        }).populate('bookedBy.userId');

        console.log(`Found ${rides.length} private rides departing soon`);

        let totalRemindersSent = 0;

        for (const ride of rides) {
            console.log(`Processing reminders for private ride ${ride._id} (${ride.from} to ${ride.to})`);

            const messagePromises = ride.bookedBy.map(booking => {
                console.log(`Sending reminder to user ${booking.userId._id}`);
                return messagingService.createAndSendMessage(
                    booking.userId._id,
                    'User',
                    ride._id,
                    'reminder'
                );
            });

            const results = await Promise.allSettled(messagePromises);

            const successfulReminders = results.filter(result => result.status === 'fulfilled').length;
            totalRemindersSent += successfulReminders;

            console.log(`Sent ${successfulReminders}/${ride.bookedBy.length} reminders for private ride ${ride._id}`);
        }

        console.log(`Private ride reminder service completed. Sent ${totalRemindersSent} reminders total.`);
        return { success: true, remindersSent: totalRemindersSent };
    } catch (error) {
        console.error('Error in private ride reminder service:', error);
        return { success: false, error: error.message };
    }
};

// Manual trigger for testing
const triggerReminders = async () => {
    console.log('Manually triggering ride reminders...');
    const result = await sendRideReminders();
    console.log('Manual reminder trigger result:', result);
    return result;
};

module.exports = {
    sendRideReminders,
    sendPrivateRideReminders,
    triggerReminders
}; 