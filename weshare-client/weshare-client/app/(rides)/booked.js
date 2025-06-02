import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Modal, RefreshControl } from 'react-native';
import axios from 'axios';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
export default function BookedRidesScreen() {
    const [bookedRides, setBookedRides] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [qrCodeModalVisible, setQRCodeModalVisible] = useState(false);
    const [selectedRideId, setSelectedRideId] = useState(null);

    const { user } = useAuth();
    const router = useRouter();

    const fetchUserBookings = async () => {
        try {
            if (!user?.id || !user?.token) {
                console.error('User ID or token missing');
                return;
            }
            const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/rides/booked`, {
                headers: { Authorization: `Bearer ${user.token}` },
            });

            setBookedRides(response.data);
        } catch (error) {
            console.error('Error fetching user bookings:', error.response?.data || error.message);
            Alert.alert('Error', 'Failed to fetch user bookings. Please try again.');
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchUserBookings();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchUserBookings();
    }, []);

    const generateQRCodeData = (rideId) => {
        const ride = bookedRides.find(ride => ride._id === rideId);
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
            const response = await axios.delete(`${process.env.EXPO_PUBLIC_API_URL}/rides/${rideId}/cancel`, {
                headers: { Authorization: `Bearer ${user.token}` },
            });
            Alert.alert('Success', 'Booking cancelled successfully');
            fetchUserBookings(); // Refresh the list
        } catch (error) {
            console.error('Error cancelling booking:', error.response?.data || error.message);
            Alert.alert('Error', error.response?.data?.error || 'Failed to cancel booking');
        }
    };

    const renderRide = ({ item }) => {
        const userBooking = item.bookedBy?.find(b => b.userId === user.id);
        const isCheckedIn = userBooking?.checkInStatus === 'checked-in';

        // Determine status color
        const statusColor = item.statusDisplay === 'Full' ? '#FF0000' :
            item.statusDisplay === 'Nearly Full' ? '#FFA500' : '#008000';

        return (
            <View style={[styles.rideCard, isCheckedIn && styles.checkedInCard]}>
                {isCheckedIn && (
                    <View style={styles.checkedInBadge}>
                        <Text style={styles.checkedInText}>Checked In</Text>
                    </View>
                )}
                <View style={styles.routeContainer}>
                    <Ionicons name="location-outline" size={20} color="#2C7A7B" style={styles.icon} />
                    <Text style={styles.routeText}>
                        {item.from || item.categoryId?.from || 'Unknown'} → {item.to || item.categoryId?.to || 'Unknown'}
                    </Text>
                </View>
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
                {!isCheckedIn && (
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.qrButton}
                            onPress={() => handleOpenQRCode(item._id)}
                        >
                            <Text style={styles.buttonText}>Show QR Code</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => handleCancelBooking(item._id)}
                        >
                            <Text style={styles.buttonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    const sortedRides = [...bookedRides].sort((a, b) => {
        const aCheckedIn = a.bookedBy?.find(b => b.userId === user.id)?.checkInStatus === 'checked-in';
        const bCheckedIn = b.bookedBy?.find(b => b.userId === user.id)?.checkInStatus === 'checked-in';
        return aCheckedIn === bCheckedIn ? 0 : aCheckedIn ? -1 : 1;
    });

    return (
        <View style={styles.container}>
            <Text style={styles.title}>My Booked Rides</Text>
            <FlatList
                data={sortedRides}
                renderItem={renderRide}
                keyExtractor={(item) => item._id}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={<Text style={styles.emptyText}>No booked rides found</Text>}
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,

        backgroundColor: '#F7FAFC',
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#2D3748',
        marginBottom: 20,
        textAlign: 'center',
    },
    rideCard: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 12,
        marginBottom: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderLeftWidth: 4,
        borderLeftColor: '#319795',
        position: 'relative',
        marginTop: 10,
    },
    checkedInCard: {
        borderLeftColor: '#4CAF50',
    },
    checkedInBadge: {
        position: 'absolute',
        top: -10,
        right: 20,
        backgroundColor: '#4CAF50',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        zIndex: 1,
    },
    checkedInText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    routeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        marginTop: 10,
    },
    routeText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2C7A7B',
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        flexWrap: 'wrap',
    },
    timeText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#F56565',
        marginRight: 15,
    },
    detailText: {
        fontSize: 14,
        color: '#4A5568',
        marginBottom: 5,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    qrButton: {
        backgroundColor: '#319795',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        flex: 1,
        marginRight: 10,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#F56565',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        flex: 1,
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    icon: {
        marginRight: 8,
    },
    emptyText: {
        fontSize: 16,
        color: '#4A5568',
        textAlign: 'center',
        marginTop: 20,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        width: '80%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2D3748',
        marginBottom: 20,
    },
    closeButton: {
        backgroundColor: '#319795',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginTop: 20,
    },
    closeButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});