const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
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
    seats: {
        type: Number,
        required: true,
        min: 0,
    },
    agencyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agency',
        required: true,
    },
    status: {
        type: String,
        enum: ['active', 'canceled', 'completed', 'pending', 'delayed'],
        default: 'active',
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
    },
    description: {
        type: String,
        default: '',
    },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, 
});

rideSchema.index({ from: 1, to: 1, departure_time: 1 });

const Ride = mongoose.model('Ride', rideSchema);

module.exports = Ride;