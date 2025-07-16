import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { format } from 'date-fns';

const DriverRideCard = ({
    ride,
    onPress,
    onStartRide,
    onFinishRide
}) => {
    const totalPassengers = ride.bookedBy?.length || 0;
    const paidPassengers = ride.bookedBy?.filter(passenger => passenger.paymentStatus === 'paid') || [];
    const paymentPercentage = totalPassengers > 0 ? Math.round((paidPassengers.length / totalPassengers) * 100) : 0;

    // Determine ride status and button visibility
    const isNotStarted = ride.rideStatus === 'not_started' || !ride.rideStatus;
    const isInProgress = ride.rideStatus === 'in_progress';
    const isCompleted = ride.rideStatus === 'completed';

    const getStatusColor = () => {
        if (isCompleted) return '#10B981';
        if (isInProgress) return '#3B82F6';
        return '#F59E0B';
    };

    const getStatusText = () => {
        if (isCompleted) return 'Completed';
        if (isInProgress) return 'In Progress';
        return 'Ready';
    };

    const getStatusIcon = () => {
        if (isCompleted) return 'check-circle';
        if (isInProgress) return 'route';
        return 'clock';
    };

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.95}>
            {/* Header with Route and Status */}
            <View style={styles.header}>
                <View style={styles.routeInfo}>
                    <View style={styles.routeContainer}>
                        <FontAwesome5 name="map-marker-alt" size={14} color="#6B7280" />
                        <Text style={styles.routeText} numberOfLines={1}>
                            {ride.from} → {ride.to}
                        </Text>
                    </View>
                    <View style={styles.dateTimeContainer}>
                        <FontAwesome5 name="calendar-alt" size={12} color="#6B7280" />
                        <Text style={styles.dateTimeText}>
                            {format(new Date(ride.departure_time), 'MMM dd • h:mm a')}
                        </Text>
                    </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
                    <FontAwesome5 name={getStatusIcon()} size={10} color="#fff" />
                    <Text style={styles.statusText}>{getStatusText()}</Text>
                </View>
            </View>

            {/* Key Details Row */}
            <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                    <FontAwesome5 name="users" size={12} color="#6B7280" />
                    <Text style={styles.detailText}>
                        {totalPassengers} passenger{totalPassengers !== 1 ? 's' : ''}
                    </Text>
                </View>
                <View style={styles.detailDivider} />
                <View style={styles.detailItem}>
                    <FontAwesome5 name="money-bill-wave" size={12} color="#6B7280" />
                    <Text style={styles.detailText}>RWF {ride.price}</Text>
                </View>
                <View style={styles.detailDivider} />
                <View style={styles.detailItem}>
                    <FontAwesome5 name="car" size={12} color="#6B7280" />
                    <Text style={styles.detailText}>
                        {ride.seats - totalPassengers} seats left
                    </Text>
                </View>
            </View>

            {/* Payment Progress (only show if there are passengers) */}
            {totalPassengers > 0 && (
                <View style={styles.paymentSection}>
                    <View style={styles.paymentHeader}>
                        <Text style={styles.paymentLabel}>Payment Status</Text>
                        <Text style={styles.paymentPercentage}>{paymentPercentage}%</Text>
                    </View>
                    <View style={styles.progressBar}>
                        <View
                            style={[
                                styles.progressFill,
                                {
                                    width: `${paymentPercentage}%`,
                                    backgroundColor: paymentPercentage === 100 ? '#10B981' : '#3B82F6'
                                }
                            ]}
                        />
                    </View>
                    <Text style={styles.paymentDetails}>
                        {paidPassengers.length} of {totalPassengers} passengers paid
                    </Text>
                </View>
            )}

            {/* Action Buttons */}
            {!isCompleted && (
                <View style={styles.actionSection}>
                    {isNotStarted && onStartRide && (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.startButton]}
                            onPress={onStartRide}
                        >
                            <FontAwesome5 name="play" size={14} color="#fff" />
                            <Text style={styles.actionButtonText}>Start Ride</Text>
                        </TouchableOpacity>
                    )}

                    {isInProgress && onFinishRide && (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.finishButton]}
                            onPress={onFinishRide}
                        >
                            <FontAwesome5 name="flag-checkered" size={14} color="#fff" />
                            <Text style={styles.actionButtonText}>Finish Ride</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Completed State */}
            {isCompleted && (
                <View style={styles.completedSection}>
                    <FontAwesome5 name="check-circle" size={16} color="#10B981" />
                    <Text style={styles.completedText}>Ride completed successfully</Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        paddingRight: 48, // Make space for options button
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    routeInfo: {
        flex: 1,
        marginRight: 8, // Reduced from 12 to 8 to give more space for status badge
    },
    routeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    routeText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginLeft: 6,
        flex: 1,
    },
    dateTimeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateTimeText: {
        fontSize: 13,
        color: '#6B7280',
        marginLeft: 4,
        fontWeight: '500',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        minWidth: 70,
        justifyContent: 'center',
        marginRight: 8, // Add some margin to avoid overlap with options button
    },
    statusText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        paddingHorizontal: 8,
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        paddingVertical: 10,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        minWidth: 0, // Allow text to wrap if needed
    },
    detailDivider: {
        width: 1,
        height: 20,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 4,
    },
    detailText: {
        fontSize: 13,
        color: '#374151',
        marginLeft: 6,
        fontWeight: '500',
        textAlign: 'center',
        flexShrink: 1, // Allow text to shrink if needed
    },
    paymentSection: {
        marginBottom: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    paymentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    paymentLabel: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    paymentPercentage: {
        fontSize: 13,
        color: '#1F2937',
        fontWeight: '600',
    },
    progressBar: {
        height: 6,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
        marginBottom: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    paymentDetails: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'center',
    },
    actionSection: {
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    startButton: {
        backgroundColor: '#10B981',
    },
    finishButton: {
        backgroundColor: '#EF4444',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    completedSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    completedText: {
        color: '#10B981',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
});

export default DriverRideCard; 