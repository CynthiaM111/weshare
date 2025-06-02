import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AlertCircle, RefreshCw } from 'lucide-react-native';

const ErrorDisplay = ({
    error,
    onRetry,
    title = "Something went wrong",
    message = "We encountered an error while processing your request.",
    retryText = "Try Again"
}) => {
    // Map common error messages to user-friendly messages
    const getFriendlyMessage = (error) => {
        if (!error) return message;

        const errorMessage = error.message ? String(error.message) : String(error);

        // Network errors
        if (errorMessage.includes('Network Error') || errorMessage.includes('network')) {
            return "Please check your internet connection and try again.";
        }

        // Authentication errors
        if (errorMessage.includes('unauthorized') || errorMessage.includes('Unauthorized')) {
            return "Your session has expired. Please log in again.";
        }

        // Server errors
        if (errorMessage.includes('500') || errorMessage.includes('server')) {
            return "Our servers are having trouble. Please try again in a few minutes.";
        }

        // Not found errors
        if (errorMessage.includes('404') || errorMessage.includes('not found')) {
            return "The requested information could not be found.";
        }

        // Validation errors
        if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
            return "Please check your input and try again.";
        }

        // Default message
        return message;
    };

    return (
        <View style={styles.container}>
            <AlertCircle size={48} color="#EF4444" />
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{getFriendlyMessage(error)}</Text>
            {onRetry && (
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={onRetry}
                >
                    <RefreshCw size={16} color="#FFFFFF" />
                    <Text style={styles.retryText}>{retryText}</Text>
                </TouchableOpacity>
            )}
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
    },
    message: {
        fontSize: 16,
        color: '#4B5563',
        textAlign: 'center',
        marginBottom: 24,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3B82F6',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 8,
    },
    retryText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '500',
    },
});

export default ErrorDisplay; 