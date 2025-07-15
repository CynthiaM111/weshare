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

    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            {/* Status Badge */}
            <View style={styles.statusBadgeContainer}>
                {isNotStarted && (
                    <View style={styles.statusBadge}>
                        <FontAwesome5 name="clock" size={12} color="#fff" />
                        <Text style={styles.statusBadgeText}>Ready</Text>
                    </View>
                )}
                {isInProgress && (
                    <View style={[styles.statusBadge, styles.inProgressBadge]}>
                        <FontAwesome5 name="route" size={12} color="#fff" />
                        <Text style={styles.statusBadgeText}>In Progress</Text>
                    </View>
                )}
                {isCompleted && (
                    <View style={[styles.statusBadge, styles.completedBadge]}>
                        <FontAwesome5 name="check-circle" size={12} color="#fff" />
                        <Text style={styles.statusBadgeText}>Completed</Text>
                    </View>
                )}
            </View>

            {/* Route and Date */}
            <View style={styles.header}>
                <View style={styles.routeContainer}>
                    <FontAwesome5 name="route" size={16} color="#0a2472" />
                    <Text style={styles.routeText}>{ride.from} → {ride.to}</Text>
                </View>
                <View style={styles.dateContainer}>
                    <FontAwesome5 name="calendar" size={14} color="#666" />
                    <Text style={styles.dateText}>
                        {format(new Date(ride.departure_time), 'MMM dd')}
                    </Text>
                </View>
            </View>

            {/* Time and Passengers */}
            <View style={styles.details}>
                <View style={styles.detailRow}>
                    <FontAwesome5 name="clock" size={14} color="#666" />
                    <Text style={styles.detailText}>
                        {format(new Date(ride.departure_time), 'h:mm a')}
                    </Text>
                </View>
                <View style={styles.detailRow}>
                    <FontAwesome5 name="users" size={14} color="#666" />
                    <Text style={styles.detailText}>
                        {totalPassengers} passenger{totalPassengers !== 1 ? 's' : ''}
                    </Text>
                </View>
            </View>

            {/* Payment Status Bar */}
            {totalPassengers > 0 && (
                <View style={styles.paymentStatusContainer}>
                    <View style={styles.paymentBar}>
                        <View
                            style={[
                                styles.paymentProgress,
                                { width: `${paymentPercentage}%` }
                            ]}
                        />
                    </View>
                    <Text style={styles.paymentText}>
                        {paidPassengers.length}/{totalPassengers} paid ({paymentPercentage}%)
                    </Text>
                </View>
            )}

            {/* Price */}
            <View style={styles.priceContainer}>
                <Text style={styles.priceText}>RWF {ride.price}/passenger</Text>
            </View>

            {/* Ride Action Buttons */}
            {!isCompleted && (
                <View style={styles.actionButtonsContainer}>
                    {isNotStarted && onStartRide && (
                        <TouchableOpacity
                            style={styles.startButton}
                            onPress={onStartRide}
                        >
                            <View style={styles.buttonContent}>
                                <FontAwesome5 name="play" size={16} color="#fff" />
                                <Text style={styles.startButtonText}>Start Ride</Text>
                            </View>
                            <View style={styles.buttonGlow} />
                        </TouchableOpacity>
                    )}

                    {isInProgress && onFinishRide && (
                        <TouchableOpacity
                            style={styles.finishButton}
                            onPress={onFinishRide}
                        >
                            <View style={styles.buttonContent}>
                                <FontAwesome5 name="flag-checkered" size={16} color="#fff" />
                                <Text style={styles.finishButtonText}>Finish Ride</Text>
                            </View>
                            <View style={styles.buttonGlow} />
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {isCompleted && (
                <View style={styles.completedContainer}>
                    <View style={styles.completedIcon}>
                        <FontAwesome5 name="check-circle" size={20} color="#4CAF50" />
                    </View>
                    <Text style={styles.completedText}>Ride Completed</Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'transparent',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
        borderWidth: 0,
        position: 'relative',
        overflow: 'hidden',
    },
    statusBadgeContainer: {
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 10,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ff9800',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        shadowColor: '#ff9800',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    inProgressBadge: {
        backgroundColor: '#2196F3',
        shadowColor: '#2196F3',
    },
    completedBadge: {
        backgroundColor: '#4CAF50',
        shadowColor: '#4CAF50',
    },
    statusBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        marginTop: 0,
        gap: 12,
    },
    routeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        backgroundColor: 'rgba(10, 36, 114, 0.08)',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(10, 36, 114, 0.15)',
    },
    routeText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0a2472',
        marginLeft: 10,
        flex: 1,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(76, 175, 80, 0.2)',
        minWidth: 80,
    },
    dateText: {
        fontSize: 14,
        color: '#2e7d32',
        marginLeft: 6,
        fontWeight: '600',
    },
    details: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        backgroundColor: 'rgba(248, 250, 252, 0.8)',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(226, 232, 240, 0.8)',
        gap: 12,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)',
        flex: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    detailText: {
        fontSize: 14,
        color: '#374151',
        marginLeft: 8,
        fontWeight: '600',
    },
    paymentStatusContainer: {
        marginBottom: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.95)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    paymentBar: {
        height: 10,
        backgroundColor: 'rgba(224, 224, 224, 0.8)',
        borderRadius: 6,
        marginBottom: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)',
    },
    paymentProgress: {
        height: '100%',
        backgroundColor: '#4CAF50',
        borderRadius: 6,
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    paymentText: {
        fontSize: 13,
        color: '#374151',
        textAlign: 'center',
        fontWeight: '600',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(76, 175, 80, 0.2)',
        marginBottom: 16,
    },
    priceText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2e7d32',
        marginLeft: 8,
    },
    actionButtonsContainer: {
        marginTop: 8,
    },
    startButton: {
        backgroundColor: '#4CAF50',
        borderRadius: 16,
        padding: 0,
        overflow: 'hidden',
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        position: 'relative',
    },
    finishButton: {
        backgroundColor: '#f44336',
        borderRadius: 16,
        padding: 0,
        overflow: 'hidden',
        shadowColor: '#f44336',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        position: 'relative',
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        backgroundColor: 'transparent',
        zIndex: 2,
    },
    buttonGlow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 16,
    },
    startButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    finishButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    completedContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(76, 175, 80, 0.2)',
        marginTop: 8,
    },
    completedIcon: {
        marginRight: 12,
    },
    completedText: {
        color: '#4CAF50',
        fontSize: 16,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});

export default DriverRideCard; 