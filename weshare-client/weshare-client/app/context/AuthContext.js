import React, { createContext, useContext, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            const response = await axios.get('http://10.48.21.202:5002/api/auth/status', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = response.data;

            if (data.isAuthenticated) {
                setUser({
                    id: data.userId,
                    email: data.email,
                    name: data.name,
                    role: data.role,
                    token,
                });
            } else {
                await AsyncStorage.removeItem('token');
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            await AsyncStorage.removeItem('token');
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const response = await axios.post('http://10.48.21.202:5002/api/auth/login', {
                email,
                password,
            });

            const data = response.data;


            await AsyncStorage.setItem('token', data.token);

            const decoded = jwtDecode(data.token);
            setUser({
                id: decoded.id,
                email,
                name: '', // Will be updated in checkAuth
                role: data.role,
                token: data.token,
            });

            await checkAuth();

            router.replace('/(home)');
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const signup = async (userData, role) => {
        try {
            const response = await axios.post('http://10.48.21.202:5002/api/auth/signup', {
                ...userData,
                role,
            });

            await login(userData.email, userData.password);
        } catch (error) {
            console.error('Signup error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.error || 'Signup failed');
        }
    };

    const logout = async () => {
        await AsyncStorage.removeItem('token');
        setUser(null);
        router.replace('/(auth)/login');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);