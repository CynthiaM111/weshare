export const handleApiError = (error) => {
    // If it's already a formatted error, return it
    if (error.userMessage) {
        return error;
    }

    // Handle network errors
    if (!error.response) {
        return {
            userMessage: "Please check your internet connection and try again.",
            technicalMessage: "Network error",
            code: "NETWORK_ERROR"
        };
    }

    const { status, data } = error.response;

    // Handle different HTTP status codes
    switch (status) {
        case 400:
            return {
                userMessage: data.message || "Please check your input and try again.",
                technicalMessage: data.error || "Bad request",
                code: "BAD_REQUEST"
            };

        case 401:
            return {
                userMessage: "Your session has expired. Please log in again.",
                technicalMessage: "Unauthorized",
                code: "UNAUTHORIZED"
            };

        case 403:
            return {
                userMessage: "You don't have permission to perform this action.",
                technicalMessage: "Forbidden",
                code: "FORBIDDEN"
            };

        case 404:
            return {
                userMessage: "The requested information could not be found.",
                technicalMessage: "Not found",
                code: "NOT_FOUND"
            };

        case 422:
            return {
                userMessage: data.message || "Please check your input and try again.",
                technicalMessage: "Validation error",
                code: "VALIDATION_ERROR"
            };

        case 500:
        case 502:
        case 503:
        case 504:
            return {
                userMessage: "Our servers are having trouble. Please try again in a few minutes.",
                technicalMessage: "Server error",
                code: "SERVER_ERROR"
            };

        default:
            return {
                userMessage: "Something went wrong. Please try again.",
                technicalMessage: error.message || "Unknown error",
                code: "UNKNOWN_ERROR"
            };
    }
};

// Helper function to check if an error is retryable
export const isRetryableError = (error) => {
    const retryableCodes = [
        'NETWORK_ERROR',
        'SERVER_ERROR',
        'UNKNOWN_ERROR'
    ];

    return retryableCodes.includes(error.code);
};

// Helper function to get a user-friendly error message
export const getUserFriendlyMessage = (error) => {
    if (typeof error === 'string') {
        return error;
    }

    if (error.userMessage) {
        return error.userMessage;
    }

    if (error.message) {
        return error.message;
    }

    return "Something went wrong. Please try again.";
}; 