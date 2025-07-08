import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import axios from 'axios';

const PricingPreview = ({
    startLocation,
    endLocation,
    seats,
    fuelEfficiency = 7.0, // Default 7L/100km
    pricePerLiter = 1700, // Default 1700 RWF/L
    onPriceCalculated,
    style = {}
}) => {
    const [pricing, setPricing] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        if (startLocation?.latitude && endLocation?.latitude && seats > 0) {
            calculatePricing();
        } else {
            setPricing(null);
            setError(null);
        }
    }, [startLocation, endLocation, seats, fuelEfficiency, pricePerLiter]);

    const calculatePricing = async () => {
        if (!startLocation?.latitude || !endLocation?.latitude || !seats) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await axios.post(
                `${process.env.EXPO_PUBLIC_API_URL}/cost/calculate/preview`,
                {
                    startLat: startLocation.latitude,
                    startLon: startLocation.longitude,
                    endLat: endLocation.latitude,
                    endLon: endLocation.longitude,
                    seats: parseInt(seats),
                    fuelEfficiency: parseFloat(fuelEfficiency),
                    pricePerLiter: parseFloat(pricePerLiter)
                }
            );

            if (response.data.success) {
                const pricingData = response.data.data;
                setPricing(pricingData);
                if (onPriceCalculated) {
                    onPriceCalculated(pricingData);
                }
            } else {
                setError('Failed to calculate pricing');
            }
        } catch (err) {
            console.error('Pricing calculation error:', err);
            setError('Unable to calculate pricing');
        } finally {
            setLoading(false);
        }
    };

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };

    if (!startLocation?.latitude || !endLocation?.latitude || !seats) {
        return null;
    }

    return (
        <View style={[styles.container, style]}>
            <TouchableOpacity
                style={styles.header}
                onPress={toggleExpanded}
                disabled={loading}
            >
                <View style={styles.headerContent}>
                    <FontAwesome5 name="calculator" size={16} color="#4CAF50" />
                    <Text style={styles.headerTitle}>Pricing Preview</Text>
                </View>
                {loading ? (
                    <ActivityIndicator size="small" color="#4CAF50" />
                ) : (
                    <FontAwesome5
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={14}
                        color="#666"
                    />
                )}
            </TouchableOpacity>

            {error && (
                <View style={styles.errorContainer}>
                    <FontAwesome5 name="exclamation-triangle" size={14} color="#f44336" />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            {pricing && !loading && !error && (
                <View style={styles.pricingContainer}>
                    {/* Route Information */}
                    <View style={styles.routeSection}>
                        <View style={styles.routeHeader}>
                            <FontAwesome5 name="route" size={14} color="#2196F3" />
                            <Text style={styles.routeTitle}>Route Details</Text>
                        </View>
                        <View style={styles.routeInfo}>
                            <Text style={styles.routeText}>
                                {startLocation.name} → {endLocation.name}
                            </Text>
                            <Text style={styles.distanceText}>
                                Distance: {pricing.distance.toFixed(1)} km
                            </Text>
                        </View>
                    </View>

                    {/* Fuel Cost Breakdown */}
                    <View style={styles.fuelSection}>
                        <View style={styles.fuelHeader}>
                            <FontAwesome5 name="gas-pump" size={14} color="#FF9800" />
                            <Text style={styles.fuelTitle}>Fuel Cost Calculation</Text>
                        </View>
                        <View style={styles.fuelBreakdown}>
                            <View style={styles.fuelRow}>
                                <Text style={styles.fuelLabel}>Distance:</Text>
                                <Text style={styles.fuelValue}>{pricing.distance.toFixed(1)} km</Text>
                            </View>
                            <View style={styles.fuelRow}>
                                <Text style={styles.fuelLabel}>Fuel Efficiency:</Text>
                                <Text style={styles.fuelValue}>{fuelEfficiency} L/100km</Text>
                            </View>
                            <View style={styles.fuelRow}>
                                <Text style={styles.fuelLabel}>Fuel Needed:</Text>
                                <Text style={styles.fuelValue}>{pricing.fuelLiters.toFixed(1)} L</Text>
                            </View>
                            <View style={styles.fuelRow}>
                                <Text style={styles.fuelLabel}>Price per Liter:</Text>
                                <Text style={styles.fuelValue}>{pricePerLiter?.toLocaleString() || '0'} RWF</Text>
                            </View>
                            <View style={[styles.fuelRow, styles.totalRow]}>
                                <Text style={styles.totalLabel}>Total Fuel Cost:</Text>
                                <Text style={styles.totalValue}>
                                    {pricing.totalFuelCost?.toLocaleString() || '0'} RWF
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Cost Sharing Breakdown */}
                    {isExpanded && (
                        <View style={styles.costSharingSection}>
                            <View style={styles.costSharingHeader}>
                                <FontAwesome5 name="users" size={14} color="#9C27B0" />
                                <Text style={styles.costSharingTitle}>Cost Sharing Breakdown</Text>
                            </View>

                            <View style={styles.sharingBreakdown}>
                                <View style={styles.sharingRow}>
                                    <Text style={styles.sharingLabel}>Driver Contribution (25%):</Text>
                                    <Text style={styles.driverAmount}>
                                        {pricing.costSharing?.driverShare?.toLocaleString() || '0'} RWF
                                    </Text>
                                </View>
                                <View style={styles.sharingRow}>
                                    <Text style={styles.sharingLabel}>Passenger Share (75%):</Text>
                                    <Text style={styles.passengerAmount}>
                                        {pricing.costSharing?.passengerShare?.toLocaleString() || '0'} RWF
                                    </Text>
                                </View>
                                <View style={styles.sharingRow}>
                                    <Text style={styles.sharingLabel}>Per Seat Cost:</Text>
                                    <Text style={styles.perSeatAmount}>
                                        {pricing.costSharing?.perPassengerCost?.toLocaleString() || '0'} RWF
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Summary */}
                    <View style={styles.summarySection}>
                        <Text style={styles.summaryTitle}>Pricing Summary</Text>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Total Fuel Cost:</Text>
                            <Text style={styles.summaryValue}>
                                {pricing.totalFuelCost?.toLocaleString() || '0'} RWF
                            </Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Driver Pays:</Text>
                            <Text style={styles.summaryValue}>
                                {pricing.costSharing?.driverShare?.toLocaleString() || '0'} RWF
                            </Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Each Passenger Pays:</Text>
                            <Text style={[styles.summaryValue, styles.highlightedValue]}>
                                {pricing.costSharing?.perPassengerCost?.toLocaleString() || '0'} RWF
                            </Text>
                        </View>
                    </View>

                    {/* Vehicle Information */}
                    <View style={styles.vehicleSection}>
                        <View style={styles.vehicleHeader}>
                            <FontAwesome5 name="car" size={14} color="#607D8B" />
                            <Text style={styles.vehicleTitle}>Vehicle Settings</Text>
                        </View>
                        <View style={styles.vehicleInfo}>
                            <Text style={styles.vehicleText}>
                                Seats: {seats} • Efficiency: {fuelEfficiency} L/100km
                            </Text>
                            <Text style={styles.vehicleText}>
                                Fuel Price: {pricePerLiter?.toLocaleString() || '0'} RWF/L
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
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#ffebee',
        borderRadius: 6,
        margin: 12,
    },
    errorText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#f44336',
    },
    pricingContainer: {
        padding: 12,
    },
    routeSection: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 6,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    routeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    routeTitle: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
        color: '#2c3e50',
    },
    routeInfo: {
        paddingLeft: 22,
    },
    routeText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 4,
    },
    distanceText: {
        fontSize: 14,
        color: '#666',
    },
    fuelSection: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 6,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    fuelHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    fuelTitle: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
        color: '#2c3e50',
    },
    fuelBreakdown: {
        paddingLeft: 22,
    },
    fuelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    fuelLabel: {
        fontSize: 13,
        color: '#666',
    },
    fuelValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#2c3e50',
    },
    totalRow: {
        borderTopWidth: 1,
        borderTopColor: '#e9ecef',
        paddingTop: 8,
        marginTop: 8,
    },
    totalLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    totalValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FF9800',
    },
    costSharingSection: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 6,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    costSharingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    costSharingTitle: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
        color: '#2c3e50',
    },
    sharingBreakdown: {
        paddingLeft: 22,
    },
    sharingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    sharingLabel: {
        fontSize: 13,
        color: '#666',
    },
    driverAmount: {
        fontSize: 13,
        fontWeight: '600',
        color: '#2196F3',
    },
    passengerAmount: {
        fontSize: 13,
        fontWeight: '600',
        color: '#9C27B0',
    },
    perSeatAmount: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    summarySection: {
        backgroundColor: '#fff3e0',
        padding: 12,
        borderRadius: 6,
        marginBottom: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#FF9800',
    },
    summaryTitle: {
        fontSize: 14,
        fontWeight: 'bold',
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
    highlightedValue: {
        color: '#4CAF50',
        fontWeight: 'bold',
    },
    vehicleSection: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    vehicleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    vehicleTitle: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
        color: '#2c3e50',
    },
    vehicleInfo: {
        paddingLeft: 22,
    },
    vehicleText: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
});

export default PricingPreview; 