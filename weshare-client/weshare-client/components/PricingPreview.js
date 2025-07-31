import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../app/context/AuthContext';
import { useTranslation } from 'react-i18next';

const PricingPreview = ({
    startLocation,
    endLocation,
    seats,
    fuelEfficiency,
    pricePerLiter,
    onPriceCalculated,
    style = {}
}) => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [systemFuelPrice, setSystemFuelPrice] = useState(null);
    const [pricing, setPricing] = useState(null);
    const [error, setError] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [systemSettings, setSystemSettings] = useState(null);

    // Fetch system fuel price on component mount
    useEffect(() => {
        fetchSystemFuelPrice();
    }, []);

    const fetchSystemFuelPrice = async () => {
        try {
            const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/system/settings`);
            setSystemFuelPrice(response.data.settings.fuelPricePerLiter);
            setSystemSettings(response.data.settings);
        } catch (error) {
            console.error('Failed to fetch system fuel price:', error);
            // Use default if fetch fails
            setSystemFuelPrice(1700);
            setSystemSettings({
                fuelPricePerLiter: 1700,
                fuelEfficiencyMin: 6.0,
                fuelEfficiencyMax: 10.0
            });
        }
    };

    // Check if fuel efficiency is valid
    const isFuelEfficiencyValid = () => {
        if (!systemSettings || !fuelEfficiency) return true;
        const numFuelEfficiency = parseFloat(fuelEfficiency);
        return !isNaN(numFuelEfficiency) &&
            numFuelEfficiency >= systemSettings.fuelEfficiencyMin &&
            numFuelEfficiency <= systemSettings.fuelEfficiencyMax;
    };

    // Use system fuel price if available, otherwise fall back to provided price
    const effectiveFuelPrice = systemFuelPrice || pricePerLiter;

    useEffect(() => {
        if (startLocation?.latitude && endLocation?.latitude && seats > 0 && isFuelEfficiencyValid()) {
            calculatePricing();
        } else {
            setPricing(null);
            setError(null);
        }
    }, [startLocation, endLocation, seats, fuelEfficiency, effectiveFuelPrice]);

    const calculatePricing = async () => {
        if (!startLocation?.latitude || !endLocation?.latitude || !seats) {
            return;
        }

        setLoading(true);
        setError(null);

        const requestData = {
            startLat: startLocation.latitude,
            startLon: startLocation.longitude,
            endLat: endLocation.latitude,
            endLon: endLocation.longitude,
            seats: parseInt(seats),
            fuelEfficiency: parseFloat(fuelEfficiency)
        };

        console.log('Sending pricing calculation request:', requestData);

        try {
            const response = await axios.post(
                `${process.env.EXPO_PUBLIC_API_URL}/cost/calculate/preview`,
                requestData
            );

            console.log('Pricing calculation response:', response.data);

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
            if (err.response) {
                console.error('Error response:', err.response.data);

                // Handle specific validation errors
                if (err.response.status === 400) {
                    const errorMessage = err.response.data.error;
                    if (errorMessage.includes('fuel efficiency')) {
                        setError(t('validation.fuelEfficiencyRange', {
                            min: systemSettings?.fuelEfficiencyMin || 6,
                            max: systemSettings?.fuelEfficiencyMax || 10
                        }));
                    } else if (errorMessage.includes('Missing required parameters')) {
                        setError(t('validation.missingInformation'));
                    } else {
                        setError(errorMessage);
                    }
                } else if (err.response.status === 500) {
                    setError(t('common.error'));
                } else {
                    setError(t('validation.missingInformation'));
                }
            } else if (err.request) {
                setError(t('common.error'));
            } else {
                setError(t('common.error'));
            }
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
                    <Text style={styles.headerTitle}>{t('rideForm.pricingPreview')}</Text>
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

            {!isFuelEfficiencyValid() && !error && (
                <View style={styles.warningContainer}>
                    <FontAwesome5 name="exclamation-triangle" size={14} color="#ff9800" />
                    <Text style={styles.warningText}>
                        {t('validation.fuelEfficiencyRange', {
                            min: systemSettings?.fuelEfficiencyMin || 6,
                            max: systemSettings?.fuelEfficiencyMax || 10
                        })} ({fuelEfficiency} L/100km)
                    </Text>
                </View>
            )}

            {pricing && !loading && !error && (
                <View style={styles.pricingContainer}>
                    {/* Route Information */}
                    <View style={styles.routeSection}>
                        <View style={styles.routeHeader}>
                            <FontAwesome5 name="route" size={14} color="#2196F3" />
                            <Text style={styles.routeTitle}>{t('pricing.routeDetails')}</Text>
                        </View>
                        <View style={styles.routeInfo}>
                            <Text style={styles.routeText}>
                                {startLocation.name} → {endLocation.name}
                            </Text>
                            <Text style={styles.distanceText}>
                                {t('pricing.distance')}: {pricing.distance.toFixed(1)} km
                            </Text>
                        </View>
                    </View>

                    {/* Fuel Cost Breakdown */}
                    <View style={styles.fuelSection}>
                        <View style={styles.fuelHeader}>
                            <FontAwesome5 name="gas-pump" size={14} color="#FF9800" />
                            <Text style={styles.fuelTitle}>{t('pricing.fuelCostCalculation')}</Text>
                        </View>
                        <View style={styles.fuelBreakdown}>
                            <View style={styles.fuelRow}>
                                <Text style={styles.fuelLabel}>{t('pricing.distance')}:</Text>
                                <Text style={styles.fuelValue}>{pricing.distance.toFixed(1)} km</Text>
                            </View>
                            <View style={styles.fuelRow}>
                                <Text style={styles.fuelLabel}>{t('pricing.efficiency')}:</Text>
                                <Text style={styles.fuelValue}>{fuelEfficiency} L/100km</Text>
                            </View>
                            <View style={styles.fuelRow}>
                                <Text style={styles.fuelLabel}>{t('pricing.fuelNeeded')}:</Text>
                                <Text style={styles.fuelValue}>{pricing.fuelLiters.toFixed(1)} L</Text>
                            </View>
                            <View style={styles.fuelRow}>
                                <Text style={styles.fuelLabel}>{t('pricing.pricePerLiter')}:</Text>
                                <Text style={styles.fuelValue}>{effectiveFuelPrice?.toLocaleString() || '0'} RWF</Text>
                            </View>
                            <View style={[styles.fuelRow, styles.totalRow]}>
                                <Text style={styles.totalLabel}>{t('pricing.totalFuelCost')}:</Text>
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
                                <Text style={styles.costSharingTitle}>{t('pricing.costSharingBreakdown')}</Text>
                            </View>

                            <View style={styles.sharingBreakdown}>
                                <View style={styles.sharingRow}>
                                    <Text style={styles.sharingLabel}>{t('pricing.driverContribution')}:</Text>
                                    <Text style={styles.driverAmount}>
                                        {pricing.costSharing?.driverShare?.toLocaleString() || '0'} RWF
                                    </Text>
                                </View>
                                <View style={styles.sharingRow}>
                                    <Text style={styles.sharingLabel}>{t('pricing.passengerShare')}:</Text>
                                    <Text style={styles.passengerAmount}>
                                        {pricing.costSharing?.passengerShare?.toLocaleString() || '0'} RWF
                                    </Text>
                                </View>
                                <View style={styles.sharingRow}>
                                    <Text style={styles.sharingLabel}>{t('pricing.perSeatCost')}:</Text>
                                    <Text style={styles.perSeatAmount}>
                                        {pricing.costSharing?.perPassengerCost?.toLocaleString() || '0'} RWF
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Summary */}
                    <View style={styles.summarySection}>
                        <Text style={styles.summaryTitle}>{t('pricing.pricingSummary')}</Text>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>{t('pricing.totalFuelCost')}:</Text>
                            <Text style={styles.summaryValue}>
                                {pricing.totalFuelCost?.toLocaleString() || '0'} RWF
                            </Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>{t('pricing.driverPays')}:</Text>
                            <Text style={styles.summaryValue}>
                                {pricing.costSharing?.driverShare?.toLocaleString() || '0'} RWF
                            </Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>{t('pricing.eachPassengerPays')}:</Text>
                            <Text style={[styles.summaryValue, styles.highlightedValue]}>
                                {pricing.costSharing?.perPassengerCost?.toLocaleString() || '0'} RWF
                            </Text>
                        </View>
                    </View>

                    {/* Vehicle Information */}
                    <View style={styles.vehicleSection}>
                        <View style={styles.vehicleHeader}>
                            <FontAwesome5 name="car" size={14} color="#607D8B" />
                            <Text style={styles.vehicleTitle}>{t('pricing.vehicleSettings')}</Text>
                        </View>
                        <View style={styles.vehicleInfo}>
                            <Text style={styles.vehicleText}>
                                {t('pricing.seats')}: {seats} • {t('pricing.efficiency')}: {fuelEfficiency} L/100km
                            </Text>
                            <Text style={styles.vehicleText}>
                                {t('pricing.fuelPrice')}: {pricePerLiter?.toLocaleString() || '0'} RWF/L
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
    warningContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#fffbe6',
        borderRadius: 6,
        margin: 12,
        borderLeftWidth: 3,
        borderLeftColor: '#ff9800',
    },
    warningText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#ff9800',
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