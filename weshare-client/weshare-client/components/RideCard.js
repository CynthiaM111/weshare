// app/_components/RideCard.js
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../app/context/AuthContext';
import { Button, Text as KittenText } from '@ui-kitten/components';
import axios from 'axios';
import { useRouter } from 'expo-router';

export default function RideCard({ ride, onPress, onBookingSuccess }) {
    const { user } = useAuth();
    const router = useRouter();


    const handleBooking = async () => {
        if (!user) {
            // Redirect to login if not authenticated
            router.push('/(auth)/login');
            return;
        }

        try {
            const response = await axios.post(
                `http://10.48.21.202:5002/api/rides/${ride._id}/book`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${user.token}`
                    }
                }
            );
            Alert.alert('Success', 'Ride booked successfully!');
            if (onBookingSuccess) {
                onBookingSuccess();
            }
            router.push('/(rides)/booked');
        } catch (error) {
            Alert.alert('Error', error.response?.data?.error || 'Failed to book ride');
        }
    };

    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <Text style={styles.route}>{ride.from} → {ride.to}</Text>
            <Text style={styles.time}>
                {new Date(ride.departure_time).toLocaleString()}
            </Text>
            <View style={styles.footer}>
                <Text style={styles.seats}>
                    {ride.available_seats} seats left
                </Text>
                <Text style={styles.price}>${ride.price}</Text>
            </View>
            <Button 
                onPress={handleBooking}
                disabled={ride.available_seats <= 0}
                status={ride.available_seats > 0 ? 'primary' : 'basic'}
                style={styles.bookButton}
            >
                <KittenText>
                    {ride.available_seats > 0 ? 'Book Now' : 'Fully Booked'}
                </KittenText>
            </Button>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        padding: 16,
        marginBottom: 12,
        borderRadius: 8,
        elevation: 2,
    },
    route: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    time: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    seats: {
        color: '#444',
    },
    price: {
        fontWeight: 'bold',
        color: '#2e86de',
    },
    bookButton: {
        marginTop: 8,
    },
});