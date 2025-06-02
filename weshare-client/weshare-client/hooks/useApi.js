import { useState, useCallback } from 'react';
import { handleApiError, isRetryableError } from '../utils/apiErrorHandler';

export const useApi = (apiFunction) => {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const execute = useCallback(async (...args) => {
        setIsLoading(true);
        setError(null);
        

        try {
            const result = await apiFunction(...args);
            setData(result);
            return result;
        } catch (err) {
            const formattedError = handleApiError(err);
            setError(formattedError);
            throw formattedError;
        } finally {
            setIsLoading(false);
        }
    }, [apiFunction]);

    const retry = useCallback(async () => {
        if (error && isRetryableError(error)) {
            return execute();
        }
        throw new Error('This error cannot be retried');
    }, [error, execute]);

    return {
        data,
        error,
        isLoading,
        execute,
        retry,
        setData,
        setError,
    };
};

