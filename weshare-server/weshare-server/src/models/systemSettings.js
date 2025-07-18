const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
    // Fuel price settings
    fuelPricePerLiter: {
        type: Number,
        required: true,
        min: 0,
        default: 1700, // Default fuel price in RWF
        validate: {
            validator: function (value) {
                return value >= 0;
            },
            message: 'Fuel price cannot be negative'
        }
    },

    // Fuel efficiency validation settings
    fuelEfficiencyMin: {
        type: Number,
        required: true,
        min: 0,
        default: 6.0, // Minimum fuel efficiency in L/100km
        validate: {
            validator: function (value) {
                return value > 0 && value <= 50;
            },
            message: 'Minimum fuel efficiency must be between 0 and 50 L/100km'
        }
    },

    fuelEfficiencyMax: {
        type: Number,
        required: true,
        min: 0,
        default: 10.0, // Maximum fuel efficiency in L/100km
        validate: {
            validator: function (value) {
                return value > 0 && value <= 50;
            },
            message: 'Maximum fuel efficiency must be between 0 and 50 L/100km'
        }
    },

    // System metadata
    lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Make it optional for initial creation
    },

    // Timestamps
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Ensure only one system settings document exists
systemSettingsSchema.index({}, { unique: true });

// Static method to get current settings
systemSettingsSchema.statics.getCurrentSettings = async function () {
    let settings = await this.findOne();

    if (!settings) {
        // Create default settings if none exist
        settings = await this.create({
            fuelPricePerLiter: 1700,
            fuelEfficiencyMin: 6.0,
            fuelEfficiencyMax: 10.0,
            lastUpdatedBy: null // Will be set when first updated by admin
        });
    }

    return settings;
};

// Static method to update settings
systemSettingsSchema.statics.updateSettings = async function (updates, updatedBy) {
    let settings = await this.findOne();

    if (!settings) {
        // Create new settings if none exist
        settings = new this({
            fuelPricePerLiter: 1700,
            fuelEfficiencyMin: 6.0,
            fuelEfficiencyMax: 10.0,
            lastUpdatedBy: updatedBy || null
        });
    }

    // Update fields
    if (updates.fuelPricePerLiter !== undefined) {
        settings.fuelPricePerLiter = updates.fuelPricePerLiter;
    }
    if (updates.fuelEfficiencyMin !== undefined) {
        settings.fuelEfficiencyMin = updates.fuelEfficiencyMin;
    }
    if (updates.fuelEfficiencyMax !== undefined) {
        settings.fuelEfficiencyMax = updates.fuelEfficiencyMax;
    }

    // Only update lastUpdatedBy if provided
    if (updatedBy) {
        settings.lastUpdatedBy = updatedBy;
    }
    settings.updatedAt = new Date();

    return await settings.save();
};

// Instance method to validate fuel efficiency
systemSettingsSchema.methods.validateFuelEfficiency = function (fuelEfficiency) {
    return fuelEfficiency >= this.fuelEfficiencyMin && fuelEfficiency <= this.fuelEfficiencyMax;
};

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);

module.exports = SystemSettings; 