// app/(rides)/[id].js
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function RideDetails() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [ride, setRide] = useState(null);
    const [loading, setLoading] = useState(true);
   

    useEffect(() => {
        fetchRideDetails();
    }, []);

    const fetchRideDetails = async () => {
        try {
            const response = await axios.get(`http://10.48.21.202:5002/api/rides/${id}`);
            setRide(response.data);
        } catch (error) {
            console.error('Error fetching ride details in [id].js:', error);
            router.back();
        } finally {
            setLoading(false);
        }
    };

    if (loading || !ride) {
        return (
            <View style={styles.container}>
                <Text>Loading ride details...</Text>
            </View>
        );
    }

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
                    <Text style={styles.label}>Available Seats:</Text>
                    <Text style={styles.value}>
                        {ride.seats - (ride.booked_seats || 0)} / {ride.seats}
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
                onPress={() => console.log('Book ride')}
            >
                <Text style={styles.bookButtonText}>Book This Ride</Text>
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
        color: '#2e86de',
    },
    bookButton: {
        backgroundColor: '#2e86de',
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