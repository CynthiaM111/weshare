import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const EmployeeHomeScreen = () => {
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRides();
    }, []);

    const fetchRides = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/rides/employee`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setRides(res.data);
        } catch (error) {
            console.error('Error fetching rides:', error);
            Alert.alert('Error', 'Failed to load rides');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async (rideId, userId) => {
        try {
            const token = await AsyncStorage.getItem('token');
            await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/rides/${rideId}/check-in`,
                { userId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            Alert.alert('Success', 'Passenger checked in');
            fetchRides();
        } catch (error) {
            Alert.alert('Error', error.response?.data?.error || 'Check-in failed');
        }
    };

    const renderPassenger = (rideId) => ({ item }) => (
        <View style={styles.passenger}>
            <Text style={styles.passengerName}>{item.userId.name} ({item.userId.email})</Text>
            <Text style={styles.passengerStatus}>Status: {item.checkInStatus}</Text>
            {item.checkInStatus === 'pending' && (
                <TouchableOpacity
                    style={styles.checkInButton}
                    onPress={() => handleCheckIn(rideId, item.userId._id)}
                >
                    <Text style={styles.checkInText}>Check In</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const renderRide = ({ item }) => (
        <View style={styles.rideCard}>
            <View style={styles.routeContainer}>
                <Ionicons name="location-outline" size={20} color="#2C7A7B" style={styles.icon} />
                <Text style={styles.routeText}>
                    {item.categoryId.from} → {item.categoryId.to}
                </Text>
            </View>
            <View style={styles.timeContainer}>
                <Ionicons name="calendar-outline" size={18} color="#F56565" style={styles.icon} />
                <Text style={styles.timeText}>
                    {new Date(item.departure_time).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    })}
                </Text>
                <Ionicons name="time-outline" size={18} color="#F56565" style={styles.icon} />
                <Text style={styles.timeText}>
                    {new Date(item.departure_time).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                    })}
                </Text>
            </View>
            <Text style={styles.detailText}>
                Seats: {item.seats - item.booked_seats}/{item.seats}
            </Text>
            <Text style={styles.detailText}>Status: {item.statusDisplay}</Text>
            <FlatList
                data={item.bookedBy}
                renderItem={renderPassenger(item._id)}
                keyExtractor={booking => booking.userId._id}
                ListHeaderComponent={<Text style={styles.passengerHeader}>Passengers</Text>}
            />
        </View>
    );

    if (loading) {
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}> Ready to Check-In Rides:</Text>
            <FlatList
                data={rides}
                renderItem={renderRide}
                keyExtractor={item => item._id}
                ListEmptyComponent={<Text style={styles.emptyText}>No rides available</Text>}
            />
        </View>
    );
};

export default EmployeeHomeScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#F7FAFC', // Light gray background
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#2D3748', // Dark gray
        marginBottom: 20,
        textAlign: 'center',
    },
    rideCard: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 12,
        marginBottom: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderLeftWidth: 4,
        borderLeftColor: '#319795', // Teal accent
    },
    routeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    routeText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2C7A7B', // Teal
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        flexWrap: 'wrap',
    },
    timeText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#F56565', // Coral
        marginRight: 15,
    },
    detailText: {
        fontSize: 14,
        color: '#4A5568', // Medium gray
        marginBottom: 5,
    },
    passengerHeader: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2D3748',
        marginTop: 10,
        marginBottom: 5,
    },
    passenger: {
        paddingVertical: 10,
        borderTopWidth: 1,
        borderColor: '#EDF2F7',
    },
    passengerName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#2D3748',
    },
    passengerStatus: {
        fontSize: 13,
        color: '#718096', // Light gray
        marginTop: 2,
    },
    checkInButton: {
        backgroundColor: '#319795', // Teal
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        marginTop: 8,
        alignSelf: 'flex-start',
    },
    checkInText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    icon: {
        marginRight: 8,
    },
    loadingText: {
        fontSize: 16,
        color: '#4A5568',
        textAlign: 'center',
        marginTop: 20,
    },
    emptyText: {
        fontSize: 16,
        color: '#4A5568',
        textAlign: 'center',
        marginTop: 20,
    },
});