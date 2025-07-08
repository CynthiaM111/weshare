import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useCostSharing } from '../hooks/useCostSharing';

const CostSharingBreakdown = ({ ride, isExpanded = false, onToggle }) => {
    const { costSharing, loading, error, refetch } = useCostSharing(
        ride._id,
        isExpanded
    );

    const handleToggle = () => {
        if (onToggle) {
            onToggle();
        }
    };

    if (!isExpanded) {
        return (
            <TouchableOpacity style={styles.collapsedContainer} onPress={handleToggle}>
                <View style={styles.collapsedHeader}>
                    <FontAwesome5 name="calculator" size={14} color="#4CAF50" />
                    <Text style={styles.collapsedText}>Show Cost Breakdown</Text>
                    <FontAwesome5 name="chevron-down" size={12} color="#666" />
                </View>
            </TouchableOpacity>
        );
    }

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.header} onPress={handleToggle}>
                <View style={styles.headerContent}>
                    <FontAwesome5 name="calculator" size={16} color="#4CAF50" />
                    <Text style={styles.headerTitle}>Cost Sharing Breakdown</Text>
                </View>
                <FontAwesome5 name="chevron-up" size={14} color="#666" />
            </TouchableOpacity>

            {loading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#4CAF50" />
                    <Text style={styles.loadingText}>Calculating cost breakdown...</Text>
                </View>
            )}

            {error && (
                <View style={styles.errorContainer}>
                    <FontAwesome5 name="exclamation-triangle" size={14} color="#f44336" />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={refetch}>
                        <FontAwesome5 name="redo" size={12} color="#f44336" />
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            )}

            {costSharing && !loading && !error && (
                <View style={styles.breakdownContainer}>
                    {/* Total Fuel Cost */}
                    <View style={styles.totalSection}>
                        <View style={styles.totalHeader}>
                            <FontAwesome5 name="gas-pump" size={16} color="#FF9800" />
                            <Text style={styles.totalTitle}>Total Fuel Cost</Text>
                        </View>
                        <Text style={styles.totalAmount}>
                            {costSharing.totalFuelCost.toLocaleString()} RWF
                        </Text>
                    </View>

                    {/* Driver Contribution */}
                    <View style={styles.contributionSection}>
                        <View style={styles.contributionHeader}>
                            <FontAwesome5 name="user-tie" size={14} color="#2196F3" />
                            <Text style={styles.contributionTitle}>Driver Contribution (25%)</Text>
                        </View>
                        <Text style={styles.driverAmount}>
                            {costSharing.driverShare.toLocaleString()} RWF
                        </Text>
                        <Text style={styles.contributionDescription}>
                            Driver pays 25% of total fuel cost
                        </Text>
                    </View>

                    {/* Passenger Contribution */}
                    <View style={styles.contributionSection}>
                        <View style={styles.contributionHeader}>
                            <FontAwesome5 name="users" size={14} color="#9C27B0" />
                            <Text style={styles.contributionTitle}>Passenger Contribution (75%)</Text>
                        </View>
                        <Text style={styles.passengerAmount}>
                            {costSharing.passengerShare.toLocaleString()} RWF
                        </Text>
                        <Text style={styles.contributionDescription}>
                            Split among {costSharing.availableSeats} available seats
                        </Text>
                    </View>

                    {/* Per Seat Breakdown */}
                    <View style={styles.perSeatSection}>
                        <View style={styles.perSeatHeader}>
                            <FontAwesome5 name="chair" size={14} color="#4CAF50" />
                            <Text style={styles.perSeatTitle}>Per Seat Cost</Text>
                        </View>

                        <View style={styles.seatBreakdown}>
                            <View style={styles.seatRow}>
                                <Text style={styles.seatLabel}>Available Seats:</Text>
                                <Text style={styles.seatValue}>{costSharing.availableSeats}</Text>
                            </View>
                            <View style={styles.seatRow}>
                                <Text style={styles.seatLabel}>Cost per Seat:</Text>
                                <Text style={styles.seatCost}>
                                    {costSharing.perPassengerCost.toLocaleString()} RWF
                                </Text>
                            </View>
                        </View>

                        {costSharing.availableSeats > 0 && (
                            <View style={styles.savingsInfo}>
                                <FontAwesome5 name="piggy-bank" size={12} color="#4CAF50" />
                                <Text style={styles.savingsText}>
                                    Each passenger saves money by sharing fuel costs
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Summary */}
                    <View style={styles.summarySection}>
                        <Text style={styles.summaryTitle}>Summary</Text>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Driver pays:</Text>
                            <Text style={styles.summaryValue}>
                                {costSharing.driverShare.toLocaleString()} RWF
                            </Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Each passenger pays:</Text>
                            <Text style={styles.summaryValue}>
                                {costSharing.perPassengerCost.toLocaleString()} RWF
                            </Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Total passenger contribution:</Text>
                            <Text style={styles.summaryValue}>
                                {costSharing.passengerShare.toLocaleString()} RWF
                            </Text>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        marginTop: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#4CAF50',
    },
    collapsedContainer: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        marginTop: 8,
        padding: 12,
        borderLeftWidth: 3,
        borderLeftColor: '#4CAF50',
    },
    collapsedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    collapsedText: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
        color: '#2c3e50',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerTitle: {
        marginLeft: 8,
        fontSize: 16,
        fontWeight: '600',
        color: '#2c3e50',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        justifyContent: 'center',
    },
    loadingText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#666',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#ffebee',
        borderRadius: 6,
        margin: 12,
    },
    errorText: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        color: '#f44336',
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#f44336',
        marginLeft: 8,
    },
    retryText: {
        marginLeft: 4,
        fontSize: 12,
        color: '#f44336',
        fontWeight: '600',
    },
    breakdownContainer: {
        padding: 12,
    },
    totalSection: {
        backgroundColor: '#fff3e0',
        padding: 12,
        borderRadius: 6,
        marginBottom: 12,
        borderLeftWidth: 3,
        borderLeftColor: '#FF9800',
    },
    totalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    totalTitle: {
        marginLeft: 8,
        fontSize: 16,
        fontWeight: '600',
        color: '#2c3e50',
    },
    totalAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FF9800',
        textAlign: 'center',
        marginTop: 4,
    },
    contributionSection: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 6,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    contributionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    contributionTitle: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
        color: '#2c3e50',
    },
    driverAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2196F3',
        marginTop: 4,
    },
    passengerAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#9C27B0',
        marginTop: 4,
    },
    contributionDescription: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
        fontStyle: 'italic',
    },
    perSeatSection: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 6,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    perSeatHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    perSeatTitle: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
        color: '#2c3e50',
    },
    seatBreakdown: {
        marginBottom: 8,
    },
    seatRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    seatLabel: {
        fontSize: 13,
        color: '#666',
    },
    seatValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#2c3e50',
    },
    seatCost: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    savingsInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e8f5e8',
        padding: 8,
        borderRadius: 4,
    },
    savingsText: {
        marginLeft: 6,
        fontSize: 12,
        color: '#4CAF50',
        fontStyle: 'italic',
    },
    summarySection: {
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#dee2e6',
    },
    summaryTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 8,
        textAlign: 'center',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    summaryLabel: {
        fontSize: 13,
        color: '#666',
    },
    summaryValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#2c3e50',
    },
});

export default CostSharingBreakdown; 