// app/(rides)/[id].js
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import ErrorDisplay from '../../components/ErrorDisplay';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';

export default function RideDetails() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();

    const {
        data: ride,
        error: rideError,
        isLoading: isLoadingRide,
        execute: fetchRideDetails,
        retry: retryFetchRide
    } = useApi(async () => {
        const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/rides/${id}`);
        return response.data;
    });

    const {
        error: bookingError,
        isLoading: isBooking,
        execute: bookRide,
        retry: retryBooking
    } = useApi(async () => {
        const response = await axios.post(
            `${process.env.EXPO_PUBLIC_API_URL}/rides/${id}/book`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${user.token}`
                }
            }
        );
        return response.data;
    });

    useEffect(() => {
        if (id === 'employee') {
            router.replace('/(rides)/employee');
            return;
        }

        const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);
        if (!id || !isValidObjectId(id)) {
            router.replace('/(rides)');
            return;
        }

        fetchRideDetails();
    }, [id, router]);

    const handleBookRide = async () => {
        try {
            await bookRide();
            fetchRideDetails();
            router.replace('/(rides)/booked');
        } catch (error) {
            // Error is already handled by useApi
            console.error('Booking error:', error);
        }
    };

    if (isLoadingRide) {
        return (
            <LinearGradient
                colors={['#0a2472', '#1E90FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.backgroundGradient}
            >
                <SafeAreaView style={styles.container}>
                    <View style={styles.loadingContainer}>
                        <FontAwesome5 name="spinner" size={32} color="#fff" />
                        <Text style={styles.loadingText}>Loading ride details...</Text>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    if (rideError) {
        return (
            <LinearGradient
                colors={['#0a2472', '#1E90FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.backgroundGradient}
            >
                <SafeAreaView style={styles.container}>
                    <ErrorDisplay
                        error={rideError}
                        onRetry={retryFetchRide}
                        title="Error Loading Ride"
                        message="We couldn't load the ride details at this time."
                    />
                </SafeAreaView>
            </LinearGradient>
        );
    }

    if (bookingError) {
        return (
            <LinearGradient
                colors={['#0a2472', '#1E90FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.backgroundGradient}
            >
                <SafeAreaView style={styles.container}>
                    <ErrorDisplay
                        error={bookingError}
                        onRetry={retryBooking}
                        title="Booking Failed"
                        message="We couldn't book your ride at this time."
                    />
                </SafeAreaView>
            </LinearGradient>
        );
    }

    if (!ride) {
        return null;
    }

    // Determine status color
    const statusColor = ride.statusDisplay === 'Full' ? '#FF0000' :
        ride.statusDisplay === 'Nearly Full' ? '#FFA500' : '#008000';

    return (
        <LinearGradient
            colors={['#0a2472', '#1E90FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.backgroundGradient}
        >
            <SafeAreaView style={styles.container}>
                {/* Custom Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <FontAwesome5 name="arrow-left" size={20} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Ride Details</Text>
                    <View style={styles.headerPlaceholder} />
                </View>

                <View style={styles.content}>
                    <View style={styles.card}>
                        {/* Route Header */}
                        <View style={styles.routeHeader}>
                            <View style={styles.routeContainer}>
                                <Ionicons name="location" size={24} color="#0a2472" />
                                <Text style={styles.routeFrom}>{ride.from}</Text>
                            </View>
                            <FontAwesome5 name="arrow-right" size={20} color="#6c757d" style={styles.routeArrow} />
                            <View style={styles.routeContainer}>
                                <Ionicons name="location" size={24} color="#0a2472" />
                                <Text style={styles.routeTo}>{ride.to}</Text>
                            </View>
                        </View>

                        {/* Status Badge */}
                        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                            <Text style={styles.statusText}>{ride.statusDisplay}</Text>
                        </View>

                        {/* Details Grid */}
                        <View style={styles.detailsGrid}>
                            <View style={styles.detailCard}>
                                <View style={styles.detailIcon}>
                                    <FontAwesome5 name="calendar-alt" size={16} color="#2196F3" />
                                </View>
                                <Text style={styles.detailLabel}>Departure</Text>
                                <Text style={styles.detailValue}>
                                    {format(new Date(ride.departure_time), 'MMM dd, yyyy')}
                                </Text>
                                <Text style={styles.detailTime}>
                                    {format(new Date(ride.departure_time), 'h:mm a')}
                                </Text>
                            </View>

                            <View style={styles.detailCard}>
                                <View style={styles.detailIcon}>
                                    <FontAwesome5 name="clock" size={16} color="#FF9800" />
                                </View>
                                <Text style={styles.detailLabel}>Est. Arrival</Text>
                                <Text style={styles.detailValue}>
                                    {format(new Date(ride.estimatedArrivalTime), 'MMM dd, yyyy')}
                                </Text>
                                <Text style={styles.detailTime}>
                                    {format(new Date(ride.estimatedArrivalTime), 'h:mm a')}
                                </Text>
                            </View>

                            <View style={styles.detailCard}>
                                <View style={styles.detailIcon}>
                                    <FontAwesome5 name="users" size={16} color="#9C27B0" />
                                </View>
                                <Text style={styles.detailLabel}>Available Seats</Text>
                                <Text style={styles.detailValue}>
                                    {ride.available_seats} / {ride.seats}
                                </Text>
                                <Text style={styles.detailSubtext}>
                                    {ride.booked_seats} booked
                                </Text>
                            </View>

                            <View style={styles.detailCard}>
                                <View style={styles.detailIcon}>
                                    <FontAwesome5 name="dollar-sign" size={16} color="#4CAF50" />
                                </View>
                                <Text style={styles.detailLabel}>Price</Text>
                                <Text style={[styles.detailValue, styles.priceText]}>${ride.price}</Text>
                                <Text style={styles.detailSubtext}>per seat</Text>
                            </View>
                        </View>

                        {/* Agency Info */}
                        <View style={styles.agencyCard}>
                            <FontAwesome5 name="building" size={16} color="#6c757d" />
                            <Text style={styles.agencyLabel}>Operated by</Text>
                            <Text style={styles.agencyName}>{ride.agencyId?.name || 'Unknown Agency'}</Text>
                        </View>
                    </View>

                    {/* Booking Button */}
                    <TouchableOpacity
                        style={[
                            styles.bookButton,
                            (isBooking || ride.statusDisplay === 'Full') && styles.bookButtonDisabled
                        ]}
                        onPress={handleBookRide}
                        disabled={isBooking || ride.statusDisplay === 'Full'}
                    >
                        <FontAwesome5
                            name={isBooking ? "spinner" : ride.statusDisplay === 'Full' ? "ban" : "ticket-alt"}
                            size={16}
                            color="#fff"
                            style={styles.buttonIcon}
                        />
                        <Text style={styles.bookButtonText}>
                            {isBooking ? 'Booking...' :
                                ride.statusDisplay === 'Full' ? 'Ride Full' :
                                    'Book This Ride'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    backgroundGradient: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: 'rgba(10, 36, 114, 0.8)',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
        textAlign: 'center',
    },
    headerPlaceholder: {
        width: 32,
        height: 32,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: 20,
        borderRadius: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    routeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    routeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    routeFrom: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 8,
        color: '#0a2472',
        flex: 1,
        textAlign: 'center',
    },
    routeArrow: {
        marginHorizontal: 16,
    },
    routeTo: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 8,
        color: '#0a2472',
        flex: 1,
        textAlign: 'center',
    },
    statusBadge: {
        alignSelf: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 20,
    },
    statusText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    detailsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    detailCard: {
        width: '48%',
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    detailIcon: {
        marginBottom: 8,
    },
    detailLabel: {
        fontSize: 12,
        color: '#6c757d',
        marginBottom: 4,
        textAlign: 'center',
    },
    detailValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0a2472',
        textAlign: 'center',
        marginBottom: 2,
    },
    detailTime: {
        fontSize: 14,
        color: '#0a2472',
        fontWeight: '600',
        textAlign: 'center',
    },
    detailSubtext: {
        fontSize: 12,
        color: '#6c757d',
        textAlign: 'center',
    },
    priceText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    agencyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 12,
        justifyContent: 'center',
    },
    agencyLabel: {
        fontSize: 14,
        color: '#6c757d',
        marginLeft: 8,
        marginRight: 8,
    },
    agencyName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0a2472',
    },
    bookButton: {
        flexDirection: 'row',
        backgroundColor: '#2196F3',
        padding: 16,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    bookButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    bookButtonDisabled: {
        backgroundColor: '#ccc',
        opacity: 0.7,
    },
    buttonIcon: {
        marginRight: 8,
    },
});