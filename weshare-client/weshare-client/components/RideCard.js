import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import React from 'react';

const RideCard = React.memo(({
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
    isPrivate,
    onFinishRide,
    showDriverInfo
}) => {
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

    // Helper function to get driver initials
    const getDriverInitials = (name) => {
        if (!name) return 'D';

        // If it's an email, extract the part before @
        const displayName = name.includes('@') ? name.split('@')[0] : name;

        // Split by spaces and get first letters
        const parts = displayName.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        } else if (parts.length === 1) {
            return parts[0][0].toUpperCase();
        }

        return 'D';
    };

    // Determine status color with more distinguishable colors
    const getStatusColor = (status) => {
        switch (status) {
            case 'Full':
                return '#e53e3e'; // Red
            case 'Nearly Full':
                return '#ff8c00'; // Dark Orange
            case 'Available':
                return '#38a169'; // Green
            case 'Inactive':
                return '#718096'; // Gray
            case 'Completed':
                return '#805ad5'; // Purple
            case 'Pending':
                return '#3182ce'; // Blue
            default:
                return '#38a169'; // Default Green
        }
    };

    const statusColor = getStatusColor(calculatedStatusDisplay);

    return (
        <TouchableOpacity
            style={[styles.card, isFull && styles.fullCard]}
            onPress={onPress}
            disabled={isFull && !isBooked}
        >
            {/* Driver Information Section */}
            {showDriverInfo && ride.driver && (
                <View style={styles.driverSection}>
                    <View style={styles.driverProfile}>
                        <View style={styles.driverAvatar}>
                            <Text style={styles.driverInitials}>
                                {getDriverInitials(ride.driver.name || ride.driver.email)}
                            </Text>
                        </View>
                        <View style={styles.driverDetails}>
                            <Text style={styles.driverName}>
                                {ride.driver.name || 'Driver'}
                            </Text>
                            <Text style={styles.driverEmail}>
                                {ride.driver.email}
                            </Text>
                        </View>
                    </View>
                </View>
            )}

            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>{ride.from} → {ride.to}</Text>
                    {ride.agencyId && (
                        <View style={styles.agencyBadge}>
                            <FontAwesome5 name="building" size={12} color="#2196F3" />
                            <Text style={styles.agencyBadgeText}>
                                {typeof ride.agencyId === 'object' && ride.agencyId.name
                                    ? ride.agencyId.name
                                    : 'Agency'}
                            </Text>
                        </View>
                    )}
                    {ride.agencyId && typeof ride.agencyId === 'object' && ride.agencyId.email && (
                        <Text style={styles.agencyEmail}>{ride.agencyId.email}</Text>
                    )}
                </View>
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
                {isBooked && !isCheckedIn && isPrivate && (
                    <TouchableOpacity
                        style={styles.finishRideButton}
                        onPress={onFinishRide}
                    >
                        <FontAwesome5 name="flag-checkered" size={16} color="white" />
                        <Text style={styles.finishRideButtonText}>Finish Ride</Text>
                    </TouchableOpacity>
                )}
                {isBooked && !isCheckedIn && !isPrivate && (
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
});

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
    titleContainer: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    agencyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#2196F3',
    },
    agencyBadgeText: {
        color: '#2196F3',
        fontSize: 11,
        fontWeight: '600',
        marginLeft: 4,
    },
    agencyEmail: {
        color: '#666',
        fontSize: 12,
        marginTop: 2,
    },
    badgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
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
    finishRideButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4CAF50',
        padding: 10,
        borderRadius: 6,
    },
    finishRideButtonText: {
        color: 'white',
        fontSize: 14,
        marginLeft: 8,
    },
    driverSection: {
        marginBottom: 12,
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 6,
        borderLeftWidth: 3,
        borderLeftColor: '#4CAF50',
    },
    driverProfile: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    driverAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    driverDetails: {
        marginLeft: 12,
        flex: 1,
    },
    driverInitials: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
    },
    driverName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 2,
    },
    driverEmail: {
        fontSize: 12,
        color: '#666',
    },
});

export default RideCard;