import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Alert } from 'react-native';
import { useApi } from '../../hooks/useApi'; // Adjust path if needed
import ErrorDisplay from '../../components/ErrorDisplay'; // Adjust path if needed
import { handleApiError } from '../../utils/apiErrorHandler';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
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
            await AsyncStorage.setItem('token', data.token);
            await AsyncStorage.setItem('role', data.role);

            const decoded = jwtDecode(data.token);
            const userData = {
                id: decoded.id,
                email,
                name: data.name || '',
                role: data.role,
                token: data.token,
                agencyId: data.agencyId,
                destinationCategoryId: data.destinationCategoryId,
            };

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
        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/auth/status`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        const data = response.data;

        if (data.isAuthenticated) {
            const userData = {
                id: data.userId,
                email: data.email,
                name: data.name,
                role: data.role,
                token,
                agencyId: data.agencyId,
                destinationCategoryId: data.destinationCategoryId,
            };
            setUser(userData);

            const targetRoute = data.role === 'agency' ? '/(agency)' :
                data.role === 'agency_employee' ? '/(employee)' :
                    '/(home)';

            if (router.pathname !== targetRoute) {
                router.replace(targetRoute);
            }
        } else {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('role');
        }
    });

    useEffect(() => {
        checkAuthApi.execute();
    }, []);

    const logout = async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('role');
        setUser(null);
        router.replace('/(auth)/login');
    };

    // Show error screen on auth check error
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
