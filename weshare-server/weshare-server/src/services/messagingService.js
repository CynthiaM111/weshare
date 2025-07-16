const Message = require('../models/message');
const User = require('../models/user');
const Agency = require('../models/agency');
const Ride = require('../models/ride');
const AfricasTalking = require('africastalking');

const dotenv = require('dotenv');
dotenv.config();

const africastalking = AfricasTalking({
    apiKey: process.env.AFRICASTALKING_API_KEY,
    username: 'sandbox'
});

// Message templates for different ride operations
const messageTemplates = {
    booking_confirmation: {
        title: 'Booking Confirmed',
        content: (ride, user) => `Hi ${user.name}! Your booking for the ride from ${ride.from} to ${ride.to} on ${new Date(ride.departure_time).toLocaleDateString()} at ${new Date(ride.departure_time).toLocaleTimeString()} has been confirmed. Your booking ID is ${ride.bookedBy.find(b => b.userId.toString() === user._id.toString())?.bookingId}. Safe travels!`
    },
    booking_cancellation: {
        title: 'Booking Cancelled',
        content: (ride, user) => `Hi ${user.name}! Your booking for the ride from ${ride.from} to ${ride.to} on ${new Date(ride.departure_time).toLocaleDateString()} has been cancelled successfully.`
    },
    ride_update: {
        title: 'Ride Updated',
        content: (ride, user, updates) => {
            let updateDetails = [];
            if (updates.departure_time) {
                updateDetails.push(`departure time to ${new Date(updates.departure_time).toLocaleString()}`);
            }
            if (updates.seats) {
                updateDetails.push(`available seats to ${updates.seats}`);
            }
            if (updates.price) {
                updateDetails.push(`price to ${updates.price} RWF`);
            }
            return `Hi ${user.name}! Your ride from ${ride.from} to ${ride.to} has been updated. Changes: ${updateDetails.join(', ')}. Please check your booking details.`;
        }
    },
    ride_cancellation: {
        title: 'Ride Cancelled',
        content: (ride, user) => `Hi ${user.name}! The ride from ${ride.from} to ${ride.to} on ${new Date(ride.departure_time).toLocaleDateString()} has been cancelled by the agency. We apologize for any inconvenience.`
    },
    reminder: {
        title: 'Ride Reminder',
        content: (ride, user) => `Hi ${user.name}! Reminder: Your ride from ${ride.from} to ${ride.to} departs in 1 hour (${new Date(ride.departure_time).toLocaleTimeString()}). Please arrive 15 minutes early.`
    },
    completion: {
        title: 'Ride Completed',
        content: (ride, user) => `Hi ${user.name}! Your ride from ${ride.from} to ${ride.to} has been completed. Thank you for using WeShare!`
    },
    private_ride_booked: {
        title: 'New Passenger Booked',
        content: (ride, driver, passenger) => `Hi ${driver.name}! A new passenger has booked your private ride from ${ride.from} to ${ride.to} on ${new Date(ride.departure_time).toLocaleDateString()}. Passenger: ${passenger.name}. You now have ${ride.booked_seats}/${ride.seats} seats filled.`
    },
    private_ride_completed: {
        title: 'Private Ride Completed',
        content: (ride, driver) => `Hi ${driver.name}! Your private ride from ${ride.from} to ${ride.to} has been completed successfully. All passengers have been marked as completed. Thank you for providing a great ride experience!`
    },
    ride_started: {
        title: 'Ride Started',
        content: (ride, user) => `Hi ${user.name}! Your ride from ${ride.from} to ${ride.to} has started. Have a safe journey!`
    }
};

// Create and send a message with SMS notification system
const createAndSendMessage = async (recipientId, recipientModel, rideId, messageType, metadata = {}) => {
    try {
        console.log(`Creating message for recipient ${recipientId} (${recipientModel}) for ride ${rideId}, type: ${messageType}`);

        // Get recipient details
        const recipient = recipientModel === 'User'
            ? await User.findById(recipientId)
            : await Agency.findById(recipientId);

        if (!recipient) {
            console.error(`Recipient not found: ${recipientId} (${recipientModel})`);
            return null;
        }

        console.log(`Found recipient: ${recipient.name} (${recipient.email})`);

        // Get ride details
        const ride = await Ride.findById(rideId);
        if (!ride) {
            console.error(`Ride not found: ${rideId}`);
            return null;
        }

        console.log(`Found ride: ${ride.from} to ${ride.to}`);

        // Get template
        const template = messageTemplates[messageType];
        if (!template) {
            console.error(`Message template not found for type: ${messageType}`);
            return null;
        }

        // Generate content
        const content = typeof template.content === 'function'
            ? template.content(ride, recipient, metadata)
            : template.content;

        console.log(`Generated content: ${content.substring(0, 100)}...`);

        // Create message record
        const message = new Message({
            recipientId,
            recipientModel,
            rideId,
            type: messageType,
            title: template.title,
            content,
            metadata: {
                ...metadata,
                notificationPriority: 'info', // Always 'info' as per new logic
                sentViaSMS: true // Always true as per new logic
            }
        });

        await message.save();
        console.log(`Message saved to database with ID: ${message._id}`);

        // Send SMS if conditions are met
        if (recipient.contact_number) {
            console.log(`Attempting to send SMS to ${recipient.contact_number}`);
            try {
                await sendSMS(recipient.contact_number, content);
                message.smsSent = true;
                message.smsSentAt = new Date();
                console.log(`SMS sent successfully to ${recipient.contact_number} for message type: ${messageType}`);
            } catch (smsError) {
                console.error(`Failed to send SMS to ${recipient.contact_number}:`, smsError);
                message.metadata.smsError = smsError.message;
            }
        } else {
            console.log(`SMS not sent: no contact number for ${recipient.name}`);
        }

        await message.save();
        console.log(`Message updated and saved successfully`);
        return message;
    } catch (error) {
        console.error('Error creating and sending message:', error);
        throw error;
    }
};

// Send SMS using Africa's Talking
const sendSMS = async (phoneNumber, message) => {
    try {
        const result = await africastalking.SMS.send({
            to: [phoneNumber],
            message: message,
            from: 'WeShare'
        });
        console.log('SMS sent successfully:', result);
        return result;
    } catch (error) {
        console.error('SMS sending failed:', error);
        throw error;
    }
};

// Send booking confirmation message
const sendBookingConfirmation = async (rideId, userId) => {
    try {
        console.log(`Sending booking confirmation for ride ${rideId} to user ${userId}`);

        const message = await createAndSendMessage(userId, 'User', rideId, 'booking_confirmation');
        console.log(`Booking confirmation message sent successfully to user ${userId}`);

        // If it's a private ride, also notify the driver
        const ride = await Ride.findById(rideId);
        console.log(`Found ride:`, {
            rideId,
            isPrivate: ride?.isPrivate,
            driverId: ride?.userId,
            passengerId: userId
        });

        if (ride && ride.isPrivate && ride.userId) {
            console.log(`Sending private ride booked notification to driver ${ride.userId}`);
            await createAndSendMessage(ride.userId, 'User', rideId, 'private_ride_booked', {
                passengerId: userId
            });
            console.log(`Private ride booked notification sent successfully to driver ${ride.userId}`);
        } else {
            console.log(`Not sending private ride notification:`, {
                rideExists: !!ride,
                isPrivate: ride?.isPrivate,
                hasDriver: !!ride?.userId
            });
        }

        return message;
    } catch (error) {
        console.error('Error sending booking confirmation:', error);
        throw error;
    }
};

// Send booking cancellation message
const sendBookingCancellation = async (rideId, userId) => {
    try {
        return await createAndSendMessage(userId, 'User', rideId, 'booking_cancellation');
    } catch (error) {
        console.error('Error sending booking cancellation:', error);
        throw error;
    }
};

// Send ride update message to all passengers
const sendRideUpdateToPassengers = async (rideId, updates) => {
    try {
        const ride = await Ride.findById(rideId).populate('bookedBy.userId');
        if (!ride) {
            console.error(`Ride not found: ${rideId}`);
            return;
        }

        const userIds = ride.bookedBy.map(booking => booking.userId._id);

        // Send individual messages for tracking
        const messagePromises = ride.bookedBy.map(booking =>
            createAndSendMessage(
                booking.userId._id,
                'User',
                rideId,
                'ride_update',
                { updates }
            )
        );

        await Promise.all(messagePromises);
        console.log(`Ride update messages sent to ${ride.bookedBy.length} passengers`);
    } catch (error) {
        console.error('Error sending ride update messages:', error);
        throw error;
    }
};

// Send ride cancellation message to all passengers
const sendRideCancellationToPassengers = async (rideId) => {
    console.log(`Sending ride cancellation message to passengers for ride ${rideId}`);
    try {
        const ride = await Ride.findById(rideId).populate('bookedBy.userId');
        if (!ride) {
            console.error(`Ride not found: ${rideId}`);
            return;
        }

        const messagePromises = ride.bookedBy.map(booking =>
            createAndSendMessage(
                booking.userId._id,
                'User',
                rideId,
                'ride_cancellation'
            )
        );

        await Promise.all(messagePromises);
        console.log(`Ride cancellation messages sent to ${ride.bookedBy.length} passengers`);
    } catch (error) {
        console.error('Error sending ride cancellation messages:', error);
        throw error;
    }
};

// Send ride completion message
const sendRideCompletion = async (rideId, userId) => {
    try {
        return await createAndSendMessage(userId, 'User', rideId, 'completion');
    } catch (error) {
        console.error('Error sending ride completion:', error);
        throw error;
    }
};

// Send private ride booked message to driver
const sendPrivateRideBookedToDriver = async (rideId, driverId, passengerId) => {
    try {
        return await createAndSendMessage(driverId, 'User', rideId, 'private_ride_booked', {
            passengerId
        });
    } catch (error) {
        console.error('Error sending private ride booked to driver:', error);
        throw error;
    }
};

// Send private ride completed message to driver
const sendPrivateRideCompletedToDriver = async (rideId, driverId) => {
    try {
        return await createAndSendMessage(driverId, 'User', rideId, 'private_ride_completed');
    } catch (error) {
        console.error('Error sending private ride completed to driver:', error);
        throw error;
    }
};

// Send ride started message to passengers
const sendRideStarted = async (userId, rideId) => {
    try {
        return await createAndSendMessage(userId, 'User', rideId, 'ride_started');
    } catch (error) {
        console.error('Error sending ride started message:', error);
        throw error;
    }
};

// Send private ride completed message to driver (alias for consistency)
const sendPrivateRideCompleted = async (driverId, rideId) => {
    try {
        return await createAndSendMessage(driverId, 'User', rideId, 'private_ride_completed');
    } catch (error) {
        console.error('Error sending private ride completed to driver:', error);
        throw error;
    }
};

// Send reminder messages for rides departing soon
const sendRideReminders = async () => {
    try {
        const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
        const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);

        const rides = await Ride.find({
            departure_time: { $gte: oneHourFromNow, $lte: twoHoursFromNow },
            status: 'active'
        }).populate('bookedBy.userId');

        for (const ride of rides) {
            const messagePromises = ride.bookedBy.map(booking =>
                createAndSendMessage(
                    booking.userId._id,
                    'User',
                    ride._id,
                    'reminder'
                )
            );

            await Promise.all(messagePromises);
        }

        console.log(`Reminder messages sent for ${rides.length} rides`);
    } catch (error) {
        console.error('Error sending ride reminders:', error);
        throw error;
    }
};

// Get user messages with pagination
const getUserMessages = async (userId, page = 1, limit = 20) => {
    try {
        const skip = (page - 1) * limit;

        const messages = await Message.find({
            recipientId: userId,
            recipientModel: 'User'
        })
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit)
            .populate('rideId', 'from to departure_time');

        const total = await Message.countDocuments({
            recipientId: userId,
            recipientModel: 'User'
        });

        return {
            messages,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        console.error('Error getting user messages:', error);
        throw error;
    }
};

// Mark message as read
const markMessageAsRead = async (messageId, userId) => {
    try {
        const message = await Message.findOneAndUpdate(
            {
                _id: messageId,
                recipientId: userId,
                recipientModel: 'User'
            },
            {
                isRead: true,
                readAt: new Date()
            },
            { new: true }
        );

        return message;
    } catch (error) {
        console.error('Error marking message as read:', error);
        throw error;
    }
};

// Get unread message count
const getUnreadMessageCount = async (userId) => {
    try {
        console.log(`Calculating unread count for user: ${userId}`);

        const count = await Message.countDocuments({
            recipientId: userId,
            recipientModel: 'User',
            isRead: false
        });

        console.log(`Found ${count} unread messages for user ${userId}`);
        return { count };
    } catch (error) {
        console.error('Error getting unread message count:', error);
        throw error;
    }
};

// Get unread count by priority
const getUnreadCountByPriority = async (userId) => {
    try {
        return await Message.getUnreadCountByPriority(userId);
    } catch (error) {
        console.error('Error getting unread count by priority:', error);
        throw error;
    }
};

// Get delivery statistics
const getDeliveryStats = async (userId, days = 7) => {
    try {
        return await Message.getDeliveryStats(userId, days);
    } catch (error) {
        console.error('Error getting delivery stats:', error);
        throw error;
    }
};

// Mark all notifications as read
const markAllAsRead = async (filter) => {
    try {
        return await Message.updateMany(filter, {
            isRead: true,
            readAt: new Date()
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
    }
};

module.exports = {
    createAndSendMessage,
    sendSMS,
    sendBookingConfirmation,
    sendBookingCancellation,
    sendRideUpdateToPassengers,
    sendRideCancellationToPassengers,
    sendRideCompletion,
    sendPrivateRideBookedToDriver,
    sendPrivateRideCompletedToDriver,
    sendRideStarted,
    sendPrivateRideCompleted,
    sendRideReminders,
    getUserMessages,
    markMessageAsRead,
    getUnreadMessageCount,
    getUnreadCountByPriority,
    getDeliveryStats,
    markAllAsRead
}; 