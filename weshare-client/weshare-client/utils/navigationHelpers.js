import { router } from 'expo-router';
import { ERROR_CODES } from './apiErrorHandler';

/**
 * Navigation helpers for error handling
 */

export const SCREEN_CONTEXTS = {
    HOME: 'home',
    RIDES: 'rides',
    BOOKING: 'booking',
    AUTH: 'auth',
    PROFILE: 'profile',
    EMPLOYEE: 'employee',
    HISTORY: 'history'
};

export const getContextFromPath = (pathname) => {
    if (!pathname) return SCREEN_CONTEXTS.HOME;

    if (pathname.includes('auth')) return SCREEN_CONTEXTS.AUTH;
    if (pathname.includes('rides')) return SCREEN_CONTEXTS.RIDES;
    if (pathname.includes('employee')) return SCREEN_CONTEXTS.EMPLOYEE;
    if (pathname.includes('profile')) return SCREEN_CONTEXTS.PROFILE;
    if (pathname.includes('history')) return SCREEN_CONTEXTS.HISTORY;

    return SCREEN_CONTEXTS.HOME;
};

export const getHomeRouteForUser = (user) => {
    if (!user) return '/(auth)/login';
    return user.role === 'agency_employee' ? '/(employee)' : '/(home)';
};

export const getErrorSpecificNavigation = (error, context, user) => {
    const userHomeRoute = getHomeRouteForUser(user);

    switch (error?.code) {
        case ERROR_CODES.SESSION_EXPIRED:
        case ERROR_CODES.UNAUTHORIZED:
            return {
                route: '/(auth)/login',
                reason: 'Authentication required'
            };

        case ERROR_CODES.NETWORK_ERROR:
        case ERROR_CODES.TIMEOUT_ERROR:
            // Stay on current screen for network errors, just retry
            return {
                route: null,
                reason: 'Network issue - retry recommended'
            };

        case ERROR_CODES.API_ENDPOINT_ERROR:
            // Configuration issue - navigate to safe screen
            return {
                route: userHomeRoute,
                reason: 'Configuration issue - return to home'
            };

        case ERROR_CODES.MAINTENANCE_MODE:
            // Special handling - should show maintenance screen
            return {
                route: null,
                reason: 'Maintenance mode active'
            };

        case ERROR_CODES.RIDE_FULLY_BOOKED:
        case ERROR_CODES.RIDE_CANCELED:
        case ERROR_CODES.NO_RIDES_FOUND:
            return {
                route: '/(rides)',
                reason: 'Return to rides list'
            };

        case ERROR_CODES.BOOKING_FAILED:
            return {
                route: '/(rides)',
                reason: 'Booking issue - return to rides'
            };

        case ERROR_CODES.UNEXPECTED_CRASH:
        case ERROR_CODES.SERVER_ERROR:
            // Navigate to safe screen based on context
            switch (context) {
                case SCREEN_CONTEXTS.AUTH:
                    return {
                        route: '/(auth)/login',
                        reason: 'System error - return to login'
                    };
                case SCREEN_CONTEXTS.RIDES:
                case SCREEN_CONTEXTS.BOOKING:
                    return {
                        route: userHomeRoute,
                        reason: 'System error - return to home'
                    };
                default:
                    return {
                        route: userHomeRoute,
                        reason: 'System error - return to home'
                    };
            }

        default:
            // Default navigation based on context
            switch (context) {
                case SCREEN_CONTEXTS.AUTH:
                    return {
                        route: '/(auth)/login',
                        reason: 'Return to login'
                    };
                case SCREEN_CONTEXTS.RIDES:
                case SCREEN_CONTEXTS.BOOKING:
                    return {
                        route: '/(rides)',
                        reason: 'Return to rides list'
                    };
                default:
                    return {
                        route: userHomeRoute,
                        reason: 'Return to home'
                    };
            }
    }
};

export const navigateToErrorRecovery = (error, context, user) => {
    const navigation = getErrorSpecificNavigation(error, context, user);

    if (navigation.route) {
        try {
            router.replace(navigation.route);
            return true;
        } catch (navError) {
            console.error('Navigation failed:', navError);
            // Fallback to home
            try {
                router.replace(getHomeRouteForUser(user));
                return true;
            } catch (fallbackError) {
                console.error('Fallback navigation failed:', fallbackError);
                return false;
            }
        }
    }

    return false;
};

export const getRetryAction = (error, context, retryCallback) => {
    // Determine if we should provide a retry action
    switch (error?.code) {
        case ERROR_CODES.NETWORK_ERROR:
        case ERROR_CODES.TIMEOUT_ERROR:
        case ERROR_CODES.SERVER_ERROR:
        case ERROR_CODES.BOOKING_FAILED:
        case ERROR_CODES.RIDE_UPDATE_FAILED:
        case ERROR_CODES.RIDE_DELETE_FAILED:
            return retryCallback;

        case ERROR_CODES.API_ENDPOINT_ERROR:
        case ERROR_CODES.SESSION_EXPIRED:
        case ERROR_CODES.UNAUTHORIZED:
        case ERROR_CODES.RIDE_FULLY_BOOKED:
        case ERROR_CODES.RIDE_CANCELED:
            // No retry for these errors
            return null;

        default:
            return retryCallback;
    }
};

export const getErrorTitle = (error, context) => {
    switch (error?.code) {
        case ERROR_CODES.NETWORK_ERROR:
        case ERROR_CODES.TIMEOUT_ERROR:
            return 'Connection Problem';

        case ERROR_CODES.API_ENDPOINT_ERROR:
            return 'Configuration Error';

        case ERROR_CODES.SESSION_EXPIRED:
        case ERROR_CODES.UNAUTHORIZED:
            return 'Session Expired';

        case ERROR_CODES.RIDE_FULLY_BOOKED:
            return 'Ride Full';

        case ERROR_CODES.RIDE_CANCELED:
            return 'Ride Canceled';

        case ERROR_CODES.NO_RIDES_FOUND:
            return 'No Rides Found';

        case ERROR_CODES.BOOKING_FAILED:
            return 'Booking Failed';

        case ERROR_CODES.MAINTENANCE_MODE:
            return 'Under Maintenance';

        case ERROR_CODES.SERVER_ERROR:
            return 'Server Error';

        case ERROR_CODES.UNEXPECTED_CRASH:
            return 'Something Went Wrong';

        default:
            switch (context) {
                case SCREEN_CONTEXTS.AUTH:
                    return 'Authentication Error';
                case SCREEN_CONTEXTS.BOOKING:
                    return 'Booking Error';
                case SCREEN_CONTEXTS.RIDES:
                    return 'Rides Error';
                default:
                    return 'Error';
            }
    }
};

export const shouldShowBackButton = (error, context) => {
    // Don't show back button for critical errors that require specific navigation
    const criticalErrors = [
        ERROR_CODES.SESSION_EXPIRED,
        ERROR_CODES.UNAUTHORIZED,
        ERROR_CODES.MAINTENANCE_MODE,
        ERROR_CODES.UNEXPECTED_CRASH,
        ERROR_CODES.API_ENDPOINT_ERROR  // Configuration errors need specific handling
    ];

    if (criticalErrors.includes(error?.code)) {
        return false;
    }

    // Show back button for non-critical errors when not on home screens
    return context !== SCREEN_CONTEXTS.HOME && context !== SCREEN_CONTEXTS.AUTH;
};

export const shouldShowHomeButton = (error, context) => {
    // Always show home button for critical errors
    const criticalErrors = [
        ERROR_CODES.UNEXPECTED_CRASH,
        ERROR_CODES.SERVER_ERROR,
        ERROR_CODES.API_ENDPOINT_ERROR  // Configuration errors should go to home
    ];

    if (criticalErrors.includes(error?.code)) {
        return true;
    }

    // Show home button when not already on home screen
    return context !== SCREEN_CONTEXTS.HOME;
};

export const getContextualActions = (error, context, user, retryCallback) => {
    return {
        canRetry: !!getRetryAction(error, context, retryCallback),
        showBackButton: shouldShowBackButton(error, context),
        showHomeButton: shouldShowHomeButton(error, context),
        title: getErrorTitle(error, context),
        navigation: getErrorSpecificNavigation(error, context, user)
    };
}; 