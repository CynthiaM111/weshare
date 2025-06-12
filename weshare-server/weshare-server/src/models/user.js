const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, unique: true, trim: true, lowercase: true, sparse: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['user', 'agency_employee'], default: 'user' }, // Only normal users here
    name: { type: String, required: true },
    contact_number: { type: String, required: true, unique: true, match: [/^\+2507[2389]\d{7}$/, 'Please enter a valid Rwandan phone number']},
    agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency' },
    destinationCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'DestinationCategory' },
    created_at: { type: Date, default: Date.now },
    booked_rides: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ride'
    }]
});

const User = mongoose.model('User', userSchema);
module.exports = User;