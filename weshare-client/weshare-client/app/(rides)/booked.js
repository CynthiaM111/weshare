import { View, FlatList, Alert, RefreshControl, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Text } from '@ui-kitten/components';
import { FontAwesome5 } from '@expo/vector-icons';
import axios from 'axios';
import RideCard from '../../components/RideCard';
import { config } from '../../config';
import { useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';

export default function BookedRidesScreen() {
    
    const [bookedRides, setBookedRides] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [expandedSections, setExpandedSections] = useState({ booked: true });
    const [qrModalVisible, setQrModalVisible] = useState(false);
    const [selectedRideId, setSelectedRideId] = useState(null);
    const { user } = useAuth();
    const router = useRouter();

    const fetchBookedRides = async () => {
        try {
            const response = await axios.get(
                `${process.env.EXPO_PUBLIC_API_URL}/rides/booked`,
                {
                    headers: {
                        Authorization: `Bearer ${user.token}`
                    }
                }
            );
            setBookedRides(response.data);
        } catch (error) {
            console.error('Error fetching booked rides:', error.response || error);
            Alert.alert('Error', 'Failed to fetch booked rides');
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await fetchBookedRides();
        } finally {
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchBookedRides();
        }
    }, [user]);

    const groupRidesByDate = (rides) => {
        const grouped = rides.reduce((acc, ride) => {
            const date = new Date(ride.departure_time).toLocaleDateString();
            if (!acc[date]) {
                acc[date] = {
                    date,
                    rides: [],
                    timeRange: ''
                };
            }
            acc[date].rides.push(ride);
            return acc;
        }, {});

        Object.values(grouped).forEach(group => {
            group.rides.sort((a, b) => new Date(a.departure_time) - new Date(b.departure_time));
            const times = group.rides.map(r => new Date(r.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            group.timeRange = `${times[0]} - ${times[times.length - 1]}`;
        });

        return Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));
    };

    const toggleExpand = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };



    const handleCancelBooking = async (rideId) => {
        try {
            await axios.delete(
                `${process.env.EXPO_PUBLIC_API_URL}/rides/${rideId}/cancel`,
                {
                    headers: {
                        Authorization: `Bearer ${user.token}`
                    }
                }
            );
            Alert.alert('Success', 'Booking cancelled successfully');
            await fetchBookedRides();
        } catch (error) {
            Alert.alert('Error', error.response?.data?.error || 'Failed to cancel booking');
        }
    };
    const handleShowQRCode = (rideId) => {
        console.log("show qr code for ride", rideId)
        setSelectedRideId(rideId);
        setQrModalVisible(true);
        console.log("qr modal should be visible", qrModalVisible)
    };

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
        console.log('Generated QR code data:', data);
        return JSON.stringify(data);
    };

    const groupedBookedRides = groupRidesByDate(bookedRides);
    console.log(qrModalVisible)


    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.searchButton}
                onPress={() => router.push('/(home)')}
            >
                <FontAwesome5 name="search" size={16} color="black" style={styles.searchIcon} />
                <Text style={styles.searchButtonText}>Back to Search</Text>
            </TouchableOpacity>

            <FlatList
                data={[]}
                renderItem={null}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={["#4CAF50"]}
                        tintColor="#4CAF50"
                    />
                }
                ListHeaderComponent={
                    <View style={{ marginBottom: 24 }}>
                        <TouchableOpacity onPress={() => toggleExpand('booked')}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Your Booked Rides</Text>
                                <FontAwesome5
                                    name={expandedSections.booked ? "chevron-up" : "chevron-down"}
                                    size={16}
                                    color="black"
                                />
                            </View>
                        </TouchableOpacity>

                        {expandedSections.booked && (
                            <View style={styles.sectionContent}>
                                {groupedBookedRides.map(group => (
                                    <View key={`booked-${group.date}`} style={styles.dateGroup}>
                                        <View style={styles.dateHeader}>
                                            <FontAwesome5 name="calendar-alt" size={16} color="black" style={{ marginRight: 8 }} />
                                            <Text style={styles.dateText}>{group.date}</Text>
                                            <Text style={styles.timeRangeText}>{group.timeRange}</Text>
                                        </View>
                                        {group.rides.map(ride => (
                                            <RideCard
                                                key={ride._id}
                                                ride={ride}
                                                isBooked={true}
                                                availableSeats={ride.available_seats}
                                                statusDisplay={ride.statusDisplay}
                                                showCancelButton={true}
                                                onCancelBooking={() => handleCancelBooking(ride._id)}
                                                onShowQRCode={() => handleShowQRCode(ride._id)}
                                                isCheckedIn={ride.isCheckedIn}
                                            />
                                        ))}
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                }
                ListEmptyComponent={
                    !bookedRides.length && (
                        <View style={styles.emptyContainer}>
                            <Text category='s1' style={styles.emptyText}>
                                No booked rides
                            </Text>
                        </View>
                    )
                }
            />
            <Modal
                visible={qrModalVisible}
                onRequestClose={() => setQrModalVisible(false)}
                // transparent={true}
                animationType="slide"
            >
                <View style={styles.qrModalContainer}>
                    <View style={styles.qrModalContent}>
                        <Text style={styles.qrModalTitle}>Your Check-In QR Code</Text>
                        {selectedRideId && (
                            <QRCode
                                value={generateQRCodeData(selectedRideId)}
                                size={200}
                                backgroundColor="white"
                                color="black"
                            />
                        )}
                        <Text style={styles.qrModalInstruction}>
                            Show this QR code to the employee for check-in
                        </Text>
                        <TouchableOpacity
                            style={styles.qrModalCloseButton}
                            onPress={() => setQrModalVisible(false)}
                        >
                            <Text style={styles.qrModalCloseButtonText}>Close</Text>
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
        padding: 16,
        backgroundColor: '#f5f5f5',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        textAlign: 'center',
        color: '#8F9BB3',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#e9e9e9',
        borderRadius: 8,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    sectionContent: {
        paddingHorizontal: 8,
    },
    dateGroup: {
        marginBottom: 16,
        backgroundColor: '#f2f2f2',
        padding: 16,
        borderRadius: 12,
    },
    dateHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    dateText: {
        fontWeight: 'bold',
        marginRight: 12,
    },
    timeRangeText: {
        color: 'gray',
        fontSize: 14,
    },
    searchButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'black',
        padding: 10,
        borderRadius: 10,
        marginBottom: 16,
        backgroundColor: 'royalblue',
        color: 'white',
    },
    searchIcon: {
        marginRight: 8,
    },
    searchButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
    },
    qrModalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    qrModalContent: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        width: '80%',
    },
    qrModalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    qrModalInstruction: {
        fontSize: 16,
        color: '#666',
        marginVertical: 20,
        textAlign: 'center',
    },
    qrModalCloseButton: {
        backgroundColor: '#FF0000',
        padding: 10,
        borderRadius: 6,
    },
    qrModalCloseButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});