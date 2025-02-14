import React, { useState, useEffect } from 'react';
import { View, FlatList, Text, Alert, ActivityIndicator, Button } from 'react-native';
import axios from 'axios';
import GlobalStyles from '../styles/GlobalStyles';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import RideCard from '../components/RideCard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { getToken,isAuthenticated } from '../services/authService';

export default function HomeScreen({ navigation }) {
    const [rides, setRides] = useState([]);
    const [bookedRides, setBookedRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const baseUrl = 'http://10.48.96.152:4000';

    const checkAuthAndFetchRides = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = await getToken();
            const authenticated = await isAuthenticated();
            if (!authenticated) {
                setError('Please login to see rides');
                setLoading(false);
                return;
            }
            setIsLoggedIn(true);
            // Create axios instance with authorization header
            if (!token) {
                setError('Authentication required. Please login to see rides');
                setLoading(false);
                return;
            }
            const axiosInstance = axios.create({
                baseURL: baseUrl,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            // Decode token to get userId
            const decodedToken = jwtDecode(token);
            const userId = decodedToken.userId;
            
            const response = await axiosInstance.get(`/users/${userId}/rides`);

            if (response.data.userRides) {
                setRides(response.data.userRides);
            }
            if (response.data.bookedRides) {
                setBookedRides(response.data.bookedRides);
            }
        } catch (error) {
            console.error("Error fetching rides:", error);
            if (error.response?.status === 401) {
                // Token expired or invalid
                await AsyncStorage.removeItem('token');
                setError('Session expired. Please login again');
                navigation.navigate('Account');
            } else {
                setError('Failed to load rides');
                Alert.alert("Error", "Failed to load rides. Please try again later.");
            }
        } finally {
            setLoading(false);
        }
    };

    // Refresh rides when the screen comes into focus
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            checkAuthAndFetchRides();
        });

        return unsubscribe;
    }, [navigation]);

    // Initial load
    useEffect(() => {
        checkAuthAndFetchRides();
    }, []);

    // If there's an error, display it with login button if needed
    if (error) {
        return (
            <View style={[GlobalStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: 'red' }}>{error}</Text>
                {error === 'Please login to see rides' && (
                    <Button
                        title="Login"
                        onPress={() => navigation.navigate('Account')}
                        style={{ marginTop: 10 }}
                    />
                )}
            </View>
        );
    }

    return (
        <View style={GlobalStyles.container}>
            <Header onPostRide={() => navigation.navigate('PostRideScreen')} />
            <SearchBar />
            {loading ? (
                <ActivityIndicator size="large" style={{ marginTop: 20 }} />
            ) : rides.length > 0 ? (
                <FlatList
                    data={rides}
                    keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                    renderItem={({ item }) => <RideCard ride={item} />}
                    style={{ marginBottom: 60 }}
                    ListEmptyComponent={
                        <Text style={{ textAlign: 'center', marginTop: 20 }}>
                            No rides available
                        </Text>
                    }
                />
            ) : (
                <Text style={{ textAlign: 'center', marginTop: 20 }}>
                    No rides available
                </Text>
            )}
        </View>
    );
}