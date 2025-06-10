import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Modal, RefreshControl, SafeAreaView } from 'react-native';
import axios from 'axios';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { useApi } from '../../hooks/useApi';
import { LinearGradient } from 'expo-linear-gradient';

export default function BookedRidesScreen() {
    const [qrCodeModalVisible, setQRCodeModalVisible] = useState(false);
    const [pinModalVisible, setPinModalVisible] = useState(false);
    const [selectedRideId, setSelectedRideId] = useState(null);
    const [generatedPin, setGeneratedPin] = useState('');
    const [expandedSections, setExpandedSections] = useState({
        public: true,
        private: true,
    });
    const { user } = useAuth();
    const router = useRouter();

    const {
        data: bookedRides,
        error: fetchError,
        isLoading: isLoadingRides,
        execute: fetchUserBookings,
        retry: retryFetchBookings
    } = useApi(async () => {
        const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/rides/booked`, {
            headers: { Authorization: `Bearer ${user.token}` },
        });
        return response.data;
    }, {
        onError: (error) => {
            Alert.alert(
                'Error Loading Bookings',
                error.userMessage || 'We encountered an error while loading your booked rides. Please try again.',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel'
                    },
                    {
                        text: 'Retry',
                        onPress: () => fetchUserBookings()
                    }
                ]
            );
        }
    });

    const {
        error: cancelError,
        isLoading: isCancelling,
        execute: cancelBooking,
        retry: retryCancel
    } = useApi(async (rideId) => {
        const response = await axios.delete(`${process.env.EXPO_PUBLIC_API_URL}/rides/${rideId}/cancel`, {
            headers: { Authorization: `Bearer ${user.token}` },
        });
        return response.data;
    }, {
        onError: (error) => {
            Alert.alert(
                'Error Cancelling Booking',
                error.userMessage || 'We encountered an error while cancelling your booking. Please try again.',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel'
                    },
                    {
                        text: 'Retry',
                        onPress: () => retryCancel()
                    }
                ]
            );
        }
    });

    useEffect(() => {
        fetchUserBookings();
    }, []);

    const onRefresh = useCallback(() => {
        fetchUserBookings();
    }, []);

    const toggleExpand = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const generateQRCodeData = (rideId) => {
        const ride = bookedRides?.find(ride => ride._id === rideId);
        if (!ride) {
            console.warn(`Ride not found for rideId: ${rideId}`);
            return JSON.stringify({ rideId, userId: user.id, bookingId: null });
        }
        const booking = ride.bookedBy?.find(b => b.userId === user.id);
        const bookingId = booking?.bookingId;
        if (!bookingId) {
            console.warn(`No bookingId found for rideId: ${rideId}, userId: ${user.id}`);
        }
        const data = { rideId, userId: user.id, bookingId };
        return JSON.stringify(data);
    };

    const handleOpenQRCode = (rideId) => {
        setSelectedRideId(rideId);
        setQRCodeModalVisible(true);
    };

    const handleCancelBooking = async (rideId) => {
        try {
            await cancelBooking(rideId);
            fetchUserBookings();
        } catch (_) {
            // Error is already handled by useApi
            
        }
    };

    const handleFinishRide = async (rideId) => {
        Alert.alert(
            "Finish Ride",
            "Are you sure you want to finish this ride?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Yes, Finish",
                    onPress: async () => {
                        try {
                            // Generate a 6-digit PIN
                            const pin = Math.floor(100000 + Math.random() * 900000).toString();

                            // Call API to generate PIN for ride completion
                            await axios.post(
                                `${process.env.EXPO_PUBLIC_API_URL}/rides/${rideId}/generate-completion-pin`,
                                { pin },
                                {
                                    headers: { Authorization: `Bearer ${user.token}` },
                                }
                            );

                            setGeneratedPin(pin);
                            setSelectedRideId(rideId);
                            setPinModalVisible(true);

                        } catch (error) {
                            console.error('Error generating PIN:', error);
                            console.error('Error response:', error.response?.data);
                            console.error('Error status:', error.response?.status);
                            Alert.alert(
                                "Error",
                                error.response?.data?.error || "Failed to generate completion PIN. Please try again."
                            );
                        }
                    }
                }
            ]
        );
    };

    const sortedRides = [...(bookedRides || [])].sort((a, b) => {
        const aCheckedIn = a.bookedBy?.find(b => b.userId === user.id)?.checkInStatus === 'checked-in';
        const bCheckedIn = b.bookedBy?.find(b => b.userId === user.id)?.checkInStatus === 'checked-in';

        // Prioritize checked-in rides, then non-missed/non-no-completion rides, then missed/no-completion rides
        const aStatus = a.checkInStatus;
        const bStatus = b.checkInStatus;

        if (aCheckedIn !== bCheckedIn) {
            return aCheckedIn ? -1 : 1;
        }

        // Among non-checked-in rides, show missed and no-completion rides last
        const aIsProblem = aStatus === 'missed' || aStatus === 'no completion';
        const bIsProblem = bStatus === 'missed' || bStatus === 'no completion';

        if (aIsProblem && !bIsProblem) return 1;
        if (bIsProblem && !aIsProblem) return -1;

        return 0;
    });

    // Separate public and private bookings
    const publicBookings = sortedRides.filter(ride => !ride.isPrivate);
    const privateBookings = sortedRides.filter(ride => ride.isPrivate);

    const renderRideSection = (rides, title, icon, sectionKey, sectionColor) => {
        if (rides.length === 0) return null;

        return (
            <View style={styles.section}>
                <TouchableOpacity onPress={() => toggleExpand(sectionKey)}>
                    <View style={[styles.sectionHeader, { backgroundColor: sectionColor }]}>
                        <View style={styles.sectionHeaderLeft}>
                            <Ionicons name={icon} size={20} color="#fff" />
                            <Text style={styles.sectionTitle}>{title} ({rides.length})</Text>
                        </View>
                        <FontAwesome5
                            name={expandedSections[sectionKey] ? 'chevron-up' : 'chevron-down'}
                            size={16}
                            color="#fff"
                        />
                    </View>
                </TouchableOpacity>

                {expandedSections[sectionKey] && (
                    <View style={styles.sectionContent}>
                        {rides.map((item) => {
                            const userBooking = item.bookedBy?.find(b => b.userId === user.id);
                            const isCheckedIn = userBooking?.checkInStatus === 'checked-in';
                            const isMissed = item.checkInStatus === 'missed';
                            const isNoCompletion = item.checkInStatus === 'no completion';

                            // Determine status color with consistent color scheme
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
                                    default:
                                        return '#38a169'; // Default Green
                                }
                            };

                            const statusColor = getStatusColor(item.statusDisplay);

                            return (
                                <View key={item._id} style={[
                                    styles.rideCard,
                                    isCheckedIn && styles.checkedInCard,
                                    isMissed && styles.missedCard,
                                    isNoCompletion && styles.noCompletionCard
                                ]}>
                                    {isCheckedIn && (
                                        <View style={styles.checkedInBadge}>
                                            <Text style={styles.checkedInText}>Checked In</Text>
                                        </View>
                                    )}
                                    {isMissed && (
                                        <View style={styles.missedBadge}>
                                            <FontAwesome5 name="exclamation-triangle" size={10} color="#fff" />
                                            <Text style={styles.missedText}>Missed</Text>
                                        </View>
                                    )}
                                    {isNoCompletion && (
                                        <View style={styles.noCompletionBadge}>
                                            <FontAwesome5 name="clock" size={10} color="#fff" />
                                            <Text style={styles.noCompletionText}>No Completion</Text>
                                        </View>
                                    )}
                                    <View style={styles.routeContainer}>
                                        <Ionicons name="location-outline" size={20} color="#2C7A7B" style={styles.icon} />
                                        <Text style={styles.routeText}>
                                            {item.from || item.categoryId?.from || 'Unknown'} → {item.to || item.categoryId?.to || 'Unknown'}
                                        </Text>
                                    </View>
                                    {item.isPrivate && (
                                        <View style={styles.privateTag}>
                                            <FontAwesome5 name="lock" size={10} color="#fff" />
                                            <Text style={styles.privateTagText}>Private Ride</Text>
                                        </View>
                                    )}
                                    <View style={styles.timeContainer}>
                                        <Ionicons name="calendar-outline" size={18} color="#F56565" style={styles.icon} />
                                        <Text style={styles.timeText}>
                                            {format(new Date(item.departure_time), 'PPP')}
                                        </Text>
                                        <View style={styles.timeDetails}>
                                            <Text style={styles.timeText}>
                                                {format(new Date(item.departure_time), 'p')} - {format(new Date(item.estimatedArrivalTime), 'p')}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={styles.detailText}>
                                        Seats: {item.seats - item.booked_seats}/{item.seats}
                                    </Text>
                                    <Text style={[styles.detailText, { color: statusColor, fontWeight: 'bold' }]}>
                                        Status: {item.statusDisplay}
                                    </Text>
                                    {isMissed && (
                                        <Text style={styles.missedMessage}>
                                            This ride was missed. The departure time has passed without check-in.
                                        </Text>
                                    )}
                                    {isNoCompletion && (
                                        <Text style={styles.noCompletionMessage}>
                                            This private ride was not completed within 2 hours of the estimated arrival time.
                                        </Text>
                                    )}
                                    {!isCheckedIn && !isMissed && !isNoCompletion && (
                                        <View style={styles.buttonContainer}>
                                            {item.isPrivate ? (
                                                <TouchableOpacity
                                                    style={styles.finishRideButton}
                                                    onPress={() => handleFinishRide(item._id)}
                                                >
                                                    <FontAwesome5 name="flag-checkered" size={16} color="white" />
                                                    <Text style={styles.buttonText}>Finish Ride</Text>
                                                </TouchableOpacity>
                                            ) : (
                                                <TouchableOpacity
                                                    style={styles.qrButton}
                                                    onPress={() => handleOpenQRCode(item._id)}
                                                >
                                                    <FontAwesome5 name="qrcode" size={16} color="white" />
                                                    <Text style={styles.buttonText}>Show QR</Text>
                                                </TouchableOpacity>
                                            )}
                                            <TouchableOpacity
                                                style={[styles.cancelButton, isCancelling && styles.buttonDisabled]}
                                                onPress={() => handleCancelBooking(item._id)}
                                                disabled={isCancelling}
                                            >
                                                <FontAwesome5 name="times" size={16} color="white" />
                                                <Text style={styles.buttonText}>
                                                    {isCancelling ? 'Cancelling...' : 'Cancel'}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                )}
            </View>
        );
    };

    return (
        <LinearGradient
            colors={['#0a2472', '#1E90FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.backgroundGradient}
        >
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <FontAwesome5 name="arrow-left" size={20} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>My Booked Rides</Text>
                    <View style={styles.headerPlaceholder} />
                </View>

                <FlatList
                    data={[]}
                    renderItem={null}
                    keyExtractor={() => 'dummy'}
                    refreshControl={
                        <RefreshControl
                            refreshing={isLoadingRides}
                            onRefresh={onRefresh}
                            colors={['#4CAF50']}
                            tintColor='#4CAF50'
                        />
                    }
                    contentContainerStyle={styles.scrollContent}
                    ListHeaderComponent={
                        <View>
                            {renderRideSection(publicBookings, 'Public Rides', 'bus-outline', 'public', '#2196F3')}
                            {renderRideSection(privateBookings, 'Private Rides', 'car-outline', 'private', '#d65108')}
                            {sortedRides.length === 0 && !isLoadingRides && (
                                <View style={styles.emptyContainer}>
                                    <FontAwesome5 name="calendar-times" size={64} color="rgba(255, 255, 255, 0.6)" />
                                    <Text style={styles.emptyText}>No booked rides found</Text>
                                    <Text style={styles.emptySubText}>Book a ride to see it here</Text>
                                </View>
                            )}
                        </View>
                    }
                />

                <Modal
                    visible={qrCodeModalVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setQRCodeModalVisible(false)}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Ride QR Code</Text>
                            {selectedRideId && (
                                <QRCode
                                    value={generateQRCodeData(selectedRideId)}
                                    size={200}
                                    color="#000000"
                                    backgroundColor="#FFFFFF"
                                />
                            )}
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setQRCodeModalVisible(false)}
                            >
                                <Text style={styles.closeButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                <Modal
                    visible={pinModalVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setPinModalVisible(false)}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <FontAwesome5 name="flag-checkered" size={48} color="#4CAF50" style={styles.modalIcon} />
                            <Text style={styles.modalTitle}>Ride Completion PIN</Text>
                            <Text style={styles.pinSubtitle}>Share this PIN with your driver to complete the ride</Text>
                            <View style={styles.pinContainer}>
                                <Text style={styles.pinText}>{generatedPin}</Text>
                            </View>
                            <Text style={styles.pinInstructions}>
                                The driver will enter this PIN to mark the ride as completed.
                                Once completed, this ride will be moved to your ride history.
                            </Text>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => {
                                    setPinModalVisible(false);
                                    setGeneratedPin('');
                                    setSelectedRideId(null);
                                }}
                            >
                                <Text style={styles.closeButtonText}>Got it!</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
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
    scrollContent: {
        padding: 16,
    },
    section: {
        marginBottom: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 12,
        overflow: 'hidden',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
    },
    sectionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        marginLeft: 10,
    },
    sectionContent: {
        padding: 15,
    },
    rideCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        borderLeftWidth: 4,
        borderLeftColor: '#2196F3',
        position: 'relative',
    },
    checkedInCard: {
        borderLeftColor: '#4CAF50',
        backgroundColor: '#f8fff8',
    },
    checkedInBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#4CAF50',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    checkedInText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    routeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    routeText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0a2472',
        marginLeft: 8,
        flex: 1,
    },
    privateTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#d65108',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    privateTagText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    timeDetails: {
        marginLeft: 'auto',
    },
    timeText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 8,
    },
    detailText: {
        fontSize: 14,
        color: '#555',
        marginBottom: 4,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
        gap: 10,
    },
    qrButton: {
        backgroundColor: '#0a2472',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    finishRideButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    cancelButton: {
        backgroundColor: '#dc3545',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 18,
        color: '#fff',
        textAlign: 'center',
        marginTop: 16,
        fontWeight: '600',
    },
    emptySubText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
        marginTop: 8,
    },
    icon: {
        marginRight: 8,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        minWidth: 280,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#0a2472',
    },
    closeButton: {
        backgroundColor: '#0a2472',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginTop: 20,
    },
    closeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    modalIcon: {
        marginBottom: 20,
    },
    pinSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 10,
    },
    pinContainer: {
        backgroundColor: '#f0f0f0',
        padding: 10,
        borderRadius: 8,
        marginBottom: 20,
    },
    pinText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0a2472',
    },
    pinInstructions: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    missedCard: {
        borderLeftColor: '#e53e3e',
        backgroundColor: '#fff8f8',
    },
    missedBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#e53e3e',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    missedText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    missedMessage: {
        color: '#e53e3e',
        fontSize: 12,
        marginTop: 8,
        marginBottom: 4,
        fontStyle: 'italic',
        textAlign: 'center',
        backgroundColor: 'rgba(229, 62, 62, 0.1)',
        padding: 8,
        borderRadius: 8,
    },
    noCompletionCard: {
        borderLeftColor: '#9CA3AF',
        backgroundColor: '#fff9f6',
    },
    noCompletionBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#9CA3AF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    noCompletionText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    noCompletionMessage: {
        color: '#9CA3AF',
        fontSize: 12,
        marginTop: 8,
        marginBottom: 4,
        fontStyle: 'italic',
        textAlign: 'center',
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
        padding: 8,
        borderRadius: 8,
    },
}); 