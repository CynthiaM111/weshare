const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['user'], default: 'user' }, // Only normal users here
    name: { type: String, required: true },
    contact_number: { type: String, required: true },

    created_at: { type: Date, default: Date.now },
    booked_rides: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ride'
    }]
});

const User = mongoose.model('User', userSchema);
module.exports = User;