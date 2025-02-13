import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://10.48.96.152:4000/auth';

// Save token to local storage
const storeToken = async (token) => {
    await AsyncStorage.setItem('token', token);
};

// Get stored token
export const getToken = async () => {
    return await AsyncStorage.getItem('token');
};

// Remove token (Logout)
const removeToken = async () => {
    await AsyncStorage.removeItem('token');
};

// User Signup
export const signup = async (userData) => {
    try {
        const response = await axios.post(`${API_URL}/signup`, userData);
        if (response.data.token) {
            await storeToken(response.data.token);
        }
        return response.data;
    } catch (error) {
        console.error('Signup API Error', error?.response?.data || error.message);
        throw new Error(error?.response?.data?.error || error.message);
    }
};

// User Login
export const login = async (emailOrPhone, password) => {
    try {
        const token = await getToken();
        if (token) {
            throw new Error('Already logged in');
        }

        const response = await axios.post(`${API_URL}/login`, { emailOrPhone, password });
        if (response.data.token) {
            await storeToken(response.data.token);
        }
        return response.data;
    } catch (error) {
        throw new Error(error?.response?.data?.error || error.message);
    }
};

// Check if user is authenticated
export const isAuthenticated = async () => {
    const token = await getToken();
    return !!token;
};

// Logout user
export const logout = async () => {
    try {
        const token = await getToken();
        if (!token) {
            throw new Error('Not logged in');
        }

        // Call logout endpoint with token
        await axios.post(`${API_URL}/logout`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });

        await removeToken();
        return { success: true, message: 'Logged out successfully' };
    } catch (error) {
        throw new Error(error?.response?.data?.error || error.message);
    }
};
