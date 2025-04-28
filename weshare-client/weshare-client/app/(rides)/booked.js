import { View, FlatList, Alert, RefreshControl, StyleSheet } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Text } from '@ui-kitten/components';
import axios from 'axios';
import RideCard from '../../components/RideCard';

export default function BookedRidesScreen() {
    const [bookedRides, setBookedRides] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const { user } = useAuth();

    const fetchBookedRides = async () => {
        try {
            const response = await axios.get(
                'http://10.48.21.202:5002/api/rides/booked',
                {
                    headers: {
                        Authorization: `Bearer ${user.token}`
                    }
                }
            );
            // console.log('Booked rides:', response.data); // Debug log
            setBookedRides(response.data);
        } catch (error) {
            console.error('Error fetching booked rides:', error.response || error);
            Alert.alert('Error', 'Failed to fetch booked rides');
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await fetchBookedRides();
        } finally {
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchBookedRides();
        }
    }, [user]);

    const handleCancelBooking = async (rideId) => {
        try {
            await axios.delete(
                `http://10.48.21.202:5002/api/rides/${rideId}/cancel`,
                {
                    headers: {
                        Authorization: `Bearer ${user.token}`
                    }
                }
            );
            Alert.alert('Success', 'Booking cancelled successfully');
            fetchBookedRides(); // Refresh the list
        } catch (error) {
            Alert.alert('Error', error.response?.data?.error || 'Failed to cancel booking');
        }
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={bookedRides}
                keyExtractor={item => item._id}
                renderItem={({ item }) => (
                    <RideCard
                        ride={item}
                        onCancelPress={() => handleCancelBooking(item._id)}
                        showCancelButton
                        onBookingSuccess={fetchBookedRides}
                    />
                )}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text category='s1' style={styles.emptyText}>
                            No booked rides
                        </Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f5f5f5',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        textAlign: 'center',
        color: '#8F9BB3',
    },
}); 