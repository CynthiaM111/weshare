const dotenv = require('dotenv');
dotenv.config();

// Notification Configuration - SMS Only
const notificationConfig = {
    // Environment flags
    ENABLE_SMS: process.env.ENABLE_SMS === 'true' || process.env.ENABLE_SMS === undefined, // Default to true

    // SMS Configuration
    SMS_PROVIDER: process.env.SMS_PROVIDER || 'africas_talking',
    AFRICASTALKING_API_KEY: process.env.AFRICASTALKING_API_KEY,
    AFRICASTALKING_USERNAME: process.env.AFRICASTALKING_USERNAME || 'sandbox',

    // Critical event thresholds (in minutes before departure)
    CRITICAL_CANCELLATION_THRESHOLD: parseInt(process.env.CRITICAL_CANCELLATION_THRESHOLD) || 60, // 1 hour
    CRITICAL_UPDATE_THRESHOLD: parseInt(process.env.CRITICAL_UPDATE_THRESHOLD) || 60, // 1 hour

    // Notification types and their delivery methods
    notificationTypes: {
        // Info notifications (SMS only)
        booking_confirmation: {
            priority: 'info',
            sms: true
        },
        booking_cancellation: {
            priority: 'info',
            sms: true
        },
        ride_completion: {
            priority: 'info',
            sms: true
        },
        private_ride_booked: {
            priority: 'info',
            sms: true
        },
        private_ride_completed: {
            priority: 'info',
            sms: true
        },
        reminder: {
            priority: 'info',
            sms: true
        },

        // Critical notifications (SMS only)
        ride_cancellation: {
            priority: 'critical',
            sms: true,
            criticalThreshold: 60 // minutes before departure
        },
        ride_update: {
            priority: 'critical',
            sms: true,
            criticalThreshold: 60 // minutes before departure
        },
        driver_change: {
            priority: 'critical',
            sms: true,
            criticalThreshold: 60 // minutes before departure
        },
        emergency_cancellation: {
            priority: 'critical',
            sms: true,
            criticalThreshold: 0 // always critical
        }
    },

    // Message templates for different notification types
    templates: {
        booking_confirmation: {
            title: 'Booking Confirmed',
            body: 'Your ride booking has been confirmed',
            data: { type: 'booking_confirmation' }
        },
        booking_cancellation: {
            title: 'Booking Cancelled',
            body: 'Your ride booking has been cancelled',
            data: { type: 'booking_cancellation' }
        },
        ride_cancellation: {
            title: '🚨 Ride Cancelled',
            body: 'Your ride has been cancelled by the agency',
            data: { type: 'ride_cancellation' }
        },
        ride_update: {
            title: '⚠️ Ride Updated',
            body: 'Your ride details have been updated',
            data: { type: 'ride_update' }
        },
        ride_completion: {
            title: 'Ride Completed',
            body: 'Your ride has been completed successfully',
            data: { type: 'ride_completion' }
        },
        private_ride_booked: {
            title: 'New Passenger',
            body: 'A new passenger has booked your private ride',
            data: { type: 'private_ride_booked' }
        },
        private_ride_completed: {
            title: 'Private Ride Completed',
            body: 'Your private ride has been completed',
            data: { type: 'private_ride_completed' }
        },
        reminder: {
            title: 'Ride Reminder',
            body: 'Your ride departs in 1 hour',
            data: { type: 'reminder' }
        },
        driver_change: {
            title: '🚨 Driver Changed',
            body: 'Your ride driver has been changed',
            data: { type: 'driver_change' }
        },
        emergency_cancellation: {
            title: '🚨 Emergency Cancellation',
            body: 'Your ride has been cancelled due to an emergency',
            data: { type: 'emergency_cancellation' }
        }
    }
};

// Helper functions
const isCriticalEvent = (notificationType, ride) => {
    const config = notificationConfig.notificationTypes[notificationType];
    if (!config || config.priority !== 'critical') return false;

    // If no critical threshold, it's always critical
    if (!config.criticalThreshold) return true;

    // Check if ride is within critical threshold
    if (!ride || !ride.departure_time) return false;

    const now = new Date();
    const departureTime = new Date(ride.departure_time);
    const timeUntilDeparture = (departureTime - now) / (1000 * 60); // minutes

    return timeUntilDeparture <= config.criticalThreshold;
};

const shouldSendSMS = (notificationType, ride) => {
    if (!notificationConfig.ENABLE_SMS) return false;

    const config = notificationConfig.notificationTypes[notificationType];
    if (!config) return false;

    // Always send SMS for critical events
    if (config.priority === 'critical') {
        return isCriticalEvent(notificationType, ride);
    }

    // For info events, only send SMS if explicitly configured
    return config.sms === true;
};

module.exports = {
    notificationConfig,
    isCriticalEvent,
    shouldSendSMS
}; 