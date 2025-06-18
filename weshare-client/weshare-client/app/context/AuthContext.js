import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Alert } from 'react-native';
import { useApi } from '../../hooks/useApi';
import ErrorDisplay from '../../components/ErrorDisplay';
import { handleApiError, ERROR_CODES } from '../../utils/apiErrorHandler';
import { useError } from './ErrorContext';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const { handleAuthError, handleGlobalError } = useError();

    const loginApi = useApi(async (contact_number, password, email) => {
        try {
            // Clear any existing auth data before login
            await AsyncStorage.multiRemove(['token', 'role', 'userData', 'contact_number']);
            console.log('[LOGIN API] Attempting login with:', { contact_number, email });

            const response = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/auth/login`, {
                contact_number,
                password,
                email
            });
            const data = response.data;
            console.log('[LOGIN API] Login response:', data);

            if (response.status !== 200) {
                console.log('[LOGIN API] Non-200 response:', response.status);
                throw new Error(response.data.error || 'Login failed. Check your credentials and try again.');
            }

            const userData = {
                id: data.userId,
                contact_number: data.contact_number,
                name: data.name || '',
                role: data.role,
                token: data.token,
                agencyId: data.agencyId,
                destinationCategoryId: data.destinationCategoryId,
                isVerified: data.isVerified
            };
            console.log('[LOGIN API] Created user data:', userData);

            // Store auth data
            await AsyncStorage.multiSet([
                ['token', data.token],
                ['role', data.role],
                ['contact_number', data.contact_number],
                ['userData', JSON.stringify(userData)]
            ]);
            console.log('[LOGIN API] Auth data stored in AsyncStorage');

            setUser(userData);

            // Navigate based on verification
            if (!data.isVerified) {
                console.log('[LOGIN API] User is not verified. Redirecting to /verify');
                router.replace('/(auth)/verify');
            } else {
                const route = data.role === 'agency' ? '/(agency)' :
                    data.role === 'agency_employee' ? '/(employee)' :
                        '/(home)';
                console.log(`[LOGIN API] User is verified. Redirecting to ${route}`);
                router.replace(route);
            }
            return data;

        } catch (error) {
            console.error('[LOGIN API] Error:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            // Clear any partial data on error
            await AsyncStorage.multiRemove(['token', 'role', 'userData', 'contact_number']);
            const formattedError = handleAuthError(error);
            throw formattedError;
        }
    }, {
        onError: (error) => {
            console.log('[LOGIN API] Error handler:', {
                code: error.code,
                message: error.message
            });
            // Handle specific authentication errors
            if (error.code === ERROR_CODES.INVALID_CREDENTIALS) {
                // Don't show additional alerts, the login screen will handle this
                return;
            }
            // For other errors, the global error handler will manage them
        }
    });

    const signupApi = useApi(async (userData, role) => {
        try {
            const response = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/auth/signup`, {
                ...userData,
                role,
            });
            const data = response.data;
            console.log('[SIGNUP] Signup response:', data);
            if (response.status !== 201) {
                throw new Error(response.data.error || 'Signup failed');
            }

            // Store minimal user data for verification
            const verificationData = {
                contact_number: userData.contact_number,
                role: role,
                name: userData.name,
                isVerified: data.isVerified
            };

            await AsyncStorage.setItem('verificationData', JSON.stringify(verificationData));

            // Return the response data
            // Navigate to verify screen if required
            if (data.requiresVerification) {
                console.log('[SIGNUP] Verification required. Redirecting to /verify');
                router.replace('/(auth)/verify');
            } else {
                console.log('[SIGNUP] No verification required.');
            }

            return data;

        } catch (error) {
            console.error('Signup error:', error);
            throw error;
        }
    }, {
        onError: (error) => {
            // Handle specific signup errors
            if (error.code === ERROR_CODES.PHONE_ALREADY_EXISTS) {
                // The signup screen will display this error
                return;
            }
            // For other errors, handle globally
            handleAuthError(error);
        }
    });

    const checkAuthApi = useApi(async () => {
        try {
            const [token, storedUserData] = await AsyncStorage.multiGet(['token', 'userData']);

            if (!token[1]) {
                setIsLoading(false);
                return;
            }

            // First try to use stored user data
            if (storedUserData[1]) {
                const parsedUserData = JSON.parse(storedUserData[1]);
                setUser(parsedUserData);
                setIsLoading(false);

                // Verify token in background
                try {
                    const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/auth/status`, {
                        headers: { Authorization: `Bearer ${token[1]}` },
                    });

                    if (!response.data.isAuthenticated) {
                        await logout();
                    }
                } catch (error) {
                    console.error('Token verification failed:', error);
                    // Only logout if it's an authentication error
                    if (error.response?.status === 401) {
                        await logout();
                    } else {
                        // Handle other errors globally
                        handleGlobalError(error, { context: 'token_verification' });
                    }
                }
                return;
            }

            // If no stored user data, verify token and get user data
            const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/auth/status`, {
                headers: { Authorization: `Bearer ${token[1]}` },
            });

            if (response.data.isAuthenticated) {
                const userData = {
                    id: response.data.userId,
                    contact_number: response.data.contact_number,
                    name: response.data.name,
                    role: response.data.role,
                    token: token[1],
                    agencyId: response.data.agencyId,
                    destinationCategoryId: response.data.destinationCategoryId,
                    isVerified: response.data.isVerified
                };

                await AsyncStorage.setItem('userData', JSON.stringify(userData));
                setUser(userData);

                const targetRoute = response.data.role === 'agency' ? '/(agency)' :
                    response.data.role === 'agency_employee' ? '/(employee)' :
                        '/(home)';

                if (router.pathname !== targetRoute) {
                    router.replace(targetRoute);
                }
            } else {
                await logout();
            }
        } catch (error) {
            console.error('Auth check error:', error);
            // Only logout if it's an authentication error
            if (error.response?.status === 401) {
                await logout();
            } else {
                // Handle other errors globally but don't crash the auth check
                handleGlobalError(error, { context: 'auth_check' });
            }
        } finally {
            setIsLoading(false);
        }
    }, {
        onError: (error) => {
            // For auth check errors, handle them gracefully
            if (error.code === ERROR_CODES.SESSION_EXPIRED || error.code === ERROR_CODES.UNAUTHORIZED) {
                logout();
            } else {
                // Log other errors but don't show them to user during auth check
                console.error('Auth check failed:', error);
            }
        }
    });

    useEffect(() => {
        checkAuthApi.execute();
    }, []);

    const logout = async () => {
        try {
            await AsyncStorage.multiRemove(['token', 'role', 'userData']);
            setUser(null);
            router.replace('/(auth)/login');
        } catch (error) {
            console.error('Logout error:', error);
            // Even if logout fails, still redirect to login
            router.replace('/(auth)/login');
        }
    };

    // Auto-logout on session expiry
    const handleSessionExpiry = () => {
        logout();
        Alert.alert(
            'Session Expired',
            'Your session has expired. Please log in again.',
            [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
        );
    };

    if (isLoading) {
        return null; // Loading is handled by RootLayoutNav
    }

    // Only show error for critical auth errors that prevent the app from working
    if (checkAuthApi.error && checkAuthApi.error.code === ERROR_CODES.UNEXPECTED_CRASH) {
        return <ErrorDisplay error={checkAuthApi.error} onRetry={checkAuthApi.retry} />;
    }

    return (
        <AuthContext.Provider value={{
            user,
            loading: checkAuthApi.isLoading,
            login: loginApi.execute,
            signup: signupApi.execute,
            logout,
            handleSessionExpiry,
            checkAuth: checkAuthApi.execute,
            loginError: loginApi.error,
            signupError: signupApi.error,
            loginRetry: loginApi.retry,
            signupRetry: signupApi.retry,
            setLoginError: loginApi.setError,
            setSignupError: signupApi.setError,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
