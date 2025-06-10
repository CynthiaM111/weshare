import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react-native';
import { ERROR_CODES, ERROR_MESSAGES, getSupportMessage } from '../utils/apiErrorHandler';

class GlobalErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log the error for reporting
        console.error('Error Boundary caught an error:', error, errorInfo);

        this.setState({
            error,
            errorInfo
        });

        // Report to crash analytics (Sentry, Firebase Crashlytics, etc.)
        this.reportError(error, errorInfo);
    }

    reportError = (error, errorInfo) => {
        // TODO: Implement crash reporting
        // Example: Sentry.captureException(error, { extra: errorInfo });
        // Example: crashlytics().recordError(error);

        // For now, just log to console
        console.error('Error reported:', {
            error: error.toString(),
            stack: error.stack,
            componentStack: errorInfo.componentStack
        });
    };

    handleRetry = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });

        // Try to refresh the current screen by triggering a re-render
        // This will cause the component tree to re-mount
        if (this.props.onRetry) {
            this.props.onRetry();
        }
    };

    handleGoHome = () => {
        // Clear error state
        this.setState({ hasError: false, error: null, errorInfo: null });

        // Navigate to home screen
        if (this.props.onNavigateHome) {
            this.props.onNavigateHome();
        } else {
            // Fallback: try to navigate using global navigation
            const { router } = require('expo-router');
            try {
                router.replace('/(home)');
            } catch (navError) {
                console.error('Navigation fallback failed:', navError);
                // Last resort: reload the app
                if (typeof window !== 'undefined' && window.location) {
                    window.location.reload();
                }
            }
        }
    };

    handleContactSupport = () => {
        // TODO: Implement support contact mechanism
        // This could open email, in-app support, or external link
        const supportEmail = 'support@weshare.app';
        const subject = 'App Error Report';
        const body = `Error Details:\n${this.state.error?.toString()}\n\nStack Trace:\n${this.state.error?.stack}`;

        try {
            const { Linking } = require('react-native');
            const mailtoUrl = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            Linking.openURL(mailtoUrl);
        } catch (linkingError) {
            console.log('Contact support triggered - email app not available');
            // Fallback: copy error details to clipboard or show them
            const { Alert } = require('react-native');
            Alert.alert(
                'Contact Support',
                `Please email ${supportEmail} with the following error details:\n\n${this.state.error?.toString()}`,
                [{ text: 'OK' }]
            );
        }
    };

    render() {
        if (this.state.hasError) {
            const isNetworkError = this.state.error?.message?.includes('Network') ||
                this.state.error?.message?.includes('fetch');

            return (
                <View style={styles.container}>
                    <View style={styles.errorContainer}>
                        <AlertTriangle size={64} color="#EF4444" />

                        <Text style={styles.title}>
                            {isNetworkError ? 'Connection Problem' : 'Something went wrong'}
                        </Text>

                        <Text style={styles.message}>
                            {isNetworkError
                                ? ERROR_MESSAGES[ERROR_CODES.NETWORK_ERROR]
                                : ERROR_MESSAGES[ERROR_CODES.UNEXPECTED_CRASH]
                            }
                        </Text>

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={styles.retryButton}
                                onPress={this.handleRetry}
                            >
                                <RefreshCw size={20} color="#FFFFFF" />
                                <Text style={styles.retryButtonText}>Try Again</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.homeButton}
                                onPress={this.handleGoHome}
                            >
                                <Home size={20} color="#3B82F6" />
                                <Text style={styles.homeButtonText}>Go to Home</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.supportButton}
                                onPress={this.handleContactSupport}
                            >
                                <Text style={styles.supportButtonText}>Contact Support</Text>
                            </TouchableOpacity>
                        </View>

                        {__DEV__ && (
                            <View style={styles.debugContainer}>
                                <Text style={styles.debugTitle}>Debug Info:</Text>
                                <Text style={styles.debugText}>
                                    {this.state.error?.toString()}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorContainer: {
        alignItems: 'center',
        maxWidth: 350,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
        marginTop: 20,
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#4B5563',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    buttonContainer: {
        width: '100%',
        gap: 12,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3B82F6',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    homeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#3B82F6',
        gap: 8,
    },
    homeButtonText: {
        color: '#3B82F6',
        fontSize: 16,
        fontWeight: '500',
    },
    supportButton: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    supportButtonText: {
        color: '#374151',
        fontSize: 16,
        fontWeight: '500',
    },
    debugContainer: {
        marginTop: 24,
        padding: 16,
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        width: '100%',
    },
    debugTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    debugText: {
        fontSize: 12,
        color: '#6B7280',
        fontFamily: 'monospace',
    },
});

export default GlobalErrorBoundary; 