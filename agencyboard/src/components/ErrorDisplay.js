'use client';

import { useState } from 'react';
import { handleApiError, getUserFriendlyMessage, ERROR_CODES } from '../utils/errorHandler';

export default function ErrorDisplay({
    error,
    onRetry,
    onDismiss,
    showRetry = true,
    showDismiss = true,
    className = '',
    variant = 'default' // 'default', 'inline', 'toast'
}) {
    const [isVisible, setIsVisible] = useState(true);

    if (!error || !isVisible) {
        return null;
    }

    // Handle the error to get user-friendly message
    const errorDetails = typeof error === 'string' ? { userMessage: error } : handleApiError(error);
    const userMessage = getUserFriendlyMessage(errorDetails);

    // Determine error type for styling
    const isBusinessRule = errorDetails.code === ERROR_CODES.RIDE_HAS_BOOKINGS ||
        errorDetails.code === ERROR_CODES.RIDE_ALREADY_CANCELED ||
        errorDetails.code === ERROR_CODES.CANCELLATION_TOO_LATE ||
        errorDetails.code === ERROR_CODES.BUSINESS_RULE_VIOLATION;

    const isValidation = errorDetails.code === ERROR_CODES.VALIDATION_ERROR ||
        errorDetails.code === ERROR_CODES.MISSING_FIELDS ||
        errorDetails.code === ERROR_CODES.INVALID_DATETIME;

    const isNetwork = errorDetails.code === ERROR_CODES.NETWORK_ERROR ||
        errorDetails.code === ERROR_CODES.TIMEOUT_ERROR;

    const isAuth = errorDetails.code === ERROR_CODES.INVALID_CREDENTIALS ||
        errorDetails.code === ERROR_CODES.SESSION_EXPIRED ||
        errorDetails.code === ERROR_CODES.UNAUTHORIZED;

    // Determine styling based on error type and variant
    const getStyling = () => {
        const baseClasses = 'rounded-lg p-4 border-l-4';

        if (variant === 'toast') {
            return `${baseClasses} fixed top-4 right-4 z-50 max-w-md shadow-lg transform transition-all duration-300 ease-in-out`;
        }

        if (variant === 'inline') {
            return `${baseClasses} mb-4`;
        }

        return `${baseClasses} mb-6`;
    };

    const getColorClasses = () => {
        if (isBusinessRule) {
            return 'bg-orange-50 border-orange-400 text-orange-800';
        }
        if (isValidation) {
            return 'bg-yellow-50 border-yellow-400 text-yellow-800';
        }
        if (isNetwork) {
            return 'bg-blue-50 border-blue-400 text-blue-800';
        }
        if (isAuth) {
            return 'bg-red-50 border-red-400 text-red-800';
        }
        return 'bg-red-50 border-red-400 text-red-800';
    };

    const getIcon = () => {
        if (isBusinessRule) {
            return (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
            );
        }
        if (isValidation) {
            return (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
            );
        }
        if (isNetwork) {
            return (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
            );
        }
        return (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
        );
    };

    const handleDismiss = () => {
        setIsVisible(false);
        if (onDismiss) {
            onDismiss();
        }
    };

    const handleRetry = () => {
        if (onRetry) {
            onRetry();
        }
    };

    const errorContent = (
        <div className={`${getStyling()} ${getColorClasses()} ${className}`}>
            <div className="flex items-start">
                <div className="flex-shrink-0 mr-3 mt-0.5">
                    {getIcon()}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-5">
                        {userMessage}
                    </p>

                    {/* Action buttons */}
                    <div className="flex items-center mt-3 space-x-3">
                        {showRetry && onRetry && (
                            <button
                                onClick={handleRetry}
                                className="text-xs font-medium hover:underline focus:outline-none focus:underline"
                            >
                                Try Again
                            </button>
                        )}
                        {showDismiss && (
                            <button
                                onClick={handleDismiss}
                                className="text-xs font-medium hover:underline focus:outline-none focus:underline"
                            >
                                Dismiss
                            </button>
                        )}
                    </div>
                </div>

                {/* Close button for toast variant */}
                {variant === 'toast' && showDismiss && (
                    <button
                        onClick={handleDismiss}
                        className="flex-shrink-0 ml-3 text-current opacity-50 hover:opacity-100 focus:outline-none"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );

    // For toast variant, wrap in a container
    if (variant === 'toast') {
        return (
            <div className="fixed inset-0 z-50 pointer-events-none">
                {errorContent}
            </div>
        );
    }

    return errorContent;
}

// Toast notification component for temporary errors
export function ErrorToast({ error, onDismiss, duration = 5000 }) {
    const [isVisible, setIsVisible] = useState(true);

    React.useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                setIsVisible(false);
                if (onDismiss) onDismiss();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [duration, onDismiss]);

    if (!isVisible) return null;

    return (
        <ErrorDisplay
            error={error}
            onDismiss={() => {
                setIsVisible(false);
                if (onDismiss) onDismiss();
            }}
            variant="toast"
            showRetry={false}
        />
    );
} 