import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AlertCircle, RefreshCw, Home, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { getUserFriendlyMessage, ERROR_CODES, isRetryableError } from '../utils/apiErrorHandler';

const ErrorDisplay = ({
    error,
    onRetry,
    onGoBack,
    onGoHome,
    title = "Something went wrong",
    message = "We encountered an error while processing your request.",
    retryText = "Try Again",
    showBackButton = false,
    showHomeButton = false,
    context = 'general' // 'booking', 'auth', 'network', 'general'
}) => {
    const router = useRouter();

    // Get user-friendly error message
    const errorMessage = error?.userMessage || getUserFriendlyMessage(error) || message;
    console.log('errorMessage', errorMessage);

    // Determine what actions to show based on error type and context
    const canRetry = isRetryableError(error) && onRetry;
    const shouldShowHome = showHomeButton || error?.code === ERROR_CODES.UNEXPECTED_CRASH;
    const shouldShowBack = showBackButton && router.canGoBack();

    // Handle going back
    const handleGoBack = () => {
        if (onGoBack) {
            onGoBack();
        } else if (router.canGoBack()) {
            router.back();
        } else {
            // Fallback to home
            handleGoHome();
        }
    };

    // Handle going home
    const handleGoHome = () => {
        if (onGoHome) {
            onGoHome();
        } else {
            try {
                // Navigate based on context or default to home
                switch (context) {
                    case 'auth':
                        router.replace('/(auth)/login');
                        break;
                    case 'booking':
                        router.replace('/(rides)');
                        break;
                    case 'network':
                    case 'general':
                    default:
                        router.replace('/(home)');
                        break;
                }
            } catch (navError) {
                console.error('Navigation failed:', navError);
                router.replace('/(home)');
            }
        }
    };

    // Handle retry with context-specific logic
    const handleRetry = () => {
        if (onRetry) {
            onRetry();
        }
    };

    // Get context-specific suggestions
    const getContextualSuggestion = () => {
        if (!error?.code) return null;

        switch (error.code) {
            case ERROR_CODES.NETWORK_ERROR:
                return "Check your internet connection and try again.";
            case ERROR_CODES.SESSION_EXPIRED:
                return "Please log in again to continue.";
            case ERROR_CODES.RIDE_FULLY_BOOKED:
                return "Try searching for alternative rides.";
            case ERROR_CODES.NO_RIDES_FOUND:
                return "Adjust your search filters or try a different time.";
            case ERROR_CODES.MAINTENANCE_MODE:
                return "Please check back in a few minutes.";
            default:
                return null;
        }
    };

    const suggestion = getContextualSuggestion();

    return (
        <View style={styles.container}>
            <AlertCircle size={48} color="#EF4444" />
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{errorMessage}</Text>

            {suggestion && (
                <Text style={styles.suggestion}>{suggestion}</Text>
            )}

            <View style={styles.buttonContainer}>
                {canRetry && (
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={handleRetry}
                    >
                        <RefreshCw size={16} color="#FFFFFF" />
                        <Text style={styles.retryText}>{retryText}</Text>
                    </TouchableOpacity>
                )}

                {shouldShowBack && (
                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={handleGoBack}
                    >
                        <ArrowLeft size={16} color="#3B82F6" />
                        <Text style={styles.secondaryButtonText}>Go Back</Text>
                    </TouchableOpacity>
                )}

                {shouldShowHome && (
                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={handleGoHome}
                    >
                        <Home size={16} color="#3B82F6" />
                        <Text style={styles.secondaryButtonText}>Go to Home</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#FFFFFF',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#4B5563',
        textAlign: 'center',
        marginBottom: 8,
        lineHeight: 22,
    },
    suggestion: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
        fontStyle: 'italic',
    },
    buttonContainer: {
        width: '100%',
        maxWidth: 300,
        gap: 12,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3B82F6',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
    },
    retryText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        gap: 8,
    },
    secondaryButtonText: {
        color: '#3B82F6',
        fontSize: 16,
        fontWeight: '500',
    },
});

export default ErrorDisplay; 