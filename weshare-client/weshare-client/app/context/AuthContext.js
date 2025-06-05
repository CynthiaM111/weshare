import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Alert } from 'react-native';
import { useApi } from '../../hooks/useApi';
import ErrorDisplay from '../../components/ErrorDisplay';
import { handleApiError } from '../../utils/apiErrorHandler';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const loginApi = useApi(async (email, password) => {
        try {
            const response = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/auth/login`, {
                email,
                password,
            });

            if (response.status !== 200) {
                throw new Error(response.data.error || 'Login failed. Check your credentials and try again.');
            }

            const data = response.data;
            const userData = {
                id: data.userId,
                email,
                name: data.name || '',
                role: data.role,
                token: data.token,
                agencyId: data.agencyId,
                destinationCategoryId: data.destinationCategoryId,
            };

            // Store auth data
            await AsyncStorage.multiSet([
                ['token', data.token],
                ['role', data.role],
                ['userData', JSON.stringify(userData)]
            ]);

            setUser(userData);

            const route = data.role === 'agency' ? '/(agency)' :
                data.role === 'agency_employee' ? '/(employee)' :
                    '/(home)';
            router.replace(route);
        } catch (error) {
            const formattedError = handleApiError(error);
            throw formattedError;
        }
    });

    const signupApi = useApi(async (userData, role) => {
        const response = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/auth/signup`, {
            ...userData,
            role,
        });

        if (response.status !== 201) {
            throw new Error(response.data.error || 'Signup failed');
        }

        Alert.alert('Success', response.data.message);
        await loginApi.execute(userData.email, userData.password);
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
                    email: response.data.email,
                    name: response.data.name,
                    role: response.data.role,
                    token: token[1],
                    agencyId: response.data.agencyId,
                    destinationCategoryId: response.data.destinationCategoryId,
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
            }
        } finally {
            setIsLoading(false);
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
        }
    };

    if (isLoading) {
        return null; // Or a loading spinner
    }

    if (checkAuthApi.error) {
        return <ErrorDisplay error={checkAuthApi.error} onRetry={checkAuthApi.retry} />;
    }

    return (
        <AuthContext.Provider value={{
            user,
            loading: checkAuthApi.isLoading,
            login: loginApi.execute,
            signup: signupApi.execute,
            logout,
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
};

export const useAuth = () => useContext(AuthContext);
