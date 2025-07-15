import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import CostSharingBreakdown from './CostSharingBreakdown';

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
    showDriverInfo
}) => {
    const [showCostBreakdown, setShowCostBreakdown] = useState(false);

    // Ensure we have valid numbers for calculations
    const totalSeats = parseInt(ride.seats) || 1;
    const bookedSeats = parseInt(ride.booked_seats) || 0;
    const ridePrice = parseFloat(ride.price) || parseFloat(ride.calculatedPrice) || 0;

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

    const toggleCostBreakdown = () => {
        setShowCostBreakdown(!showCostBreakdown);
    };

    // Get location names for display
    const getLocationName = (location) => {
        if (typeof location === 'string') {
            return location;
        }
        if (location?.name) {
            return location.name;
        }
        if (location?.latitude && location?.longitude) {
            return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
        }
        return 'Unknown Location';
    };

    const fromLocation = getLocationName(ride.startLocation || ride.from);
    const toLocation = getLocationName(ride.endLocation || ride.to);

    return (
        <View style={styles.cardContainer}>
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
                                {ride.driver.photoUrl ? (
                                    <Image
                                        source={{ uri: ride.driver.photoUrl }}
                                        style={styles.driverAvatarImage}
                                    />
                                ) : (
                                    <Text style={styles.driverInitials}>
                                        {getDriverInitials(ride.driver.name || ride.driver.email)}
                                    </Text>
                                )}
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
                        <Text style={styles.title}>{fromLocation} → {toLocation}</Text>
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
                            {ridePrice.toLocaleString()} RWF
                        </Text>
                        {ride.calculatedPrice && (
                            <Text style={styles.calculatedPriceText}>per seat (calculated)</Text>
                        )}
                    </View>
                </View>

                {/* GPS Coordinates Info for Private Rides */}
                {isPrivate && (ride.startLocation || ride.endLocation) && (
                    <View style={styles.gpsSection}>
                        <View style={styles.gpsSectionHeader}>
                            <FontAwesome5 name="map-marker-alt" size={16} color="#607D8B" />
                            <Text style={styles.gpsSectionTitle}>GPS Coordinates</Text>
                        </View>
                        {ride.startLocation && (
                            <View style={styles.coordinateRow}>
                                <Text style={styles.coordinateLabel}>From:</Text>
                                <Text style={styles.coordinateValue}>
                                    {ride.startLocation.latitude?.toFixed(4)}, {ride.startLocation.longitude?.toFixed(4)}
                                </Text>
                            </View>
                        )}
                        {ride.endLocation && (
                            <View style={styles.coordinateRow}>
                                <Text style={styles.coordinateLabel}>To:</Text>
                                <Text style={styles.coordinateValue}>
                                    {ride.endLocation.latitude?.toFixed(4)}, {ride.endLocation.longitude?.toFixed(4)}
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Vehicle Information */}
                {ride.licensePlate && (
                    <View style={styles.vehicleSection}>
                        <View style={styles.vehicleSectionHeader}>
                            <FontAwesome5 name="car" size={16} color="#607D8B" />
                            <Text style={styles.vehicleSectionTitle}>Vehicle</Text>
                        </View>
                        <View style={styles.licensePlateContainer}>
                            <Text style={styles.licensePlateText}>{ride.licensePlate}</Text>
                        </View>
                        {/* Show fuel efficiency if available */}
                        {ride.fuelEfficiency && (
                            <Text style={styles.fuelInfo}>
                                Fuel Efficiency: {ride.fuelEfficiency} L/100km
                            </Text>
                        )}
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

            {/* Cost Sharing Breakdown for Private Rides */}
            {isPrivate && (
                <CostSharingBreakdown
                    ride={ride}
                    isExpanded={showCostBreakdown}
                    onToggle={toggleCostBreakdown}
                />
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    cardContainer: {
        marginBottom: 12,
    },
    card: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 8,
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
    calculatedPriceText: {
        fontSize: 10,
        color: '#666',
        fontStyle: 'italic',
        textAlign: 'right',
        marginTop: 2,
    },
    gpsSection: {
        marginBottom: 12,
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 6,
        borderLeftWidth: 3,
        borderLeftColor: '#607D8B',
    },
    gpsSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    gpsSectionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#2c3e50',
        marginLeft: 8,
    },
    coordinateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
        paddingLeft: 24,
    },
    coordinateLabel: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    coordinateValue: {
        fontSize: 12,
        color: '#2c3e50',
        fontFamily: 'monospace',
        fontWeight: '600',
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
        marginBottom: 4,
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
    fuelInfo: {
        fontSize: 12,
        color: '#666',
        paddingLeft: 24,
        fontStyle: 'italic',
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
    driverAvatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
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