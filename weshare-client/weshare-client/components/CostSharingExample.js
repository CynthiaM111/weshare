import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import CostSharingBreakdown from './CostSharingBreakdown';

const CostSharingExample = () => {
    const [expandedRide, setExpandedRide] = useState(null);

    // Sample ride data for demonstration
    const sampleRides = [
        {
            _id: 'sample-ride-1',
            from: 'Kigali',
            to: 'Butare',
            seats: 4,
            booked_seats: 1,
            price: 8000,
            departure_time: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
            estimatedArrivalTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours later
            status: 'active',
            description: 'Comfortable ride to Butare with cost sharing',
            licensePlate: 'RAB 123A',
            driver: {
                name: 'John Doe',
                email: 'john.doe@example.com'
            }
        },
        {
            _id: 'sample-ride-2',
            from: 'Kigali',
            to: 'Gisenyi',
            seats: 6,
            booked_seats: 3,
            price: 12000,
            departure_time: new Date(Date.now() + 48 * 60 * 60 * 1000), // Day after tomorrow
            estimatedArrivalTime: new Date(Date.now() + 48 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3 hours later
            status: 'active',
            description: 'Van ride to Gisenyi with multiple seats available',
            licensePlate: 'RAB 456B',
            driver: {
                name: 'Jane Smith',
                email: 'jane.smith@example.com'
            }
        },
        {
            _id: 'sample-ride-3',
            from: 'Kigali',
            to: 'Musanze',
            seats: 3,
            booked_seats: 0,
            price: 6000,
            departure_time: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
            estimatedArrivalTime: new Date(Date.now() + 12 * 60 * 60 * 1000 + 1.5 * 60 * 60 * 1000), // 1.5 hours later
            status: 'active',
            description: 'Small car ride to Musanze - all seats available',
            licensePlate: 'RAB 789C',
            driver: {
                name: 'Mike Johnson',
                email: 'mike.johnson@example.com'
            }
        }
    ];

    const toggleRideExpansion = (rideId) => {
        setExpandedRide(expandedRide === rideId ? null : rideId);
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <FontAwesome5 name="calculator" size={24} color="#4CAF50" />
                <Text style={styles.headerTitle}>Cost Sharing Examples</Text>
            </View>

            <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>How Cost Sharing Works</Text>
                <Text style={styles.infoText}>
                    • Driver pays 25% of total fuel cost{'\n'}
                    • Passengers split the remaining 75% among available seats{'\n'}
                    • More passengers = lower cost per person{'\n'}
                    • Transparent and fair cost distribution
                </Text>
            </View>

            <View style={styles.examplesSection}>
                <Text style={styles.sectionTitle}>Example Rides</Text>
                <Text style={styles.sectionSubtitle}>
                    Tap on "Show Cost Breakdown" to see detailed calculations
                </Text>

                {sampleRides.map((ride) => (
                    <View key={ride._id} style={styles.rideExample}>
                        <View style={styles.rideHeader}>
                            <View style={styles.rideInfo}>
                                <Text style={styles.rideRoute}>{ride.from} → {ride.to}</Text>
                                <Text style={styles.rideDetails}>
                                    {ride.seats - ride.booked_seats} available seats • {ride.price} RWF
                                </Text>
                            </View>
                            <View style={styles.rideStatus}>
                                <FontAwesome5 name="car" size={16} color="#4CAF50" />
                            </View>
                        </View>

                        <CostSharingBreakdown
                            ride={ride}
                            isExpanded={expandedRide === ride._id}
                            onToggle={() => toggleRideExpansion(ride._id)}
                        />
                    </View>
                ))}
            </View>

            <View style={styles.benefitsSection}>
                <Text style={styles.benefitsTitle}>Benefits of Cost Sharing</Text>

                <View style={styles.benefitItem}>
                    <FontAwesome5 name="piggy-bank" size={16} color="#4CAF50" />
                    <View style={styles.benefitContent}>
                        <Text style={styles.benefitTitle}>Cost Savings</Text>
                        <Text style={styles.benefitText}>
                            Passengers save money by sharing fuel costs instead of paying full price
                        </Text>
                    </View>
                </View>

                <View style={styles.benefitItem}>
                    <FontAwesome5 name="balance-scale" size={16} color="#2196F3" />
                    <View style={styles.benefitContent}>
                        <Text style={styles.benefitTitle}>Fair Distribution</Text>
                        <Text style={styles.benefitText}>
                            Costs are distributed fairly between driver and passengers
                        </Text>
                    </View>
                </View>

                <View style={styles.benefitItem}>
                    <FontAwesome5 name="eye" size={16} color="#FF9800" />
                    <View style={styles.benefitContent}>
                        <Text style={styles.benefitTitle}>Transparency</Text>
                        <Text style={styles.benefitText}>
                            Clear breakdown of how costs are calculated and distributed
                        </Text>
                    </View>
                </View>

                <View style={styles.benefitItem}>
                    <FontAwesome5 name="users" size={16} color="#9C27B0" />
                    <View style={styles.benefitContent}>
                        <Text style={styles.benefitTitle}>Encourages Sharing</Text>
                        <Text style={styles.benefitText}>
                            More passengers mean lower individual costs for everyone
                        </Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#4CAF50',
    },
    headerTitle: {
        marginLeft: 12,
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    infoSection: {
        backgroundColor: 'white',
        margin: 16,
        padding: 16,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    examplesSection: {
        margin: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
        fontStyle: 'italic',
    },
    rideExample: {
        marginBottom: 16,
    },
    rideHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    rideInfo: {
        flex: 1,
    },
    rideRoute: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 4,
    },
    rideDetails: {
        fontSize: 14,
        color: '#666',
    },
    rideStatus: {
        marginLeft: 12,
    },
    benefitsSection: {
        backgroundColor: 'white',
        margin: 16,
        padding: 16,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    benefitsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 16,
        textAlign: 'center',
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    benefitContent: {
        flex: 1,
        marginLeft: 12,
    },
    benefitTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 4,
    },
    benefitText: {
        fontSize: 13,
        color: '#666',
        lineHeight: 18,
    },
});

export default CostSharingExample; 