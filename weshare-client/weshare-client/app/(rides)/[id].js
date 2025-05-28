// app/(rides)/[id].js
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { config } from '../../config';
import { useAuth } from '../context/AuthContext';

export default function RideDetails() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const [ride, setRide] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        

        if (id === 'employee') {
            console.log('Employee route accessed via [id].js - redirecting properly');
            router.replace('/(rides)/employee');
            return;
        }
        // Rest of your existing ID validation...
        const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);
        if (!id || !isValidObjectId(id)) {
            router.replace('/(rides)');
            return;
        }


        fetchRideDetails();
    }, [id, router]);

    const fetchRideDetails = async () => {
        try {
            console.log('Fetching ride details from:', `${process.env.EXPO_PUBLIC_API_URL}/rides/${id}`);
            const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/rides/${id}`);

            setRide(response.data);
        } catch (error) {
            console.error('Error fetching ride details in [id].js:', error);

        } finally {
            setLoading(false);
        }
    };

    const handleBookRide = async () => {
        try {
            const response = await axios.post(
                `${process.env.EXPO_PUBLIC_API_URL}/rides/${id}/book`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${user.token}`
                    }
                }
            );

            Alert.alert('Success', 'Ride booked successfully!');
            fetchRideDetails();
            router.replace('/(rides)/booked'); // Changed from push to replace
        } catch (error) {
            console.error('Booking error:', error);
            Alert.alert('Error', error.response?.data?.error || 'Failed to book ride');
        }
    };

    if (loading || !ride) {
        return (
            <View style={styles.container}>
                <Text>Loading ride details...</Text>
            </View>
        );
    }

    // Determine status color
    const statusColor = ride.statusDisplay === 'Full' ? '#FF0000' :
        ride.statusDisplay === 'Nearly Full' ? '#FFA500' : '#008000';


    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.title}>{ride.from} to {ride.to}</Text>

                <View style={styles.detailRow}>
                    <Text style={styles.label}>Departure:</Text>
                    <Text style={styles.value}>
                        {new Date(ride.departure_time).toLocaleString()}
                    </Text>
                </View>

                <View style={styles.detailRow}>
                    <Text style={styles.label}>Status:</Text>
                    <Text style={[styles.value, { color: statusColor, fontWeight: 'bold' }]}>
                        {ride.statusDisplay} ({ride.booked_seats}/{ride.seats} seats booked)
                    </Text>
                </View>

                <View style={styles.detailRow}>
                    <Text style={styles.label}>Available Seats:</Text>
                    <Text style={styles.value}>
                        {ride.available_seats} / {ride.seats}
                    </Text>
                </View>

                <View style={styles.detailRow}>
                    <Text style={styles.label}>Price:</Text>
                    <Text style={[styles.value, styles.price]}>${ride.price}</Text>
                </View>

                <View style={styles.detailRow}>
                    <Text style={styles.label}>Agency:</Text>
                    <Text style={styles.value}>{ride.agencyId?.name || 'Unknown Agency'}</Text>
                </View>
            </View>

            <TouchableOpacity
                style={styles.bookButton}
                onPress={handleBookRide}
                disabled={ride.statusDisplay === 'Full'}
            >
                <Text style={styles.bookButtonText}>
                    {ride.statusDisplay === 'Full' ? 'RideFull' : 'Book This Ride'}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f5f5f5',
    },
    card: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    label: {
        fontSize: 16,
        color: '#666',
    },
    value: {
        fontSize: 16,
    },
    price: {
        fontWeight: 'bold',
        color: 'royalblue',
    },
    bookButton: {
        backgroundColor: 'royalblue',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    bookButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});