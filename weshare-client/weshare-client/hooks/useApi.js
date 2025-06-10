import { useState, useCallback } from 'react';
import { handleApiError, isRetryableError, shouldReportError } from '../utils/apiErrorHandler';

export const useApi = (apiFunction, options = {}) => {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    const {
        maxRetries = 3,
        retryDelay = 1000,
        onError,
        onSuccess,
        initialData = null
    } = options;

    // Initialize data if provided
    useState(() => {
        if (initialData !== null) {
            setData(initialData);
        }
    });

    const execute = useCallback(async (...args) => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await apiFunction(...args);
            setData(result);
            setRetryCount(0); // Reset retry count on success

            if (onSuccess) {
                onSuccess(result);
            }

            return result;
        } catch (err) {
            const formattedError = handleApiError(err);
            setError(formattedError);

            // Report error if needed
            if (shouldReportError(formattedError)) {
                console.error('API Error reported:', {
                    error: formattedError,
                    args,
                    timestamp: new Date().toISOString()
                });
            }

            if (onError) {
                onError(formattedError);
            }

            throw formattedError;
        } finally {
            setIsLoading(false);
        }
    }, [apiFunction, onSuccess, onError]);

    // Manual retry function
    const retry = useCallback(async (...args) => {
        if (error && isRetryableError(error)) {
            setRetryCount(prev => prev + 1);

            // Add delay before retry
            if (retryDelay > 0) {
                await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, retryCount)));
            }

            return execute(...args);
        }
        throw new Error('This error cannot be retried or maximum retries exceeded');
    }, [error, execute, retryDelay, retryCount]);

    // Auto retry with exponential backoff
    const executeWithRetry = useCallback(async (...args) => {
        let lastError = null;
        let attempts = 0;

        while (attempts <= maxRetries) {
            try {
                return await execute(...args);
            } catch (err) {
                lastError = err;
                attempts++;

                // Don't retry if error is not retryable or we've exceeded max retries
                if (!isRetryableError(err) || attempts > maxRetries) {
                    throw err;
                }

                // Wait before retrying with exponential backoff
                const delay = retryDelay * Math.pow(2, attempts - 1);
                await new Promise(resolve => setTimeout(resolve, delay));

                setRetryCount(attempts);
            }
        }

        throw lastError;
    }, [execute, maxRetries, retryDelay]);

    // Reset function to clear all state
    const reset = useCallback(() => {
        setData(initialData);
        setError(null);
        setIsLoading(false);
        setRetryCount(0);
    }, [initialData]);

    // Check if we can retry
    const canRetry = error && isRetryableError(error) && retryCount < maxRetries;

    return {
        data,
        error,
        isLoading,
        retryCount,
        canRetry,
        execute,
        executeWithRetry,
        retry,
        reset,
        setData,
        setError,

        // Helper methods
        isRetryableError: () => error && isRetryableError(error),
        shouldReportError: () => error && shouldReportError(error)
    };
};

