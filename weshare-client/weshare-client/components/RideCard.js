// app/_components/RideCard.js
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function RideCard({ ride, onPress }) {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <Text style={styles.route}>{ride.from} → {ride.to}</Text>
            <Text style={styles.time}>
                {new Date(ride.departure_time).toLocaleString()}
            </Text>
            <View style={styles.footer}>
                <Text style={styles.seats}>
                    {ride.seats - (ride.booked_seats || 0)} seats left
                </Text>
                <Text style={styles.price}>${ride.price}</Text>
            </View>
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
    },
    seats: {
        color: '#444',
    },
    price: {
        fontWeight: 'bold',
        color: '#2e86de',
    },
});