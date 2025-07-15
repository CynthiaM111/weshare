import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { format } from 'date-fns';

const DriverRideCard = ({
    ride,
    onPress
}) => {
    const totalPassengers = ride.bookedBy?.length || 0;
    const paidPassengers = ride.bookedBy?.filter(passenger => passenger.paymentStatus === 'paid') || [];
    const paymentPercentage = totalPassengers > 0 ? Math.round((paidPassengers.length / totalPassengers) * 100) : 0;

    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
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
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        flex: 1,
        backgroundColor: 'transparent',
        padding: 0,
        marginBottom: 0,
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    routeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        backgroundColor: 'rgba(10, 36, 114, 0.08)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(10, 36, 114, 0.15)',
    },
    routeText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0a2472',
        marginLeft: 8,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(76, 175, 80, 0.2)',
        minWidth: 80,
    },
    dateText: {
        fontSize: 14,
        color: '#2e7d32',
        marginLeft: 4,
        fontWeight: '600',
    },
    details: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.8)',
        gap: 12,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)',
        flex: 1,
    },
    detailText: {
        fontSize: 14,
        color: '#374151',
        marginLeft: 6,
        fontWeight: '500',
    },
    paymentStatusContainer: {
        marginBottom: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.9)',
    },
    paymentBar: {
        height: 8,
        backgroundColor: 'rgba(224, 224, 224, 0.8)',
        borderRadius: 4,
        marginBottom: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)',
    },
    paymentProgress: {
        height: '100%',
        backgroundColor: '#4CAF50',
        borderRadius: 4,
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
    },
    paymentText: {
        fontSize: 12,
        color: '#374151',
        textAlign: 'center',
        fontWeight: '600',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(76, 175, 80, 0.2)',
    },
    priceText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2e7d32',
        marginLeft: 6,
    },
});

export default DriverRideCard; 