/*
 * COMPREHENSIVE ERROR HANDLING USAGE EXAMPLES
 * 
 * This file demonstrates how to use the robust error handling system
 * implemented throughout the WeShare app.
 */

import { useError } from '../app/context/ErrorContext';
import { useApi } from './useApi';
import { ERROR_CODES } from './apiErrorHandler';

// ===========================================
// 1. BASIC API CALL WITH ERROR HANDLING
// ===========================================

export const BasicApiExample = () => {
    const { handleGlobalError, showErrorNotification } = useError();

    const {
        data: rides,
        error,
        isLoading,
        execute: fetchRides,
        retry: retryFetchRides,
        executeWithRetry
    } = useApi(async () => {
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/rides`);
        if (!response.ok) throw new Error('Failed to fetch rides');
        return response.json();
    }, {
        maxRetries: 3,
        retryDelay: 1000,
        onError: (error) => {
            // Custom error handling
            if (error.code === ERROR_CODES.NO_RIDES_FOUND) {
                // Don't show intrusive error for no results
                console.log('No rides found');
            } else if (error.code === ERROR_CODES.NETWORK_ERROR) {
                showErrorNotification(error, {
                    title: 'Connection Problem',
                    onRetry: retryFetchRides
                });
            }
        },
        onSuccess: (data) => {
            console.log(`Loaded ${data.length} rides successfully`);
        }
    });

    // Component rendering with error states
    if (error && error.code !== ERROR_CODES.NO_RIDES_FOUND) {
        return <ErrorDisplay error={error} onRetry={retryFetchRides} />;
    }

    return (
        <View>
            {isLoading && <LoadingSpinner />}
            {rides && <RidesList rides={rides} />}
            {!rides && !isLoading && <NoRidesMessage />}
        </View>
    );
};

// ===========================================
// 2. BOOKING WITH SPECIFIC ERROR HANDLING
// ===========================================

export const BookingExample = () => {
    const { handleBookingError, showErrorNotification } = useError();

    const {
        error: bookingError,
        isLoading: isBooking,
        execute: bookRide
    } = useApi(async (rideId) => {
        const response = await axios.post(
            `${process.env.EXPO_PUBLIC_API_URL}/rides/${rideId}/book`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    }, {
        onError: (error) => {
            const formattedError = handleBookingError(error, { rideId });

            // Handle specific booking scenarios
            switch (formattedError.code) {
                case ERROR_CODES.RIDE_FULLY_BOOKED:
                    // Show specific UI for fully booked rides
                    showAlternativeRides();
                    break;
                case ERROR_CODES.RIDE_CANCELED:
                    // Refresh ride list to remove canceled ride
                    refreshRideList();
                    break;
                case ERROR_CODES.SESSION_EXPIRED:
                    // This will be handled by AuthContext automatically
                    break;
                default:
                    // Generic error handling
                    break;
            }
        }
    });

    const handleBookRide = async (rideId) => {
        try {
            await bookRide(rideId);
            showSuccessMessage('Ride booked successfully!');
            navigateToBookedRides();
        } catch (error) {
            // Error already handled by onError callback
            console.log('Booking failed:', error.userMessage);
        }
    };
};

// ===========================================
// 3. FORM VALIDATION WITH ERROR HANDLING
// ===========================================

export const FormExample = () => {
    const { handleGlobalError } = useError();

    const {
        error: submitError,
        isLoading: isSubmitting,
        execute: submitForm
    } = useApi(async (formData) => {
        // Validate form data first
        if (!formData.destination || !formData.departureTime) {
            throw {
                code: ERROR_CODES.MISSING_FIELDS,
                message: 'Please fill in all required ride details.'
            };
        }

        if (new Date(formData.departureTime) < new Date()) {
            throw {
                code: ERROR_CODES.INVALID_DATETIME,
                message: 'Please choose a valid date and time.'
            };
        }

        const response = await axios.post('/api/rides', formData);
        return response.data;
    }, {
        onError: (error) => {
            // Handle form-specific errors
            if (error.code === ERROR_CODES.MISSING_FIELDS ||
                error.code === ERROR_CODES.INVALID_DATETIME) {
                // Show validation errors inline
                setFieldErrors(error);
            } else {
                // Handle other errors globally
                handleGlobalError(error, { context: 'form_submission' });
            }
        }
    });
};

// ===========================================
// 4. NETWORK ERROR HANDLING WITH RETRY
// ===========================================

export const NetworkRetryExample = () => {
    const { handleNetworkError } = useError();

    const apiCall = useApi(async () => {
        const response = await fetch('/api/data', { timeout: 5000 });
        if (!response.ok) throw new Error('Network request failed');
        return response.json();
    }, {
        maxRetries: 5,
        retryDelay: 2000,
        onError: (error) => {
            handleNetworkError(error, () => {
                // Custom retry logic
                apiCall.executeWithRetry();
            });
        }
    });

    // Auto-retry with exponential backoff
    const fetchDataWithRetry = () => {
        apiCall.executeWithRetry();
    };
};

// ===========================================
// 5. AUTHENTICATION ERROR HANDLING
// ===========================================

export const AuthExample = () => {
    const { user, handleSessionExpiry } = useAuth();
    const { handleAuthError } = useError();

    const protectedApiCall = useApi(async () => {
        const response = await axios.get('/api/protected', {
            headers: { Authorization: `Bearer ${user.token}` }
        });
        return response.data;
    }, {
        onError: (error) => {
            const formattedError = handleAuthError(error);

            if (formattedError.code === ERROR_CODES.SESSION_EXPIRED) {
                handleSessionExpiry();
            }
        }
    });
};

// ===========================================
// 6. GLOBAL ERROR INTERCEPTOR SETUP
// ===========================================

// Set up Axios interceptors for global error handling
export const setupGlobalErrorInterceptors = (errorContext) => {
    const { handleGlobalError, handleAuthError } = errorContext;

    // Request interceptor
    axios.interceptors.request.use(
        (config) => {
            // Add auth token if available
            const token = AsyncStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => {
            return Promise.reject(handleGlobalError(error));
        }
    );

    // Response interceptor
    axios.interceptors.response.use(
        (response) => response,
        (error) => {
            // Handle specific error types
            if (error.response?.status === 401) {
                return Promise.reject(handleAuthError(error));
            } else if (error.response?.status >= 500) {
                return Promise.reject(handleGlobalError(error, {
                    context: 'server_error',
                    url: error.config?.url
                }));
            } else if (error.code === 'ECONNABORTED') {
                return Promise.reject(handleGlobalError(error, {
                    context: 'timeout',
                    url: error.config?.url
                }));
            }

            return Promise.reject(handleGlobalError(error));
        }
    );
};

// ===========================================
// 7. ERROR REPORTING INTEGRATION
// ===========================================

export const setupErrorReporting = () => {
    // Example with Sentry
    /*
    import * as Sentry from '@sentry/react-native';
    
    Sentry.init({
        dsn: 'YOUR_SENTRY_DSN',
    });

    // Global error handler
    ErrorUtils.setGlobalHandler((error, isFatal) => {
        Sentry.captureException(error, {
            tags: { isFatal },
            extra: { timestamp: new Date().toISOString() }
        });
    });
    */

    // Example with Firebase Crashlytics
    /*
    import crashlytics from '@react-native-firebase/crashlytics';
    
    const reportError = (error, context) => {
        crashlytics().recordError(error);
        crashlytics().log('Error occurred with context: ' + JSON.stringify(context));
    };
    */
};

// ===========================================
// 8. USAGE IN COMPONENT
// ===========================================

const ExampleComponent = () => {
    const {
        showErrorNotification,
        handleGlobalError,
        isMaintenanceMode
    } = useError();

    // Handle maintenance mode
    if (isMaintenanceMode) {
        return <MaintenanceMode />;
    }

    const handleAction = async () => {
        try {
            await someAsyncOperation();
        } catch (error) {
            // Let the global error handler manage it
            const formattedError = handleGlobalError(error, {
                action: 'user_action',
                timestamp: Date.now()
            });

            // Optionally show user notification
            showErrorNotification(formattedError, {
                title: 'Action Failed',
                onRetry: handleAction
            });
        }
    };

    return (
        <View>
            {/* Your component content */}
        </View>
    );
};

export default ExampleComponent; 