const ruleValidator = require('../Utilities/ruleValidator');

/**
 * Middleware factory for rule validation
 * @param {string} entity - The entity type (e.g., 'ride', 'booking')
 * @param {string} action - The action to validate (e.g., 'delete', 'cancel', 'create')
 * @param {Function} contextBuilder - Function to build context from request
 * @returns {Function} - Express middleware function
 */
const createRuleValidationMiddleware = (entity, action, contextBuilder) => {
    return async (req, res, next) => {
        try {
            // Build context from request
            const context = await contextBuilder(req);

            // Validate action against rules
            const validationResult = ruleValidator.validateAction(entity, action, context);

            if (!validationResult.isValid) {
                return res.status(400).json({
                    error: validationResult.message,
                    action: `${entity}.${action}`,
                    timestamp: new Date().toISOString()
                });
            }

            // Store post-action data in request for later use
            if (validationResult.postAction) {
                req.postAction = validationResult.postAction;
            }

            next();
        } catch (error) {
            console.error('Rule validation middleware error:', error);
            return res.status(500).json({
                error: 'Validation error occurred',
                action: `${entity}.${action}`
            });
        }
    };
};

/**
 * Predefined context builders for common scenarios
 */
const contextBuilders = {
    /**
     * Builds context for ride actions
     */
    rideAction: async (req) => {
        const rideId = req.params.id || req.params.rideId;
        const Ride = require('../models/ride');

        const ride = await Ride.findById(rideId);
        if (!ride) {
            throw new Error('Ride not found');
        }

        return ruleValidator.createRideContext(ride, req.user);
    },

    /**
     * Builds context for booking actions
     */
    bookingAction: async (req) => {
        const rideId = req.params.rideId;
        const Ride = require('../models/ride');

        const ride = await Ride.findById(rideId);
        if (!ride) {
            throw new Error('Ride not found');
        }

        // Find the user's booking
        const booking = ride.bookedBy.find(b => b.userId.toString() === req.user.id);
        if (!booking) {
            throw new Error('Booking not found');
        }

        return ruleValidator.createBookingContext(booking, ride, req.user);
    },

    /**
     * Builds context for booking creation
     */
    bookingCreation: async (req) => {
        const rideId = req.params.rideId;
        const Ride = require('../models/ride');

        const ride = await Ride.findById(rideId);
        if (!ride) {
            throw new Error('Ride not found');
        }

        return ruleValidator.createRideContext(ride, req.user);
    }
};

/**
 * Helper function to execute post-actions
 * @param {Object} postAction - The post-action configuration
 * @param {Object} context - The context data
 */
const executePostAction = async (postAction, context) => {
    if (!postAction) return;

    try {
        // Handle different post-action types
        if (postAction.change_status_to) {
            // Update ride status
            const Ride = require('../models/ride');
            await Ride.findByIdAndUpdate(context.rideId, {
                status: postAction.change_status_to
            });
        }

        if (postAction.free_up_seat) {
            // This would be handled in the controller after successful cancellation
            // The seat is already freed in the existing logic
        }

        if (postAction.notify_booked_users) {
            // This would trigger notification logic
            // Could integrate with existing messaging service
        }

    } catch (error) {
        console.error('Error executing post-action:', error);
        // Don't throw error as post-action failure shouldn't fail the main action
    }
};

module.exports = {
    createRuleValidationMiddleware,
    contextBuilders,
    executePostAction
}; 