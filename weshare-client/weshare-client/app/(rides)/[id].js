// app/(rides)/[id].js
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import ErrorDisplay from '../../components/ErrorDisplay';

export default function RideDetails() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();

    const {
        data: ride,
        error: rideError,
        isLoading: isLoadingRide,
        execute: fetchRideDetails,
        retry: retryFetchRide
    } = useApi(async () => {
        const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/rides/${id}`);
        return response.data;
    });

    const {
        error: bookingError,
        isLoading: isBooking,
        execute: bookRide,
        retry: retryBooking
    } = useApi(async () => {
        const response = await axios.post(
            `${process.env.EXPO_PUBLIC_API_URL}/rides/${id}/book`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${user.token}`
                }
            }
        );
        return response.data;
    });

    useEffect(() => {
        if (id === 'employee') {
            router.replace('/(rides)/employee');
            return;
        }

        const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);
        if (!id || !isValidObjectId(id)) {
            router.replace('/(rides)');
            return;
        }

        fetchRideDetails();
    }, [id, router]);

    const handleBookRide = async () => {
        try {
            await bookRide();
            fetchRideDetails();
            router.replace('/(rides)/booked');
        } catch (error) {
            // Error is already handled by useApi
            console.error('Booking error:', error);
        }
    };

    if (isLoadingRide) {
        return (
            <View style={styles.container}>
                <Text>Loading ride details...</Text>
            </View>
        );
    }

    if (rideError) {
        return (
            <View style={styles.container}>
                <ErrorDisplay
                    error={rideError}
                    onRetry={retryFetchRide}
                    title="Error Loading Ride"
                    message="We couldn't load the ride details at this time."
                />
            </View>
        );
    }

    if (bookingError) {
        return (
            <View style={styles.container}>
                <ErrorDisplay
                    error={bookingError}
                    onRetry={retryBooking}
                    title="Booking Failed"
                    message="We couldn't book your ride at this time."
                />
            </View>
        );
    }

    if (!ride) {
        return null;
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
                        {format(new Date(ride.departure_time), 'PPP p')}
                    </Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.label}>Est. Arrival:</Text>
                    <Text style={styles.value}>
                        {format(new Date(ride.estimatedArrivalTime), 'PPP p')}
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
                style={[styles.bookButton, (isBooking || ride.statusDisplay === 'Full') && styles.bookButtonDisabled]}
                onPress={handleBookRide}
                disabled={isBooking || ride.statusDisplay === 'Full'}
            >
                <Text style={styles.bookButtonText}>
                    {isBooking ? 'Booking...' :
                        ride.statusDisplay === 'Full' ? 'Ride Full' :
                            'Book This Ride'}
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
    bookButtonDisabled: {
        backgroundColor: '#ccc',
        opacity: 0.7,
    },
});