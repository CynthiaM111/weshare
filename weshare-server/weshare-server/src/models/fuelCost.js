const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const fuelCostSchema = new mongoose.Schema({
    // Primary Reference - Use rideId as the main identifier
    rideId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ride',
        required: true,
        unique: true // Each ride can only have one fuel cost record
    },

    // Location Information (GPS Coordinates)
    startLocation: {
        latitude: {
            type: Number,
            required: true,
            min: -90,
            max: 90
        },
        longitude: {
            type: Number,
            required: true,
            min: -180,
            max: 180
        },
        address: {
            type: String,
            trim: true,
            default: ''
        }
    },

    endLocation: {
        latitude: {
            type: Number,
            required: true,
            min: -90,
            max: 90
        },
        longitude: {
            type: Number,
            required: true,
            min: -180,
            max: 180
        },
        address: {
            type: String,
            trim: true,
            default: ''
        }
    },
    // Trip Status and Metadata
    status: {
        type: String,
        enum: ['estimated', 'in_progress', 'completed', 'cancelled'],
        default: 'estimated'
    },

    // Distance and Route Information
    distanceKm: {
        type: Number,
        required: true,
        min: 0,
        validate: {
            validator: function (value) {
                return value > 0;
            },
            message: 'Distance must be greater than 0'
        }
    },

    // Vehicle and Fuel Information
    vehicleInfo: {
        fuelEfficiency: {
            type: Number,
            required: true,
            min: 0,
            default: 7.0, // Default: 7L/100km
            validate: {
                validator: function (value) {
                    return value > 0 && value <= 50; // Reasonable range: 0-50L/100km
                },
                message: 'Fuel efficiency must be between 0 and 50 L/100km'
            }
        },
        fuelType: {
            type: String,
            enum: ['petrol', 'diesel', 'hybrid', 'electric'],
            default: 'petrol'
        },
        vehicleModel: {
            type: String,
            trim: true,
            default: ''
        }
    },

    // Fuel Cost Calculations
    fuelPricePerLiter: {
        type: Number,
        required: true,
        min: 0,
        default: () => Number(process.env.DEFAULT_FUEL_PRICE_PER_LITER) || 1700
    },

    estimatedFuelLiters: {
        type: Number,
        required: true,
        min: 0,
        
    },

    estimatedFuelCost: {
        type: Number,
        required: true,
        min: 0,
        validate: {
            validator: function (value) {
                return value >= 0;
            },
            message: 'Estimated fuel cost cannot be negative'
        }
    },

    // Driver reference (can be derived from ride, but stored for convenience)
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },

    actualFuelUsed: {
        type: Number,
        min: 0,
        default: null
    },

    actualFuelCost: {
        type: Number,
        min: 0,
        default: null
    },

    // Additional metadata
    notes: {
        type: String,
        trim: true,
        default: ''
    },

    // Timestamps
    estimatedAt: {
        type: Date,
        default: Date.now
    },

    completedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Virtual for cost per kilometer
fuelCostSchema.virtual('costPerKm').get(function () {
    return this.distanceKm > 0 ? this.estimatedFuelCost / this.distanceKm : 0;
});

// Virtual for fuel efficiency in km/L
fuelCostSchema.virtual('fuelEfficiencyKmPerL').get(function () {
    return this.vehicleInfo.fuelEfficiency > 0 ? 100 / this.vehicleInfo.fuelEfficiency : 0;
});

// Virtual for actual vs estimated cost difference
fuelCostSchema.virtual('costDifference').get(function () {
    if (this.actualFuelCost && this.estimatedFuelCost) {
        return this.actualFuelCost - this.estimatedFuelCost;
    }
    return null;
});

// Ensure virtuals are included in toJSON and toObject
fuelCostSchema.set('toJSON', { virtuals: true });
fuelCostSchema.set('toObject', { virtuals: true });

// Pre-save middleware to calculate fuel consumption and cost
fuelCostSchema.pre('save', function (next) {
    // Calculate estimated fuel liters if not provided
    if (!this.estimatedFuelLiters && this.distanceKm && this.vehicleInfo.fuelEfficiency) {
        this.estimatedFuelLiters = (this.distanceKm * this.vehicleInfo.fuelEfficiency) / 100;
    }

    // Calculate estimated fuel cost
    if (this.estimatedFuelLiters && this.fuelPricePerLiter) {
        this.estimatedFuelCost = this.estimatedFuelLiters * this.fuelPricePerLiter;
    }

    next();
});

// Indexes for better query performance
fuelCostSchema.index({ rideId: 1 }, { unique: true });
fuelCostSchema.index({ driverId: 1 });
fuelCostSchema.index({ status: 1 });
fuelCostSchema.index({ estimatedAt: -1 });
fuelCostSchema.index({ 'startLocation.latitude': 1, 'startLocation.longitude': 1 });
fuelCostSchema.index({ 'endLocation.latitude': 1, 'endLocation.longitude': 1 });

// Static method to calculate fuel cost
fuelCostSchema.statics.calculateFuelCost = function (distanceKm, fuelEfficiency, fuelPricePerLiter) {
    const fuelLiters = (distanceKm * fuelEfficiency) / 100;
    const fuelCost = fuelLiters * fuelPricePerLiter;

    return {
        fuelLiters: Math.round(fuelLiters * 100) / 100, // Round to 2 decimal places
        fuelCost: Math.round(fuelCost * 100) / 100 // Round to 2 decimal places
    };
};

// Instance method to update with actual values
fuelCostSchema.methods.updateWithActualValues = function (actualFuelUsed, actualFuelCost) {
    this.actualFuelUsed = actualFuelUsed;
    this.actualFuelCost = actualFuelCost;
    this.status = 'completed';
    this.completedAt = new Date();
    return this.save();
};

// Instance method to calculate distance between two GPS points (Haversine formula)
fuelCostSchema.statics.calculateDistance = function (lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // Round to 2 decimal places
};

const FuelCost = mongoose.model('FuelCost', fuelCostSchema);

module.exports = FuelCost; 