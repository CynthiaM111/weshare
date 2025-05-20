const mongoose = require('mongoose');

const destinationCategorySchema = new mongoose.Schema({
    from: {
        type: String,
        required: true,
    },
    to: {
        type: String,
        required: true,
    },
    averageTime: {
        type: Number, // in hours
        required: true,
    },
    description: {
        type: String,
    },
    agencyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agency',
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    }
}, {
    timestamps: true
});

// Ensure unique combination of from-to for each agency
destinationCategorySchema.index({ from: 1, to: 1, agencyId: 1 }, { unique: true });

module.exports = mongoose.model('DestinationCategory', destinationCategorySchema);