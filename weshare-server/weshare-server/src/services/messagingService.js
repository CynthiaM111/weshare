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
    }
};

// Create and send a message
const createAndSendMessage = async (recipientId, recipientModel, rideId, messageType, metadata = {}) => {
    try {
        // Get recipient details
        const recipient = recipientModel === 'User'
            ? await User.findById(recipientId)
            : await Agency.findById(recipientId);

        if (!recipient) {
            console.error(`Recipient not found: ${recipientId} (${recipientModel})`);
            return null;
        }

        // Get ride details
        const ride = await Ride.findById(rideId);
        if (!ride) {
            console.error(`Ride not found: ${rideId}`);
            return null;
        }

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

        // Create message record
        const message = new Message({
            recipientId,
            recipientModel,
            rideId,
            type: messageType,
            title: template.title,
            content,
            metadata
        });

        await message.save();

        // Send SMS if recipient has a phone number
        if (recipient.contact_number) {
            try {
                await sendSMS(recipient.contact_number, content);
                message.smsSent = true;
                message.smsSentAt = new Date();
                await message.save();
                console.log(`SMS sent successfully to ${recipient.contact_number} for message type: ${messageType}`);
            } catch (smsError) {
                console.error(`Failed to send SMS to ${recipient.contact_number}:`, smsError);
                // Don't fail the entire operation if SMS fails
            }
        }

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
const sendBookingConfirmation = async (userId, rideId) => {
    return await createAndSendMessage(userId, 'User', rideId, 'booking_confirmation');
};

// Send booking cancellation message
const sendBookingCancellation = async (userId, rideId) => {
    return await createAndSendMessage(userId, 'User', rideId, 'booking_cancellation');
};

// Send ride update message to all passengers
const sendRideUpdateToPassengers = async (rideId, updates) => {
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
const sendRideCompletion = async (userId, rideId) => {
    return await createAndSendMessage(userId, 'User', rideId, 'completion');
};

// Send private ride booked message to driver
const sendPrivateRideBookedToDriver = async (rideId, passengerId) => {
    try {
        const ride = await Ride.findById(rideId).populate('userId bookedBy.userId');
        if (!ride) {
            console.error(`Ride not found: ${rideId}`);
            return;
        }

        const driver = ride.userId;
        const passenger = ride.bookedBy.find(b => b.userId._id.toString() === passengerId.toString())?.userId;

        if (!driver || !passenger) {
            console.error('Driver or passenger not found for private ride booking message');
            return;
        }

        await createAndSendMessage(
            driver._id,
            'User',
            rideId,
            'private_ride_booked',
            { passenger: passenger }
        );

        console.log(`Private ride booked message sent to driver ${driver._id}`);
    } catch (error) {
        console.error('Error sending private ride booked message to driver:', error);
        throw error;
    }
};

// Send private ride completed message to driver
const sendPrivateRideCompletedToDriver = async (rideId) => {
    try {
        const ride = await Ride.findById(rideId).populate('userId');
        if (!ride) {
            console.error(`Ride not found: ${rideId}`);
            return;
        }

        const driver = ride.userId;
        if (!driver) {
            console.error('Driver not found for private ride completion message');
            return;
        }

        await createAndSendMessage(
            driver._id,
            'User',
            rideId,
            'private_ride_completed'
        );

        console.log(`Private ride completed message sent to driver ${driver._id}`);
    } catch (error) {
        console.error('Error sending private ride completed message to driver:', error);
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

// Get messages for a user
const getUserMessages = async (userId, page = 1, limit = 20) => {
    try {
        const skip = (page - 1) * limit;
        const messages = await Message.find({
            recipientId: userId,
            recipientModel: 'User'
        })
            .populate('rideId', 'from to departure_time')
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Message.countDocuments({
            recipientId: userId,
            recipientModel: 'User'
        });

        return {
            messages,
            total,
            page,
            totalPages: Math.ceil(total / limit)
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

// Get unread message count for a user
const getUnreadMessageCount = async (userId) => {
    try {
        return await Message.countDocuments({
            recipientId: userId,
            recipientModel: 'User',
            isRead: false
        });
    } catch (error) {
        console.error('Error getting unread message count:', error);
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
    sendRideReminders,
    getUserMessages,
    markMessageAsRead,
    getUnreadMessageCount
}; 