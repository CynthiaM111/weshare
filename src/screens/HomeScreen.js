import React, { useState, useEffect } from 'react';
import { View, FlatList, Text, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import GlobalStyles from '../styles/GlobalStyles';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import RideCard from '../components/RideCard';

export default function HomeScreen({ navigation }) {
    const [rides, setRides] = useState([]);
    const [bookedRides, setBookedRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const TEMP_USER_ID = "60b6a3f8c6a7463ad6f7a29d"; // Hardcoded for testing
    const baseUrl = 'http://10.48.96.152:4000';

    useEffect(() => {
        fetchRides(TEMP_USER_ID);
    }, []);

    const fetchRides = async (userId) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${baseUrl}/users/${userId}/rides`);
             // Debug log

            // Check if response.data is an array
            if (Array.isArray(response.data)) {
                setRides(response.data);
            }
            // If response.data has a specific structure with rides property
            else if (response.data && response.data.rides) {
                setRides(response.data.rides);
            }
            // If response.data has both rides and bookedRides
            else if (response.data && response.data.bookedRides) {
                setRides(response.data.bookedRides);
            }
            // If no recognized structure, log error
            else {
                console.error('Unexpected data structure:', response.data);
                setError('Unexpected data structure received');
            }

            if (response.data.bookedRides) {
                setBookedRides(response.data.bookedRides);
            }
        } catch (error) {
            console.error("Error fetching rides:", error);
            setError('Failed to load rides');
            Alert.alert("Error", "Failed to load rides. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    // If there's an error, display it
    if (error) {
        return (
            <View style={[GlobalStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: 'red' }}>{error}</Text>
                <Text style={{ marginTop: 10 }} onPress={() => fetchRides(TEMP_USER_ID)}>
                    Tap to retry
                </Text>
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