// components/RideCard.js
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function RideCard({ ride, onPress, isBooked, availableSeats, isFull }) {
    return (
        <TouchableOpacity onPress={onPress} style={[
            styles.card,
            isBooked && styles.bookedCard,
            isFull && styles.fullCard
        ]}>
            <View style={styles.header}>
                <Text style={styles.route}>
                    {ride.from} → {ride.to}
                </Text>
                {isBooked && (
                    <View style={styles.bookedBadge}>
                        <Text style={styles.bookedBadgeText}>Booked</Text>
                    </View>
                )}
                {isFull && !isBooked && (
                    <View style={styles.fullBadge}>
                        <Text style={styles.fullBadgeText}>Full</Text>
                    </View>
                )}
            </View>

            <View style={styles.details}>
                <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={16} color="#666" />
                    <Text style={styles.detailText}>
                        {new Date(ride.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>

                <View style={styles.detailRow}>
                    <Ionicons name="people-outline" size={16} color="#666" />
                    <Text style={styles.detailText}>
                        {availableSeats} seat{availableSeats !== 1 ? 's' : ''} available
                    </Text>
                </View>

                <View style={styles.detailRow}>
                    <Ionicons name="pricetag-outline" size={16} color="#666" />
                    <Text style={styles.detailText}>${ride.price}</Text>
                </View>
            </View>

            {ride.agencyId?.name && (
                <Text style={styles.agencyText}>{ride.agencyId.name}</Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    bookedCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#4CAF50',
    },
    fullCard: {
        opacity: 0.7,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    route: {
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
    },
    bookedBadge: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginLeft: 8,
    },
    bookedBadgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    fullBadge: {
        backgroundColor: '#f44336',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginLeft: 8,
    },
    fullBadgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    details: {
        marginBottom: 8,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    detailText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#666',
    },
    agencyText: {
        fontSize: 12,
        color: '#888',
        fontStyle: 'italic',
    },
});