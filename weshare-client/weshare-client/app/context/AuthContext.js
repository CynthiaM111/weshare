import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Alert } from 'react-native';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            console.log('[Auth] Checking token...');
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }
            console.log('[Auth] Token found:', token);

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

                console.log('[Auth] Authenticated user:', userData);
                    

                const targetRoute = data.role === 'agency' ? '/(agency)' :
                    data.role === 'agency_employee' ? '/(employee)' :
                        '/(home)';
                    
                // Only navigate if not already on the target route
                if (router.pathname !== targetRoute) {
                    console.log('Navigating to:', targetRoute);
                    router.replace(targetRoute);
                }
            } else {
                await AsyncStorage.removeItem('token');
                await AsyncStorage.removeItem('role');
            }
        } catch (error) {
            console.error('Auth check failed:', error.response?.data || error.message);
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('role');
        } finally {
            console.log("[Auth] Auth check complete. Loading set to false");
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const response = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/auth/login`, {
                email,
                password,
            });

            const data = response.data;
            

            if (response.status !== 200) {
                throw new Error(data.error || 'Login failed');
            }

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
            console.log('User role:', data.role, '[AuthContext] Navigating to:', route); // Debug log
            router.replace(route);
        } catch (error) {
            console.error('Login error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.error || 'Login failed');
        }
    };

    const signup = async (userData, role) => {
        try {
            console.log('Signup request:', { ...userData, role }); // Debug log
            const response = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/auth/signup`, {
                ...userData,
                role,
            });
            
            if (response.status !== 201) {
                throw new Error(response.data.error || 'Signup failed');
            }

            Alert.alert('Success', response.data.message);
            await login(userData.email, userData.password);
        } catch (error) {
            console.error('Signup error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.error || 'Signup failed');
        }
    };

    const logout = async () => {
        try {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('role');
            setUser(null);
            router.replace('/(auth)/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);