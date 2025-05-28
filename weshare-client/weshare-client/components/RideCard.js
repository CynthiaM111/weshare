import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

export default function RideCard({
    ride,
    onPress,
    isBooked,
    availableSeats,
    statusDisplay,
    isFull,
    showCancelButton,
    onCancelBooking,
    onShowQRCode,
    isCheckedIn
}) {
    // Determine status color
    const statusColor = statusDisplay === 'Full' ? '#FF0000' :
        statusDisplay === 'Nearly Full' ? '#FFA500' : '#008000';

    return (
        <TouchableOpacity
            style={[styles.card, isFull && styles.fullCard]}
            onPress={onPress}
            disabled={isFull && !isBooked}
        >
            <View style={styles.header}>
                <Text style={styles.title}>{ride.from} → {ride.to}</Text>
                <View style={styles.badgeContainer}>
                    {isBooked && (
                        <Text style={styles.bookedTag}>Booked</Text>
                    )}
                    {isCheckedIn && (
                        <Text style={styles.checkedInTag}>Checked In</Text>
                    )}
                </View>
            </View>

            <View style={styles.detailRow}>
                <Text style={styles.label}>Departure:</Text>
                <Text style={styles.value}>
                    {new Date(ride.departure_time).toLocaleString()}
                </Text>
            </View>

            <View style={styles.detailRow}>
                <Text style={styles.label}>Status:</Text>
                <Text style={[styles.value, { color: statusColor, fontWeight: 'bold' }]}>
                    {statusDisplay} ({ride.booked_seats}/{ride.seats} seats booked)
                </Text>
            </View>

            <View style={styles.detailRow}>
                <Text style={styles.label}>Available Seats:</Text>
                <Text style={styles.value}>{availableSeats} / {ride.seats}</Text>
            </View>

            <View style={styles.detailRow}>
                <Text style={styles.label}>Price:</Text>
                <Text style={[styles.value, styles.price]}>${ride.price}</Text>
            </View>

            <View style={styles.buttonContainer}>
                {isBooked && !isCheckedIn && (
                    <TouchableOpacity
                        style={styles.qrButton}
                        onPress={onShowQRCode}
                    >
                        <FontAwesome5 name="qrcode" size={16} color="white" />
                        <Text style={styles.qrButtonText}>Show QR Code</Text>
                    </TouchableOpacity>
                )}
                {showCancelButton && isBooked && !isCheckedIn && (
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={onCancelBooking}
                    >
                        <FontAwesome5 name="times" size={16} color="white" />
                        <Text style={styles.cancelButtonText}>Cancel Booking</Text>
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    fullCard: {
        opacity: 0.7,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    badgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    bookedTag: {
        backgroundColor: '#4CAF50',
        color: 'white',
        padding: 4,
        borderRadius: 4,
        fontSize: 12,
    },
    checkedInTag: {
        backgroundColor: '#1E90FF',
        color: 'white',
        padding: 4,
        borderRadius: 4,
        fontSize: 12,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    label: {
        fontSize: 14,
        color: '#666',
    },
    value: {
        fontSize: 14,
    },
    price: {
        fontWeight: 'bold',
        color: 'royalblue',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
        marginTop: 12,
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF0000',
        padding: 10,
        borderRadius: 6,
       
    },
    cancelButtonText: {
        color: 'white',
        fontSize: 14,
        marginLeft: 8,
    },
    qrButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4CAF50',
        padding: 10,
        borderRadius: 6,
    },
    qrButtonText: {
        color: 'white',
        fontSize: 14,
        marginLeft: 8,
    },
});