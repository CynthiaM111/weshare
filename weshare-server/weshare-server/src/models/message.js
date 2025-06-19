const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'recipientModel',
        required: true
    },
    recipientModel: {
        type: String,
        required: true,
        enum: ['User', 'Agency']
    },
    rideId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ride',
        required: true
    },
    type: {
        type: String,
        enum: ['booking_confirmation', 'booking_cancellation', 'ride_update', 'ride_cancellation', 'reminder', 'completion'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    smsSent: {
        type: Boolean,
        default: false
    },
    smsSentAt: {
        type: Date
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes for efficient querying
messageSchema.index({ recipientId: 1, recipientModel: 1 });
messageSchema.index({ rideId: 1 });
messageSchema.index({ type: 1 });
messageSchema.index({ isRead: 1 });
messageSchema.index({ created_at: -1 });

// Virtual for message age
messageSchema.virtual('age').get(function () {
    return Date.now() - this.created_at.getTime();
});

// Ensure virtuals are included in toJSON and toObject
messageSchema.set('toJSON', { virtuals: true });
messageSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Message', messageSchema); 