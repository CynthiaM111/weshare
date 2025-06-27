const rideRules = require('../rules/rideRules');

class RuleValidator {
    constructor() {
        this.rules = rideRules;
    }

    /**
     * Validates an action against the defined rules
     * @param {string} entity - The entity type (e.g., 'ride', 'booking')
     * @param {string} action - The action to validate (e.g., 'delete', 'cancel', 'create')
     * @param {Object} context - The context data (ride, booking, user, etc.)
     * @returns {Object} - { isValid: boolean, message: string, postAction: Object, errorCode: string }
     */
    validateAction(entity, action, context) {
        try {
            const rule = this.rules[entity]?.[action];
            if (!rule) {
                return {
                    isValid: false,
                    message: `No rules defined for ${entity}.${action}`,
                    postAction: null,
                    errorCode: 'VALIDATION_ERROR'
                };
            }

            // Check denied_if conditions first (these take precedence)
            const deniedResult = this.checkDeniedConditions(rule.denied_if, context);
            if (!deniedResult.isValid) {
                return {
                    isValid: false,
                    message: deniedResult.message,
                    postAction: null,
                    errorCode: deniedResult.errorCode || 'BUSINESS_RULE_VIOLATION'
                };
            }

            // Check allowed_if conditions
            const allowedResult = this.checkAllowedConditions(rule.allowed_if, context);
            if (!allowedResult.isValid) {
                return {
                    isValid: false,
                    message: allowedResult.message,
                    postAction: null,
                    errorCode: allowedResult.errorCode || 'BUSINESS_RULE_VIOLATION'
                };
            }

            // Action is valid, return post_action if defined
            return {
                isValid: true,
                message: 'Action is allowed',
                postAction: rule.post_action || null,
                errorCode: null
            };

        } catch (error) {
            console.error('Error in rule validation:', error);
            return {
                isValid: false,
                message: 'Validation error occurred',
                postAction: null,
                errorCode: 'VALIDATION_ERROR'
            };
        }
    }

    /**
     * Checks denied_if conditions
     * @param {Array} deniedConditions - Array of denied conditions
     * @param {Object} context - The context data
     * @returns {Object} - { isValid: boolean, message: string, errorCode: string }
     */
    checkDeniedConditions(deniedConditions, context) {
        if (!deniedConditions || !Array.isArray(deniedConditions)) {
            return { isValid: true, message: '', errorCode: null };
        }

        for (const condition of deniedConditions) {
            const isDenied = this.evaluateCondition(condition, context);
            if (isDenied) {
                // Determine specific error code based on the condition
                const errorCode = this.getErrorCodeForCondition(condition, context);
                return {
                    isValid: false,
                    message: condition.error || 'Action is not allowed',
                    errorCode: errorCode
                };
            }
        }

        return { isValid: true, message: '', errorCode: null };
    }

    /**
     * Gets specific error code based on the condition that was violated
     * @param {Object} condition - The condition that was violated
     * @param {Object} context - The context data
     * @returns {string} - The error code
     */
    getErrorCodeForCondition(condition, context) {
        // Check for specific conditions and return appropriate error codes
        for (const [key, value] of Object.entries(condition)) {
            if (key === 'error' || key === 'error_code') continue;

            // Ride deletion specific errors
            if (key === 'bookings_count' && value && value.greater_than === 0) {
                return 'RIDE_HAS_BOOKINGS';
            }
            if (key === 'status' && value === 'canceled') {
                return 'RIDE_ALREADY_CANCELED';
            }
            if (key === 'departure_time' && value === 'in_past') {
                return 'RIDE_IN_PAST';
            }

            // Ride cancellation specific errors
            if (key === 'departure_time' && value && value.minutes_from_now) {
                const minutesCheck = value.minutes_from_now;
                if (minutesCheck.less_than_or_equal === 30) {
                    return 'CANCELLATION_TOO_LATE';
                }
            }

            // Ride update specific errors
            if (key === 'departure_time' && value && value.minutes_from_now) {
                const minutesCheck = value.minutes_from_now;
                if (minutesCheck.less_than_or_equal === 60) {
                    return 'UPDATE_TOO_LATE';
                }
            }

            // Booking creation specific errors
            if (key === 'ride_status' && value === 'canceled') {
                return 'RIDE_CANCELED';
            }
            if (key === 'available_seats' && value === 0) {
                return 'RIDE_FULLY_BOOKED';
            }
            if (key === 'departure_time' && value === 'in_past') {
                return 'RIDE_ALREADY_STARTED';
            }
            if (key === 'departure_time' && value && value.minutes_from_now) {
                const minutesCheck = value.minutes_from_now;
                if (minutesCheck.less_than_or_equal === 10) {
                    return 'BOOKING_TOO_LATE';
                }
            }
            if (key === 'user_already_booked' && value === true) {
                return 'ALREADY_BOOKED';
            }
            if (key === 'user_booking_limit_reached' && value === true) {
                return 'BOOKING_LIMIT_REACHED';
            }
            if (key === 'time_conflict' && value === true) {
                return 'TIME_CONFLICT';
            }

            // Booking cancellation specific errors
            if (key === 'status' && value === 'completed') {
                return 'BOOKING_ALREADY_COMPLETED';
            }
            if (key === 'status' && value === 'checked-in') {
                return 'BOOKING_ALREADY_CHECKED_IN';
            }
        }

        return 'BUSINESS_RULE_VIOLATION';
    }

    /**
     * Checks allowed_if conditions
     * @param {Object} allowedConditions - Object of allowed conditions
     * @param {Object} context - The context data
     * @returns {Object} - { isValid: boolean, message: string }
     */
    checkAllowedConditions(allowedConditions, context) {
        if (!allowedConditions || typeof allowedConditions !== 'object') {
            return { isValid: true, message: '' };
        }

        for (const [key, expectedValue] of Object.entries(allowedConditions)) {
            const actualValue = this.getContextValue(key, context);
            const isAllowed = this.compareValues(actualValue, expectedValue);

            if (!isAllowed) {
                return {
                    isValid: false,
                    message: `Condition not met: ${key} does not match expected value`
                };
            }
        }

        return { isValid: true, message: '' };
    }

    /**
     * Evaluates a condition against context data
     * @param {Object} condition - The condition to evaluate
     * @param {Object} context - The context data
     * @returns {boolean} - True if condition is met
     */
    evaluateCondition(condition, context) {
        for (const [key, value] of Object.entries(condition)) {
            if (key === 'error' || key === 'error_code') continue;

            switch (key) {
                case 'bookings_count':
                    if (typeof value === 'number') {
                        if (context.bookings_count !== value) return false;
                    } else if (value.greater_than !== undefined) {
                        if (context.bookings_count <= value.greater_than) return false;
                    }
                    break;

                case 'status':
                    if (context.status !== value) return false;
                    break;

                case 'departure_time':
                    if (value === 'in_future') {
                        if (new Date(context.departure_time) <= new Date()) return false;
                    } else if (value === 'in_past') {
                        if (new Date(context.departure_time) > new Date()) return false;
                    } else if (value.minutes_from_now) {
                        const minutesCheck = value.minutes_from_now;
                        const departureTime = new Date(context.departure_time);
                        const now = new Date();
                        const minutesDiff = (departureTime - now) / (1000 * 60);

                        if (minutesCheck.greater_than !== undefined) {
                            if (minutesDiff <= minutesCheck.greater_than) return false;
                        }
                        if (minutesCheck.less_than_or_equal !== undefined) {
                            if (minutesDiff > minutesCheck.less_than_or_equal) return false;
                        }
                    }
                    break;

                case 'ride_status':
                    if (context.ride_status !== value) return false;
                    break;

                case 'available_seats':
                    if (typeof value === 'number') {
                        if (context.available_seats !== value) return false;
                    } else if (value.greater_than !== undefined) {
                        if (context.available_seats <= value.greater_than) return false;
                    }
                    break;

                case 'user_not_already_booked':
                    if (value === true && context.user_already_booked === true) return false;
                    break;

                case 'user_booking_limit_not_reached':
                    if (value === true && context.user_booking_limit_reached === true) return false;
                    break;

                case 'no_time_conflict':
                    if (value === true && context.time_conflict === true) return false;
                    break;

                case 'user_already_booked':
                    if (value === true && context.user_already_booked !== true) return false;
                    break;

                case 'user_booking_limit_reached':
                    if (value === true && context.user_booking_limit_reached !== true) return false;
                    break;

                case 'time_conflict':
                    if (value === true && context.time_conflict !== true) return false;
                    break;

                default:
                    // For unknown conditions, assume they should match exactly
                    if (context[key] !== value) return false;
            }
        }
        return true;
    }

    /**
     * Gets a value from the context using dot notation
     * @param {string} key - The key to get (e.g., 'bookings_count', 'ride.status')
     * @param {Object} context - The context data
     * @returns {*} - The value from context
     */
    getContextValue(key, context) {
        const keys = key.split('.');
        let value = context;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return undefined;
            }
        }

        return value;
    }

    /**
     * Compares actual value with expected value, handling special cases
     * @param {*} actualValue - The actual value from context
     * @param {*} expectedValue - The expected value from rules
     * @returns {boolean} - True if values match according to the rule
     */
    compareValues(actualValue, expectedValue) {
        // Handle special string values
        if (typeof expectedValue === 'string') {
            switch (expectedValue) {
                case 'in_future':
                    return actualValue instanceof Date && actualValue > new Date();
                case 'in_past':
                    return actualValue instanceof Date && actualValue < new Date();
                default:
                    return actualValue === expectedValue;
            }
        }

        // Handle object comparisons (e.g., { greater_than: 0 })
        if (typeof expectedValue === 'object' && expectedValue !== null) {
            return this.compareObjectValues(actualValue, expectedValue);
        }

        // Simple equality comparison
        return actualValue === expectedValue;
    }

    /**
     * Compares values when expectedValue is an object with operators
     * @param {*} actualValue - The actual value
     * @param {Object} expectedValue - The expected value object with operators
     * @returns {boolean} - True if comparison passes
     */
    compareObjectValues(actualValue, expectedValue) {
        for (const [operator, value] of Object.entries(expectedValue)) {
            switch (operator) {
                case 'greater_than':
                    return actualValue > value;
                case 'less_than':
                    return actualValue < value;
                case 'greater_than_or_equal':
                    return actualValue >= value;
                case 'less_than_or_equal':
                    return actualValue <= value;
                case 'minutes_from_now':
                    if (typeof value === 'object') {
                        return this.compareMinutesFromNow(actualValue, value);
                    }
                    return this.compareMinutesFromNow(actualValue, { greater_than: value });
                default:
                    return false;
            }
        }
        return false;
    }

    /**
     * Compares time values with minutes from now
     * @param {Date} actualValue - The actual date
     * @param {Object} comparison - The comparison object
     * @returns {boolean} - True if comparison passes
     */
    compareMinutesFromNow(actualValue, comparison) {
        if (!(actualValue instanceof Date)) {
            return false;
        }

        const now = new Date();
        const minutesDiff = (actualValue.getTime() - now.getTime()) / (1000 * 60);

        for (const [operator, value] of Object.entries(comparison)) {
            switch (operator) {
                case 'greater_than':
                    return minutesDiff > value;
                case 'less_than':
                    return minutesDiff < value;
                case 'greater_than_or_equal':
                    return minutesDiff >= value;
                case 'less_than_or_equal':
                    return minutesDiff <= value;
                default:
                    return false;
            }
        }
        return false;
    }

    /**
     * Creates context object for ride actions
     * @param {Object} ride - The ride object
     * @param {Object} user - The user object (optional)
     * @returns {Object} - The context object
     */
    createRideContext(ride, user = null) {
        return {
            bookings_count: ride.bookedBy ? ride.bookedBy.length : 0,
            status: ride.status,
            departure_time: ride.departure_time,
            available_seats: ride.seats - (ride.booked_seats || 0),
            ride_status: ride.status,
            user: user
        };
    }

    /**
     * Creates context object for booking actions
     * @param {Object} booking - The booking object
     * @param {Object} ride - The ride object
     * @param {Object} user - The user object
     * @returns {Object} - The context object
     */
    createBookingContext(booking, ride, user) {
        return {
            status: booking.checkInStatus,
            departure_time: ride.departure_time,
            ride_status: ride.status,
            available_seats: ride.seats - (ride.booked_seats || 0),
            user: user
        };
    }

    /**
     * Creates enhanced context object for booking creation
     * @param {Object} ride - The ride object
     * @param {Object} user - The user object
     * @param {Object} userBookings - Array of user's existing bookings
     * @returns {Object} - The context object
     */
    createBookingCreationContext(ride, user, userBookings = []) {
        const userAlreadyBooked = ride.bookedBy && ride.bookedBy.some(b => b.userId.toString() === user.id);
        const userBookingLimitReached = userBookings.length >= 5;

        // Check for time conflicts (bookings within 2 hours of this ride's departure)
        const rideDeparture = new Date(ride.departure_time);
        const timeConflict = userBookings.some(booking => {
            const bookingDeparture = new Date(booking.departure_time);
            const timeDiff = Math.abs(rideDeparture - bookingDeparture) / (1000 * 60 * 60); // hours
            return timeDiff < 2;
        });

        return {
            bookings_count: ride.bookedBy ? ride.bookedBy.length : 0,
            status: ride.status,
            departure_time: ride.departure_time,
            available_seats: ride.seats - (ride.booked_seats || 0),
            ride_status: ride.status,
            user: user,
            user_already_booked: userAlreadyBooked,
            user_booking_limit_reached: userBookingLimitReached,
            time_conflict: timeConflict
        };
    }
}

module.exports = new RuleValidator(); 