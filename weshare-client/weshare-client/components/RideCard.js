import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';

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
    isCheckedIn,
    isPrivate
}) {
    // Ensure we have valid numbers for calculations
    const totalSeats = parseInt(ride.seats) || 1;
    const bookedSeats = parseInt(ride.booked_seats) || 0;
    const ridePrice = parseFloat(ride.price) || 0;

    // Calculate available seats if not provided
    const calculatedAvailableSeats = availableSeats !== undefined
        ? availableSeats
        : totalSeats - bookedSeats;

    // Calculate status if not provided
    const calculatedStatusDisplay = statusDisplay || (() => {
        if (isPrivate) {
            return ride.status === 'active' ? 'Available' : 'Inactive';
        }
        if (calculatedAvailableSeats === 0) return 'Full';
        if (calculatedAvailableSeats <= totalSeats * 0.3) return 'Nearly Full';
        return 'Available';
    })();

    // Determine status color
    const statusColor = calculatedStatusDisplay === 'Full' ? '#FF0000' :
        calculatedStatusDisplay === 'Nearly Full' ? '#FFA500' :
            calculatedStatusDisplay === 'Inactive' ? '#666' : '#008000';

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

            <View style={styles.detailsContainer}>
                <View style={styles.detailItem}>
                    <View style={styles.detailHeader}>
                        <FontAwesome5 name="bus-alt" size={14} color="#2196F3" />
                        <Text style={styles.detailLabel}>Dep.</Text>
                    </View>
                    <Text style={styles.detailValue}>{format(new Date(ride.departure_time), 'PPP p')}</Text>
                </View>

                <View style={styles.detailItem}>
                    <View style={styles.detailHeader}>
                        <FontAwesome5 name="clock" size={14} color="#FF9800" />
                        <Text style={styles.detailLabel}>ETA</Text>
                    </View>
                    <Text style={styles.detailValue}>{format(new Date(ride.estimatedArrivalTime), 'PPP p')}</Text>
                </View>

                <View style={styles.detailItem}>
                    <View style={styles.detailHeader}>
                        <FontAwesome5 name="users" size={14} color="#9C27B0" />
                        <Text style={styles.detailLabel}>Available Seats</Text>
                    </View>
                    <Text style={styles.detailValue}>{calculatedAvailableSeats} / {totalSeats}</Text>
                </View>

                <View style={styles.detailItem}>
                    <View style={styles.detailHeader}>
                        <FontAwesome5 name="info-circle" size={14} color={statusColor} />
                        <Text style={styles.detailLabel}>Status</Text>
                    </View>
                    <Text style={[styles.detailValue, { color: statusColor, fontWeight: 'bold' }]}>
                        {calculatedStatusDisplay}
                    </Text>
                </View>

                <View style={styles.detailItem}>
                    <View style={styles.detailHeader}>
                        <FontAwesome5 name="money-bill-wave" size={14} color="#4CAF50" />
                        <Text style={styles.detailLabel}>Price</Text>
                    </View>
                    <Text style={[styles.detailValue, styles.priceValue]}>
                        {ridePrice} RWF
                    </Text>
                </View>
            </View>

            {/* Show license plate for all rides */}
            {ride.licensePlate && (
                <View style={styles.vehicleSection}>
                    <View style={styles.vehicleSectionHeader}>
                        <FontAwesome5 name="car" size={16} color="#607D8B" />
                        <Text style={styles.vehicleSectionTitle}>Vehicle</Text>
                    </View>
                    <View style={styles.licensePlateContainer}>
                        <Text style={styles.licensePlateText}>{ride.licensePlate}</Text>
                    </View>
                </View>
            )}

            {/* Show description for private rides */}
            {isPrivate && ride.description && (
                <View style={styles.privateSection}>
                    <View style={styles.privateSectionHeader}>
                        <FontAwesome5 name="info-circle" size={16} color="#4CAF50" />
                        <Text style={styles.privateSectionTitle}>Ride Details</Text>
                    </View>
                    <Text style={styles.privateSectionContent}>{ride.description}</Text>
                </View>
            )}

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
    detailsContainer: {
        marginBottom: 12,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
        paddingVertical: 4,
    },
    detailHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    detailLabel: {
        fontSize: 14,
        color: '#666',
        marginLeft: 6,
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2c3e50',
        textAlign: 'right',
    },
    priceValue: {
        fontWeight: 'bold',
        color: '#4CAF50',
        fontSize: 16,
    },
    vehicleSection: {
        marginBottom: 12,
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 6,
        borderLeftWidth: 3,
        borderLeftColor: '#4CAF50',
    },
    vehicleSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    vehicleSectionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#2c3e50',
        marginLeft: 8,
    },
    licensePlateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 24,
    },
    licensePlateText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#4CAF50',
        letterSpacing: 1,
        fontFamily: 'monospace',
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
    privateSection: {
        marginBottom: 12,
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 6,
        borderLeftWidth: 3,
        borderLeftColor: '#4CAF50',
    },
    privateSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    privateSectionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#2c3e50',
        marginLeft: 8,
    },
    privateSectionContent: {
        fontSize: 14,
        color: '#34495e',
        lineHeight: 20,
        paddingLeft: 24,
    },
});