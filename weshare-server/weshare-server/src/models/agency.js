const mongoose = require('mongoose');

const agencySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true,
        match: [/.+\@.+\..+/, 'Please enter a valid email address'],
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    contact_number: {
        type: String,
        trim: true,
        required: true,
        unique: true,
        match: [/^\+2507[2389]\d{7}$/, 'Please enter a valid Rwandan phone number'],
    },
    address: {
        type: String,
        trim: true,
    },
    role: { 
        type: String, enum: ['agency'], default: 'agency' 
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

agencySchema.index({ name: 1, email: 1 });

const Agency = mongoose.model('Agency', agencySchema);

module.exports = Agency;