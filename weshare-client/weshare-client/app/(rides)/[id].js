// app/(rides)/[id].js
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../../hooks/useApi';
// import ErrorDisplay from '../../components/ErrorDisplay';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import DriverContactModal from '../../components/DriverContactModal';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/LanguageSwitcher';

export default function RideDetails() {
    const { t } = useTranslation();

    // Function to translate status
    const translateStatus = (status) => {
        switch (status) {
            case 'Available':
                return t('common.status.available');
            case 'Nearly Full':
                return t('common.status.nearlyFull');
            case 'Full':
                return t('common.status.full');
            case 'Inactive':
                return t('common.status.inactive');
            case 'Completed':
                return t('common.status.completed');
            case 'Pending':
                return t('common.status.pending');
            default:
                return status;
        }
    };

    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const [showDriverModal, setShowDriverModal] = useState(false);

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
                    Authorization: `Bearer ${user?.token}`
                }
            }
        );
        return response.data;
    });

    // All useEffect hooks must be called before any conditional returns
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

    useEffect(() => {
        if (rideError) {
            Alert.alert(t('rideDetails.errors.loadingRide'), rideError.userMessage || t('rideDetails.errors.loadingRideMessage'), [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('common.retry'), onPress: retryFetchRide }
            ]);
        }
    }, [rideError, t]);

    useEffect(() => {
        if (bookingError) {
            Alert.alert(t('rideDetails.errors.bookingRide'), bookingError.userMessage || t('rideDetails.errors.bookingRideMessage'), [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('common.retry'), onPress: retryBooking }
            ]);
        }
    }, [bookingError, t]);

    const handleBookRide = async () => {
        // Check if user is authenticated
        if (!user) {
            Alert.alert(
                t('rideDetails.errors.loginRequired'),
                t('rideDetails.errors.loginRequiredMessage'),
                [
                    {
                        text: t('common.cancel'),
                        style: 'cancel'
                    },
                    {
                        text: t('auth.login'),
                        style: 'default',
                        onPress: () => router.push('/(auth)/login')
                    }
                ]
            );
            return;
        }

        // For private rides, show driver contact modal
        if (ride && ride.isPrivate) {
            setShowDriverModal(true);
        } else {
            // For public rides, book directly
            await bookRide();
            fetchRideDetails();
            router.replace('/(rides)/booked');
        }
    };

    const handlePaymentConfirmed = async () => {
        try {
            // Close driver modal
            setShowDriverModal(false);

            // Now proceed with booking after user confirms payment
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
                        <Text style={styles.loadingText}>{t('rideDetails.loading.text')}</Text>
                    </View>
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
                    <Text style={styles.headerTitle}>{t('rideDetails.header.title')}</Text>
                    <View style={styles.headerPlaceholder}>
                        <LanguageSwitcher style={styles.languageSwitcher} compact={true} />
                    </View>
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
                            <Text style={styles.statusText}>{translateStatus(ride.statusDisplay)}</Text>
                        </View>

                        {/* Details Grid */}
                        <View style={styles.detailsGrid}>
                            <View style={styles.detailCard}>
                                <View style={styles.detailIcon}>
                                    <FontAwesome5 name="calendar-alt" size={16} color="#2196F3" />
                                </View>
                                <Text style={styles.detailLabel}>{t('rideDetails.details.departure')}</Text>
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
                                <Text style={styles.detailLabel}>{t('rideDetails.details.estimatedArrival')}</Text>
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
                                <Text style={styles.detailLabel}>{t('rideDetails.details.availableSeats')}</Text>
                                <Text style={styles.detailValue}>
                                    {ride.available_seats} / {ride.seats}
                                </Text>
                                <Text style={styles.detailSubtext}>
                                    {ride.booked_seats} {t('rideDetails.details.booked')}
                                </Text>
                            </View>

                            <View style={styles.detailCard}>
                                <View style={styles.detailIcon}>
                                    <FontAwesome5 name="money-bill-wave" size={16} color="#4CAF50" />
                                </View>
                                <Text style={styles.detailLabel}>{t('rideDetails.details.price')}</Text>
                                <Text style={[styles.detailValue, styles.priceText]}>{ride.price} RWF</Text>
                                <Text style={styles.detailSubtext}>{t('rideDetails.details.perSeat')}</Text>
                            </View>
                        </View>

                        {/* Agency Info */}
                        <View style={styles.agencyCard}>
                            <FontAwesome5
                                name={ride.isPrivate ? "user" : "building"}
                                size={16}
                                color="#6c757d"
                            />
                            <Text style={styles.agencyLabel}>
                                {ride.isPrivate ? t('rideDetails.agency.driver') : t('rideDetails.agency.operatedBy')}
                            </Text>
                            <Text style={styles.agencyName}>
                                {ride.isPrivate
                                    ? (ride.userId?.name || t('rideDetails.agency.unknownDriver'))
                                    : (ride.agencyId?.name || t('rideDetails.agency.unknownAgency'))
                                }
                            </Text>
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
                            {isBooking ? t('rideDetails.booking.booking') :
                                ride.statusDisplay === 'Full' ? t('rideDetails.booking.rideFull') :
                                    t('rideDetails.booking.bookThisRide')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            {/* Driver Contact Modal for Private Rides */}
            {showDriverModal && ride && ride.isPrivate && ride.userId && (
                <DriverContactModal
                    visible={showDriverModal}
                    rideDetails={{
                        from: ride.from,
                        to: ride.to,
                        departureDate: format(new Date(ride.departure_time), 'MMM dd, yyyy'),
                        price: ride.price
                    }}
                    driverInfo={ride.userId}
                    onConfirmPayment={handlePaymentConfirmed}
                    onClose={() => setShowDriverModal(false)}
                />
            )}
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