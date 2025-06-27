// Enhanced API Error Handler for Agencyboard (Next.js)
export const ERROR_CODES = {
    // Network & Infrastructure
    NETWORK_ERROR: 'NETWORK_ERROR',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR',
    UNEXPECTED_CRASH: 'UNEXPECTED_CRASH',
    SERVER_ERROR: 'SERVER_ERROR',
    MAINTENANCE_MODE: 'MAINTENANCE_MODE',
    API_ENDPOINT_ERROR: 'API_ENDPOINT_ERROR',

    // Authentication
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    SESSION_EXPIRED: 'SESSION_EXPIRED',
    PHONE_NOT_VERIFIED: 'PHONE_NOT_VERIFIED',
    MISSING_FIELDS: 'MISSING_FIELDS',
    PHONE_ALREADY_EXISTS: 'PHONE_ALREADY_EXISTS',

    // Authorization
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    RATE_LIMITED: 'RATE_LIMITED',

    // Booking & Search
    NO_RIDES_FOUND: 'NO_RIDES_FOUND',
    RIDE_FULLY_BOOKED: 'RIDE_FULLY_BOOKED',
    INVALID_INPUT: 'INVALID_INPUT',
    BOOKING_FAILED: 'BOOKING_FAILED',
    RIDE_CANCELED: 'RIDE_CANCELED',

    // Ride Management
    MISSING_RIDE_DETAILS: 'MISSING_RIDE_DETAILS',
    INVALID_DATETIME: 'INVALID_DATETIME',
    RIDE_UPDATE_FAILED: 'RIDE_UPDATE_FAILED',
    RIDE_DELETE_FAILED: 'RIDE_DELETE_FAILED',

    // Business Rule Violations (New)
    RIDE_HAS_BOOKINGS: 'RIDE_HAS_BOOKINGS',
    RIDE_ALREADY_CANCELED: 'RIDE_ALREADY_CANCELED',
    RIDE_IN_PAST: 'RIDE_IN_PAST',
    RIDE_ALREADY_STARTED: 'RIDE_ALREADY_STARTED',
    CANCELLATION_TOO_LATE: 'CANCELLATION_TOO_LATE',
    BOOKING_ALREADY_COMPLETED: 'BOOKING_ALREADY_COMPLETED',
    BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
    VALIDATION_ERROR: 'VALIDATION_ERROR',

    // General
    BAD_REQUEST: 'BAD_REQUEST',
    NOT_FOUND: 'NOT_FOUND',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

export const ERROR_MESSAGES = {
    // Network & Infrastructure
    [ERROR_CODES.NETWORK_ERROR]: "No internet connection. Please check your network and try again.",
    [ERROR_CODES.TIMEOUT_ERROR]: "Request timed out. Please check your connection and try again.",
    [ERROR_CODES.UNEXPECTED_CRASH]: "Something went wrong. Please try again later.",
    [ERROR_CODES.SERVER_ERROR]: "We're having issues on our end. Please try again shortly.",
    [ERROR_CODES.MAINTENANCE_MODE]: "WeShare is temporarily unavailable for maintenance. Please check back soon.",
    [ERROR_CODES.API_ENDPOINT_ERROR]: "There's a configuration issue. Please try again or contact support if the problem persists.",

    // Authentication
    [ERROR_CODES.INVALID_CREDENTIALS]: "Incorrect email or password.",
    [ERROR_CODES.SESSION_EXPIRED]: "Session expired. Please log in again.",
    [ERROR_CODES.PHONE_NOT_VERIFIED]: "Please verify your phone number to continue.",
    [ERROR_CODES.MISSING_FIELDS]: "Please fill in all required fields.",
    [ERROR_CODES.PHONE_ALREADY_EXISTS]: "An account with this phone number already exists.",

    // Authorization
    [ERROR_CODES.UNAUTHORIZED]: "You're not authorized to perform this action.",
    [ERROR_CODES.FORBIDDEN]: "You don't have permission to perform this action.",
    [ERROR_CODES.RATE_LIMITED]: "You're doing that too much. Please wait and try again.",

    // Booking & Search
    [ERROR_CODES.NO_RIDES_FOUND]: "No rides match your search. Try adjusting your filters.",
    [ERROR_CODES.RIDE_FULLY_BOOKED]: "Sorry, this ride is already full.",
    [ERROR_CODES.INVALID_INPUT]: "Please select a valid date and time.",
    [ERROR_CODES.BOOKING_FAILED]: "Booking failed. Please try again.",
    [ERROR_CODES.RIDE_CANCELED]: "This ride has been canceled. Please search again.",

    // Ride Management
    [ERROR_CODES.MISSING_RIDE_DETAILS]: "Please fill in all required ride details.",
    [ERROR_CODES.INVALID_DATETIME]: "Please choose a valid date and time.",
    [ERROR_CODES.RIDE_UPDATE_FAILED]: "Couldn't update ride details. Try again later.",
    [ERROR_CODES.RIDE_DELETE_FAILED]: "Couldn't delete this ride. Try again later.",

    // Business Rule Violations (New)
    [ERROR_CODES.RIDE_HAS_BOOKINGS]: "Cannot delete ride with existing bookings. Please cancel the ride instead to notify passengers.",
    [ERROR_CODES.RIDE_ALREADY_CANCELED]: "This ride has already been canceled and cannot be deleted.",
    [ERROR_CODES.RIDE_IN_PAST]: "Cannot delete a ride that has already departed.",
    [ERROR_CODES.RIDE_ALREADY_STARTED]: "Cannot book a ride that has already started.",
    [ERROR_CODES.CANCELLATION_TOO_LATE]: "You cannot cancel your booking less than 30 minutes before departure.",
    [ERROR_CODES.BOOKING_ALREADY_COMPLETED]: "This booking has already been completed and cannot be canceled.",
    [ERROR_CODES.BUSINESS_RULE_VIOLATION]: "This action is not allowed due to business rules. Please check the details and try again.",
    [ERROR_CODES.VALIDATION_ERROR]: "Please check your input and try again.",

    // General
    [ERROR_CODES.BAD_REQUEST]: "Please check your input and try again.",
    [ERROR_CODES.NOT_FOUND]: "The requested information could not be found.",
    [ERROR_CODES.UNKNOWN_ERROR]: "Something went wrong. Please try again."
};

// Get specific error message from server response
const getSpecificErrorMessage = (error, errorCode) => {
    const serverMessage = error?.response?.data?.message || error?.response?.data?.error || '';
    const generalMessage = error?.message || '';

    // Extract specific details from server messages
    switch (errorCode) {
        case ERROR_CODES.INVALID_DATETIME:
            if (serverMessage.toLowerCase().includes('past')) {
                return "You cannot create a ride for a date and time in the past.";
            }
            if (serverMessage.toLowerCase().includes('future') || serverMessage.toLowerCase().includes('advance')) {
                return "You cannot create a ride more than 30 days in advance.";
            }
            if (serverMessage.toLowerCase().includes('weekend')) {
                return "Rides cannot be scheduled on weekends.";
            }
            if (serverMessage.toLowerCase().includes('hour')) {
                return "Rides must be scheduled at least 2 hours in advance.";
            }
            if (serverMessage.toLowerCase().includes('time')) {
                return "Please select a valid time. Rides are available from 6:00 AM to 10:00 PM.";
            }
            if (serverMessage.toLowerCase().includes('date')) {
                return "Please select a valid date.";
            }
            return "Please choose a valid date and time. Rides must be scheduled at least 2 hours in advance and cannot be more than 30 days ahead.";

        case ERROR_CODES.MISSING_FIELDS:
            if (serverMessage.toLowerCase().includes('origin') || serverMessage.toLowerCase().includes('from')) {
                return "Please enter a pickup location.";
            }
            if (serverMessage.toLowerCase().includes('destination') || serverMessage.toLowerCase().includes('to')) {
                return "Please enter a destination.";
            }
            if (serverMessage.toLowerCase().includes('seat') || serverMessage.toLowerCase().includes('capacity')) {
                return "Please specify the number of available seats.";
            }
            if (serverMessage.toLowerCase().includes('price') || serverMessage.toLowerCase().includes('cost')) {
                return "Please enter the ride price.";
            }
            if (serverMessage.toLowerCase().includes('license') || serverMessage.toLowerCase().includes('plate')) {
                return "Please enter your vehicle's license plate number.";
            }
            if (serverMessage.toLowerCase().includes('email')) {
                return "Please enter your email address.";
            }
            if (serverMessage.toLowerCase().includes('password')) {
                return "Please enter your password.";
            }
            if (serverMessage.toLowerCase().includes('name')) {
                return "Please enter your full name.";
            }
            if (serverMessage.includes(',') || serverMessage.includes('and')) {
                return `Please fill in the following required fields: ${serverMessage.replace(/are required|is required|field|fields/gi, '').trim()}`;
            }
            return "Please fill in all required fields.";

        case ERROR_CODES.INVALID_CREDENTIALS:
            if (serverMessage.toLowerCase().includes('email')) {
                return "The email address you entered is not registered.";
            }
            if (serverMessage.toLowerCase().includes('password')) {
                return "The password you entered is incorrect.";
            }
            return "Incorrect email or password. Please check your credentials and try again.";

        case ERROR_CODES.PHONE_ALREADY_EXISTS:
            return "An account with this phone number already exists. Please use a different phone number or try logging in.";

        case ERROR_CODES.RIDE_FULLY_BOOKED:
            if (serverMessage.toLowerCase().includes('seat')) {
                return "This ride is fully booked. All seats have been taken.";
            }
            return "Sorry, this ride is fully booked. Please look for other available rides.";

        case ERROR_CODES.BOOKING_FAILED:
            if (serverMessage.toLowerCase().includes('already booked')) {
                return "You have already booked this ride.";
            }
            if (serverMessage.toLowerCase().includes('conflict')) {
                return "You have another ride booked at the same time.";
            }
            if (serverMessage.toLowerCase().includes('payment')) {
                return "Booking failed due to a payment issue. Please check your payment method.";
            }
            return "Unable to book this ride. Please try again or contact support.";

        case ERROR_CODES.VALIDATION_ERROR:
            if (serverMessage.toLowerCase().includes('license') || serverMessage.toLowerCase().includes('plate')) {
                return "Please enter a valid license plate number (2-7 characters, letters and numbers only).";
            }
            if (serverMessage.toLowerCase().includes('email')) {
                return "Please enter a valid email address.";
            }
            if (serverMessage.toLowerCase().includes('phone')) {
                return "Please enter a valid phone number.";
            }
            if (serverMessage.toLowerCase().includes('price') || serverMessage.toLowerCase().includes('amount')) {
                return "Please enter a valid price (minimum $1, maximum $100).";
            }
            if (serverMessage.toLowerCase().includes('seat') || serverMessage.toLowerCase().includes('capacity')) {
                return "Please enter a valid number of seats (1-8 passengers).";
            }
            return `Please correct the following: ${serverMessage}`;

        case ERROR_CODES.RATE_LIMITED:
            if (serverMessage.toLowerCase().includes('minute')) {
                return "You're doing that too often. Please wait a minute before trying again.";
            }
            if (serverMessage.toLowerCase().includes('hour')) {
                return "You've reached the hourly limit. Please try again later.";
            }
            return "You're doing that too much. Please wait a few moments and try again.";

        case ERROR_CODES.NETWORK_ERROR:
            return "No internet connection. Please check your network and try again.";

        case ERROR_CODES.TIMEOUT_ERROR:
            return "The request is taking too long. Please check your connection and try again.";

        case ERROR_CODES.SERVER_ERROR:
            if (serverMessage.toLowerCase().includes('maintenance')) {
                return "The service is temporarily unavailable for maintenance. Please try again in a few minutes.";
            }
            return "We're experiencing technical difficulties. Please try again in a moment.";

        default:
            if (serverMessage && serverMessage.length > 0 && serverMessage.length < 200) {
                const cleanMessage = serverMessage
                    .replace(/validation failed/gi, '')
                    .replace(/error:/gi, '')
                    .replace(/invalid/gi, 'Please check')
                    .trim();

                if (cleanMessage.length > 10) {
                    return cleanMessage.charAt(0).toUpperCase() + cleanMessage.slice(1) +
                        (cleanMessage.endsWith('.') ? '' : '.');
                }
            }

            return ERROR_MESSAGES[errorCode] || "Something went wrong. Please try again.";
    }
};

// Check if app is in maintenance mode
const isMaintenanceMode = (error) => {
    if (error?.response?.status === 503) return true;
    if (error?.response?.data?.maintenance) return true;
    if (error?.message?.includes('maintenance')) return true;
    return false;
};

// Check if it's likely a malformed URL/endpoint error
const isEndpointError = (error) => {
    if (error?.response?.status !== 404) return false;

    const url = error?.config?.url || error?.request?.responseURL || '';
    const method = error?.config?.method || '';

    const malformedIndicators = [
        url.includes('//'),
        url.includes('undefined'),
        url.includes('null'),
        url.includes('[object'),
        url.endsWith('/undefined'),
        url.endsWith('/null'),
        url.includes('/%'),
        /\/\/+/.test(url),
    ];

    return malformedIndicators.some(indicator =>
        typeof indicator === 'boolean' ? indicator : indicator
    );
};

// Detect if this is a search operation
const isSearchOperation = (error) => {
    const url = error?.config?.url || error?.request?.responseURL || '';
    const searchIndicators = [
        url.includes('/search'),
        url.includes('/rides?'),
        url.includes('query='),
        url.includes('filter='),
        error?.config?.params
    ];

    return searchIndicators.some(indicator => indicator);
};

// Detect specific error scenarios
const getSpecificErrorCode = (error) => {
    if (!error.response) {
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
            return ERROR_CODES.TIMEOUT_ERROR;
        }
        return ERROR_CODES.NETWORK_ERROR;
    }

    const { status, data } = error.response;
    const message = data?.message || data?.error || '';
    const errorCode = data?.code; // Check for backend error code

    // Check for maintenance mode first
    if (isMaintenanceMode(error)) {
        return ERROR_CODES.MAINTENANCE_MODE;
    }

    // Check for backend error codes first (highest priority)
    if (errorCode && ERROR_CODES[errorCode]) {
        return errorCode;
    }

    // Status-based error detection
    switch (status) {
        case 400:
            // Business rule violations (check message content)
            if (message.includes('bookings') && message.includes('cancel instead')) {
                return ERROR_CODES.RIDE_HAS_BOOKINGS;
            }
            if (message.includes('already cancelled')) {
                return ERROR_CODES.RIDE_ALREADY_CANCELED;
            }
            if (message.includes('past ride') || message.includes('already departed')) {
                return ERROR_CODES.RIDE_IN_PAST;
            }
            if (message.includes('already started')) {
                return ERROR_CODES.RIDE_ALREADY_STARTED;
            }
            if (message.includes('less than 30 minutes')) {
                return ERROR_CODES.CANCELLATION_TOO_LATE;
            }
            if (message.includes('already completed')) {
                return ERROR_CODES.BOOKING_ALREADY_COMPLETED;
            }
            if (message.includes('business rules')) {
                return ERROR_CODES.BUSINESS_RULE_VIOLATION;
            }

            // Authentication specific errors
            if (message.includes('email') && message.includes('password')) {
                return ERROR_CODES.INVALID_CREDENTIALS;
            }
            if (message.includes('required') || message.includes('missing')) {
                return ERROR_CODES.MISSING_FIELDS;
            }
            if (message.includes('date') || message.includes('time') || message.includes('past')) {
                return ERROR_CODES.INVALID_DATETIME;
            }
            return ERROR_CODES.BAD_REQUEST;

        case 401:
            if (message.includes('credentials') || message.includes('login')) {
                return ERROR_CODES.INVALID_CREDENTIALS;
            }
            if (message.includes('expired') || message.includes('token')) {
                return ERROR_CODES.SESSION_EXPIRED;
            }
            return ERROR_CODES.UNAUTHORIZED;

        case 403:
            if (message.includes('verify') || message.includes('verification')) {
                return ERROR_CODES.PHONE_NOT_VERIFIED;
            }
            return ERROR_CODES.FORBIDDEN;

        case 404:
            if (isEndpointError(error)) {
                return ERROR_CODES.API_ENDPOINT_ERROR;
            }
            if (isSearchOperation(error)) {
                return ERROR_CODES.NO_RIDES_FOUND;
            }
            if (message.includes('ride')) {
                return ERROR_CODES.NO_RIDES_FOUND;
            }
            return ERROR_CODES.NOT_FOUND;

        case 409:
            if (message.includes('email') && message.includes('exists')) {
                return ERROR_CODES.PHONE_ALREADY_EXISTS;
            }
            if (message.includes('full') || message.includes('booked')) {
                return ERROR_CODES.RIDE_FULLY_BOOKED;
            }
            if (message.includes('canceled')) {
                return ERROR_CODES.RIDE_CANCELED;
            }
            return ERROR_CODES.BAD_REQUEST;

        case 422:
            if (message.includes('ride') && message.includes('details')) {
                return ERROR_CODES.MISSING_RIDE_DETAILS;
            }
            return ERROR_CODES.VALIDATION_ERROR;

        case 429:
            return ERROR_CODES.RATE_LIMITED;

        case 500:
        case 502:
        case 503:
        case 504:
            return ERROR_CODES.SERVER_ERROR;

        default:
            return ERROR_CODES.UNKNOWN_ERROR;
    }
};

export const handleApiError = (error) => {
    // If it's already a formatted error, return it
    if (error.userMessage && error.code) {
        return error;
    }

    // Handle JavaScript runtime errors
    if (error instanceof TypeError || error instanceof ReferenceError) {
        console.error('Runtime error:', error);
        return {
            userMessage: ERROR_MESSAGES[ERROR_CODES.UNEXPECTED_CRASH],
            technicalMessage: error.message,
            code: ERROR_CODES.UNEXPECTED_CRASH,
            shouldReport: true
        };
    }

    // Get specific error code based on error details
    const errorCode = getSpecificErrorCode(error);

    // Get specific error message based on server response
    const specificMessage = getSpecificErrorMessage(error, errorCode);

    // Enhanced error reporting for debugging
    const errorDetails = {
        userMessage: specificMessage,
        technicalMessage: error?.response?.data?.message || error?.message || 'Unknown error',
        code: errorCode,
        statusCode: error?.response?.status,
        shouldReport: [ERROR_CODES.UNEXPECTED_CRASH, ERROR_CODES.SERVER_ERROR, ERROR_CODES.UNKNOWN_ERROR, ERROR_CODES.API_ENDPOINT_ERROR].includes(errorCode),
        originalError: error,
        // Additional debugging info
        debugInfo: process.env.NODE_ENV === 'development' ? {
            url: error?.config?.url || error?.request?.responseURL,
            method: error?.config?.method,
            params: error?.config?.params,
            isEndpointError: isEndpointError(error),
            isSearchOperation: isSearchOperation(error)
        } : undefined
    };

    // Log enhanced debugging info in development
    if (process.env.NODE_ENV === 'development') {
        console.log('API Error Debug Info:', {
            code: errorCode,
            url: errorDetails.debugInfo?.url,
            method: errorDetails.debugInfo?.method,
            isEndpointError: errorDetails.debugInfo?.isEndpointError,
            isSearchOperation: errorDetails.debugInfo?.isSearchOperation,
            originalError: error
        });
    }

    return errorDetails;
};

// Helper function to check if an error is retryable
export const isRetryableError = (error) => {
    const retryableCodes = [
        ERROR_CODES.NETWORK_ERROR,
        ERROR_CODES.TIMEOUT_ERROR,
        ERROR_CODES.SERVER_ERROR,
        ERROR_CODES.UNKNOWN_ERROR,
        ERROR_CODES.BOOKING_FAILED,
        ERROR_CODES.RIDE_UPDATE_FAILED,
        ERROR_CODES.RIDE_DELETE_FAILED
    ];

    return retryableCodes.includes(error.code);
};

// Helper function to check if error should be logged/reported
export const shouldReportError = (error) => {
    return error.shouldReport === true;
};

// Helper function to get a user-friendly error message
export const getUserFriendlyMessage = (error) => {
    if (typeof error === 'string') {
        return error;
    }

    if (error.userMessage) {
        return error.userMessage;
    }

    if (error.code && ERROR_MESSAGES[error.code]) {
        return ERROR_MESSAGES[error.code];
    }

    if (error.message) {
        return error.message;
    }

    return ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR];
};

// Helper function for support escalation message
export const getSupportMessage = () => {
    return "Something's not working. Please contact support or try again later.";
}; 