import React, { useState, useEffect } from 'react';
import { View, FlatList, Text, Alert, ActivityIndicator} from 'react-native';
import axios from 'axios';
import GlobalStyles from '../styles/GlobalStyles';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import RideCard from '../components/RideCard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { getToken, isAuthenticated } from '../services/authService';
import { Button } from '@ui-kitten/components';
export default function HomeScreen({ navigation }) {
    const [rides, setRides] = useState([]);
    const [searchResults, setSearchResults] = useState(null);
    const [bookedRides, setBookedRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const baseUrl = 'http://10.48.29.77:4000';

    const checkAuthAndFetchRides = async () => {
        setLoading(true);
        setError(null);
        setSearchResults(null); // Clear search results on refresh
        try {
            const token = await getToken();
            const authenticated = await isAuthenticated();
            if (!authenticated || !token) {
                setError('Please login to see rides');
                setLoading(false);
                return;
            }
            setIsLoggedIn(true);

            // Decode token to get userId
            const decodedToken = jwtDecode(token);
            const userId = decodedToken.userId;

            const response = await axios.get(`${baseUrl}/users/${userId}/rides`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.data.userRides) {
                setRides(response.data.userRides);
            }
            if (response.data.bookedRides) {
                setBookedRides(response.data.bookedRides);
            }
        } catch (error) {
            console.error("Error fetching rides:", error);
            if (error.response?.status === 401) {
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

    const handleSearch = async ({ from, to, departureDate }) => {
        if (!from || !to || !departureDate) {
            let missingFields = [];
            if (!from) missingFields.push('"From"');
            if (!to) missingFields.push('"To"');
            if (!departureDate) missingFields.push('"Departure Date"');
            Alert.alert(
                'Missing Information',
                `Please fill in the following field(s): ${missingFields.join(', ')}.`
            );
            return; // Stop here, no loading or search
        }
        setLoading(true);
        setError(null);
        setSearchResults(null); // Reset previous search results
        try {
            // Allow search even without token, since backend is public
            const url = `${baseUrl}/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&departureDate=${departureDate}`;

            console.log('Searching for rides at URL:', url);
            const response = await axios.get(
                `${baseUrl}/rides/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&departureDate=${departureDate}`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        // Token optional for public search; include if backend requires it later
                        ...(await getToken() && { 'Authorization': `Bearer ${await getToken()}` }),
                    },
                }
            );
           

            // Success case (200): Rides found
            setSearchResults(response.data.length > 0 ? response.data : []);
            if (response.data.length === 0) {
                console.log('No rides returned, but 200 OK');
            }
        } catch (error) {
            if (error.response && error.response.status === 404) {
                // 404: No rides found, treat as valid case
                console.log('404 received: No rides found');
                setSearchResults([]);
            } else {
                // Other errors (e.g., 500, network issues)
                console.error('Error searching rides:', error);
                setError('Failed to search rides');
                Alert.alert('Error', 'Failed to search rides. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const clearSearchResults = () => {
        setSearchResults(null);
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

    // Error state
    if (error) {
        return (
            <View style={[GlobalStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: 'red' }}>{error}</Text>
                {error.includes('login') && (
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
        <View style={[GlobalStyles.container, { flex: 1 }]}>
            <Header onPostRide={() => navigation.navigate('PostRideScreen')} />
            <SearchBar onSearch={handleSearch} />
            {searchResults !== null && (
                <Button
                    appearance="filled"
                    status="basic"
                    onPress={clearSearchResults}
                    style={{ marginHorizontal: 5, marginVertical: 10,backgroundColor:'#f0f0f0',borderColor:'black',borderWidth:1,borderRadius:6}}
                >
                    Back to My Rides
                </Button>
            )}
            
            {loading ? (
                <ActivityIndicator size="large" style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={searchResults !== null ? searchResults : rides} // Prioritize search results
                    keyExtractor={(item) => item._id?.toString() || Math.random().toString()} // Use _id from backend
                    renderItem={({ item }) => <RideCard ride={item} />}
                    contentContainerStyle={{ flexGrow: 1 }}
                    ListHeaderComponent={
                        searchResults !== null && (
                            <Text style={{ textAlign: 'center', marginVertical: 10 }}>
                                {searchResults.length > 0 ? 'Search Results' : 'No Search Results'}
                            </Text>
                        )
                    }
                    ListEmptyComponent={
                        <Text style={{ textAlign: 'center', marginTop: 20 }}>
                            {searchResults !== null && searchResults.length === 0
                                ? 'No rides match your search'
                                : 'No rides available'}
                        </Text>
                    }
                />
            )}
        </View>
    );
}