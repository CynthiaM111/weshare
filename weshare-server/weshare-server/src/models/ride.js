const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DestinationCategory',
        required: function () {
            return !this.isPrivate;
        }
    },
    from: {
        type: String,
        required: true,
        trim: true,
    },
    to: {
        type: String,
        required: true,
        trim: true,
    },
    departure_time: {
        type: Date,
        required: true,
    },
    estimatedArrivalTime: {
        type: Date,
        required: true,
    },
    seats: {
        type: Number,
        required: true,
        min: 0,
    },
    agencyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agency',
        required: function () {
            return !this.isPrivate;
        }
    },
    licensePlate: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: function (plate) {
                const trimmed = plate.trim().toUpperCase();
                const regex = /^[A-Z0-9]{2,7}$/;
                return regex.test(trimmed);
            },
            message: 'Invalid license plate format'
        }
    },
    status: {
        type: String,
        enum: ['active', 'canceled', 'completed', 'pending', 'delayed'],
        default: 'active',
    },
    publishStatus: {
        type: String,
        enum: ['draft', 'published'],
        default: 'draft',
    },
    isPrivate: {
        type: Boolean,
        default: false,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',

    },
    price: {
        type: Number,
        default: 0,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: {
        type: Date,
        default: Date.now,
    },
    booked_seats: {
        type: Number,
        default: 0,
        min: 0,
        validate: {
            validator: function (value) {
                return value <= this.seats;
            },
            message: 'Booked seats cannot exceed total seats'
        }
    },
    description: {
        type: String,
        default: '',
    },
    bookedBy: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        checkInStatus: { type: String, enum: ['pending', 'checked-in', 'completed'], default: 'pending' },
        bookingId: { type: String, required: true }, // Unique ID for QR code
        completionPin: { type: String }, // PIN for ride completion
        pinGeneratedAt: { type: Date }, // When the PIN was generated
        completedAt: { type: Date } // When the ride was completed
    }],
    // booked_users: [{
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'User'
    // }]
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

// Virtual for available_seats
rideSchema.virtual('available_seats').get(function () {
    return this.seats - this.booked_seats;
});

// Ensure virtuals are included in toJSON and toObject
rideSchema.set('toJSON', { virtuals: true });
rideSchema.set('toObject', { virtuals: true });


rideSchema.index({ from: 1, to: 1, departure_time: 1 });
rideSchema.index({ departure_time: 1 });
rideSchema.index({ status: 1, departure_time: 1 });

const Ride = mongoose.model('Ride', rideSchema);

module.exports = Ride;