import React, { createContext, useContext, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import {
    handleApiError,
    isRetryableError,
    shouldReportError,
    getUserFriendlyMessage,
    ERROR_CODES,
    ERROR_MESSAGES,
    getSupportMessage
} from '../../utils/apiErrorHandler';

const ErrorContext = createContext();

export const useError = () => {
    const context = useContext(ErrorContext);
    if (!context) {
        throw new Error('useError must be used within an ErrorProvider');
    }
    return context;
};

export const ErrorProvider = ({ children }) => {
    const [globalError, setGlobalError] = useState(null);
    const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

    // Show error notification (toast/alert)
    const showErrorNotification = useCallback((error, options = {}) => {
        const {
            title = 'Error',
            showAlert = true,
            showToast = false,
            autoHide = true
        } = options;

        const message = getUserFriendlyMessage(error);

        if (showAlert) {
            const buttons = [
                { text: 'OK', style: 'default' }
            ];

            // Add retry option for retryable errors
            if (isRetryableError(error) && options.onRetry) {
                buttons.unshift({
                    text: 'Retry',
                    onPress: options.onRetry
                });
            }

            // Add support option for critical errors
            if (shouldReportError(error)) {
                buttons.push({
                    text: 'Contact Support',
                    onPress: () => showSupportOptions()
                });
            }

            Alert.alert(title, message, buttons);
        }

        // TODO: Implement toast notification if needed
        // if (showToast) {
        //     Toast.show({
        //         type: 'error',
        //         text1: title,
        //         text2: message,
        //         autoHide,
        //         visibilityTime: autoHide ? 4000 : 0
        //     });
        // }
    }, []);

    // Handle global errors
    const handleGlobalError = useCallback((error, context = {}) => {
        const formattedError = handleApiError(error);

        // Check for maintenance mode
        if (formattedError.code === ERROR_CODES.MAINTENANCE_MODE) {
            setIsMaintenanceMode(true);
            return;
        }

        // Report error if needed
        if (shouldReportError(formattedError)) {
            reportError(formattedError, context);
        }

        // Log error for debugging
        console.error('Global error handled:', {
            error: formattedError,
            context,
            timestamp: new Date().toISOString()
        });

        return formattedError;
    }, []);

    // Report error to analytics/crash reporting
    const reportError = useCallback((error, context = {}) => {
        // TODO: Implement actual error reporting
        // Examples:
        // - Sentry.captureException(error.originalError || error, { extra: context });
        // - crashlytics().recordError(error.originalError || new Error(error.technicalMessage));
        // - Firebase Analytics custom event

        console.warn('Error reported for monitoring:', {
            code: error.code,
            message: error.technicalMessage,
            userMessage: error.userMessage,
            context,
            timestamp: new Date().toISOString()
        });
    }, []);

    // Show support options
    const showSupportOptions = useCallback(() => {
        Alert.alert(
            'Contact Support',
            getSupportMessage(),
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Email Support',
                    onPress: () => {
                        // TODO: Open email app with pre-filled support email
                        console.log('Open email support');
                    }
                },
                {
                    text: 'In-App Help',
                    onPress: () => {
                        // TODO: Navigate to help/support screen
                        console.log('Open in-app help');
                    }
                }
            ]
        );
    }, []);

    // Clear global error
    const clearGlobalError = useCallback(() => {
        setGlobalError(null);
    }, []);

    // Clear maintenance mode
    const clearMaintenanceMode = useCallback(() => {
        setIsMaintenanceMode(false);
    }, []);

    // Handle specific authentication errors
    const handleAuthError = useCallback((error) => {
        const formattedError = handleGlobalError(error, { type: 'authentication' });

        if (formattedError.code === ERROR_CODES.SESSION_EXPIRED) {
            // TODO: Clear user session and redirect to login
            // This should be handled by AuthContext
            console.log('Session expired - should logout user');
        }

        return formattedError;
    }, [handleGlobalError]);

    // Handle network errors with retry logic
    const handleNetworkError = useCallback((error, retryCallback) => {
        const formattedError = handleGlobalError(error, { type: 'network' });

        if (isRetryableError(formattedError) && retryCallback) {
            showErrorNotification(formattedError, {
                title: 'Connection Error',
                onRetry: retryCallback
            });
        } else {
            showErrorNotification(formattedError, {
                title: 'Network Error'
            });
        }

        return formattedError;
    }, [handleGlobalError, showErrorNotification]);

    // Handle booking/ride specific errors
    const handleBookingError = useCallback((error, context = {}) => {
        const formattedError = handleGlobalError(error, { type: 'booking', ...context });

        // Specific handling for booking errors
        switch (formattedError.code) {
            case ERROR_CODES.RIDE_FULLY_BOOKED:
            case ERROR_CODES.RIDE_CANCELED:
                showErrorNotification(formattedError, {
                    title: 'Booking Update',
                    showAlert: true
                });
                break;
            case ERROR_CODES.NO_RIDES_FOUND:
                // Don't show intrusive alert for no results
                break;
            default:
                showErrorNotification(formattedError, {
                    title: 'Booking Error'
                });
        }

        return formattedError;
    }, [handleGlobalError, showErrorNotification]);

    const value = {
        // State
        globalError,
        isMaintenanceMode,

        // Error handling functions
        handleGlobalError,
        handleAuthError,
        handleNetworkError,
        handleBookingError,
        showErrorNotification,

        // Utility functions
        clearGlobalError,
        clearMaintenanceMode,
        showSupportOptions,
        reportError,

        // Helper functions
        isRetryableError,
        shouldReportError,
        getUserFriendlyMessage
    };

    return (
        <ErrorContext.Provider value={value}>
            {children}
        </ErrorContext.Provider>
    );
}; 