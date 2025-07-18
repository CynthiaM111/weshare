const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, unique: true, trim: true, lowercase: true, sparse: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['user', 'agency_employee', 'super_admin'], default: 'user' },
    name: { type: String, required: true },
    contact_number: { type: String, required: true, unique: true, match: [/^\+2507[2389]\d{7}$/, 'Please enter a valid Rwandan phone number'] },
    photoUrl: { type: String, trim: true }, // Profile photo URL
    isVerified: { type: Boolean, default: false },
    verificationCode: { type: String },
    verificationCodeExpires: { type: Date },
    agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency' },
    destinationCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'DestinationCategory' },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' }, // Admin management
    created_at: { type: Date, default: Date.now },
    booked_rides: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ride'
    }],

    // Driver verification fields
    verifiedDriver: {
        type: Boolean,
        default: false
    },

    driverProfile: {
        fullName: {
            type: String,
            trim: true
        },
        dateOfBirth: {
            type: Date
        },
        nationalId: {
            type: String,
            trim: true,
            validate: {
                validator: function (v) {
                    return /^\d{16}$/.test(v);
                },
                message: 'National ID must be exactly 16 digits'
            }
        },
        vehicleLicensePlate: {
            type: String,
            trim: true,
            validate: {
                validator: function (v) {
                    return /^[A-Z0-9]{2,7}$/.test(v);
                },
                message: 'License plate must be 2-7 characters, letters and numbers only'
            }
        },
        verificationDate: {
            type: Date,
            default: Date.now
        }
    }
}, {
    timestamps: true
});

// Create indexes
userSchema.index({ contact_number: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true, sparse: true });

const User = mongoose.model('User', userSchema);

// Ensure indexes are created
const ensureIndexes = async () => {
    try {
        await User.createIndexes();
        console.log('User model indexes created successfully');
    } catch (error) {
        console.error('Error creating User model indexes:', error);
    }
};

ensureIndexes();

module.exports = User;