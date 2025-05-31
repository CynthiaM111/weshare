import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import RideCard from '../../components/RideCard';
import { useLocalSearchParams } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';


export default function RidesScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const params = useLocalSearchParams();
    const [searchResults, setSearchResults] = useState([]);
    const [userBookings, setUserBookings] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [expandedSections, setExpandedSections] = useState({
        available: true,
        full: true,
        booked: true,
    });
    const [selectedRide, setSelectedRide] = useState(null);

    useEffect(() => {
        if (params.rides) {
            try {
                const parsedRides = JSON.parse(params.rides);
                setSearchResults(parsedRides);
            } catch (error) {
                console.error('Error parsing search results:', error);
                Alert.alert('Error', 'Failed to load search results');
            }
        }
    }, [params.rides]);

    useEffect(() => {
        if (user) {
            fetchUserBookings();
        }
    }, [user]);

    const fetchUserBookings = async () => {
        try {
            if (!user?.id || !user?.token) {
                console.error('User ID or token missing');
                return;
            }
            
            const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/rides/booked`, {
                headers: { Authorization: `Bearer ${user.token}` },
            });
            
            setUserBookings(response.data);
        } catch (error) {
            console.error('Error fetching user bookings:', error.response?.data || error.message);
            Alert.alert('Error', 'Failed to fetch user bookings. Please try again.');
        } finally {
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await fetchUserBookings();
            if (params.rides) {
                const parsedRides = JSON.parse(params.rides);
                setSearchResults(parsedRides);
            }
        } catch (error) {
            console.error('Error refreshing:', error);
            Alert.alert('Error', 'Failed to refresh. Please try again.');
        } finally {
            setRefreshing(false);
        }
    }, [params.rides]);

    
    const groupRidesByDate = (ridesToGroup) => {
        const grouped = ridesToGroup.reduce((acc, ride) => {
            const date = new Date(ride.departure_time).toLocaleDateString();
            if (!acc[date]) {
                acc[date] = {
                    date,
                    rides: [],
                    timeRange: '',
                };
            }
            acc[date].rides.push(ride);
            return acc;
        }, {});

        Object.values(grouped).forEach((group) => {
            group.rides.sort((a, b) => new Date(a.departure_time) - new Date(b.departure_time));
            const times = group.rides.map((r) =>
                new Date(r.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            );
            group.timeRange = `${times[0]} - ${times[times.length - 1]}`;
        });

        return Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));
    };

    const toggleExpand = (section) => {
        setExpandedSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    // Separate available rides and booked rides
    const bookedRideIds = new Set(userBookings.map((ride) => ride._id));
    const availableRides = searchResults.filter(
        (ride) => !bookedRideIds.has(ride._id) && ride.available_seats > 0
    );
    const bookedRidesFromSearch = searchResults.filter((ride) => bookedRideIds.has(ride._id));
    const fullRides = searchResults.filter(
        (ride) => !bookedRideIds.has(ride._id) && ride.available_seats <= 0
    );

    const groupedAvailableRides = groupRidesByDate(availableRides);
    const groupedBookedRides = groupRidesByDate(bookedRidesFromSearch);
    const groupedFullRides = groupRidesByDate(fullRides);
    const allBookedRides = groupRidesByDate(userBookings);

    const hasSearchResults = searchResults.length > 0;
    const hasBookings = userBookings.length > 0;

    // const handleCancelBooking = async (rideId) => {
    //     try {
    //         console.log('Canceling booking:', rideId);
    //         await axios.delete(`${process.env.EXPO_PUBLIC_API_URL}/rides/${rideId}/cancel`, {
    //             headers: { Authorization: `Bearer ${user.token}` },
    //         });
    //         await fetchUserBookings();
    //         onRefresh();
    //         Alert.alert('Success', 'Booking canceled');
    //     } catch (error) {
    //         console.error('Error canceling booking:', error.response?.data || error.message);
    //         Alert.alert('Error', 'Failed to cancel booking. Please try again.');
    //     }
    // };

    return (
        <View style={{ flex: 1, padding: 16 }}>
            <FlatList
                data={[]}
                renderItem={null}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#4CAF50']}
                        tintColor='#4CAF50'
                    />
                }
                ListHeaderComponent={
                    <>
                        {!hasSearchResults && (
                            <View style={styles.emptySearchContainer}>
                                <Text style={styles.emptySearchText}>
                                    {hasBookings
                                        ? "You haven't searched for any rides yet"
                                        : 'No rides found. Start by searching for rides'}
                                </Text>
                                <TouchableOpacity
                                    style={styles.searchButton}
                                    onPress={() => router.push('/(home)')}
                                >
                                    <FontAwesome5
                                        name="search"
                                        size={16}
                                        color="black"
                                        style={styles.searchIcon}
                                    />
                                    <Text style={styles.searchButtonText}>Search for Rides</Text>
                                </TouchableOpacity>
                                {hasBookings && (
                                    <TouchableOpacity
                                        style={[styles.searchButton, { marginTop: 10 }]}
                                        onPress={() => router.push('/booked')}
                                    >
                                        <FontAwesome5
                                            name="ticket-alt"
                                            size={16}
                                            color="black"
                                            style={styles.searchIcon}
                                        />
                                        <Text style={styles.searchButtonText}>View Booked Rides</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}

                        {hasSearchResults && groupedAvailableRides.length > 0 && (
                            <View style={{ marginBottom: 24 }}>
                                <TouchableOpacity onPress={() => toggleExpand('available')}>
                                    <View style={styles.sectionHeader}>
                                        <Text style={styles.sectionTitle}>Available Rides</Text>
                                        <FontAwesome5
                                            name={expandedSections.available ? 'chevron-up' : 'chevron-down'}
                                            size={16}
                                            color="black"
                                        />
                                    </View>
                                </TouchableOpacity>

                                {expandedSections.available && (
                                    <View style={styles.sectionContent}>
                                        {groupedAvailableRides.map((group) => (
                                            <View key={`available-${group.date}`} style={styles.dateGroup}>
                                                <View style={styles.dateHeader}>
                                                    <FontAwesome5
                                                        name="calendar-alt"
                                                        size={16}
                                                        color="black"
                                                        style={{ marginRight: 8 }}
                                                    />
                                                    <Text style={styles.dateText}>{group.date}</Text>
                                                    <Text style={styles.timeRangeText}>{group.timeRange}</Text>
                                                </View>
                                                {group.rides.map((ride) => (
                                                    <RideCard
                                                        key={ride._id}
                                                        ride={ride}
                                                        onPress={() => router.push(`/(rides)/${ride._id}`)}
                                                        isBooked={false}
                                                        availableSeats={ride.available_seats}
                                                        statusDisplay={ride.statusDisplay}
                                                    />
                                                ))}
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        )}

                        {hasSearchResults && groupedFullRides.length > 0 && (
                            <View style={{ marginBottom: 24 }}>
                                <TouchableOpacity onPress={() => toggleExpand('full')}>
                                    <View style={styles.sectionHeader}>
                                        <Text style={styles.sectionTitle}>Full Rides</Text>
                                        <FontAwesome5
                                            name={expandedSections.full ? 'chevron-up' : 'chevron-down'}
                                            size={16}
                                            color="black"
                                        />
                                    </View>
                                </TouchableOpacity>

                                {expandedSections.full && (
                                    <View style={styles.sectionContent}>
                                        {groupedFullRides.map((group) => (
                                            <View key={`full-${group.date}`} style={styles.dateGroup}>
                                                <View style={styles.dateHeader}>
                                                    <FontAwesome5
                                                        name="calendar-alt"
                                                        size={16}
                                                        color="black"
                                                        style={{ marginRight: 8 }}
                                                    />
                                                    <Text style={styles.dateText}>{group.date}</Text>
                                                    <Text style={styles.timeRangeText}>{group.timeRange}</Text>
                                                </View>
                                                {group.rides.map((ride) => (
                                                    <RideCard
                                                        key={ride._id}
                                                        ride={ride}
                                                        onPress={() => router.push(`/(rides)/${ride._id}`)}
                                                        isBooked={false}
                                                        availableSeats={ride.available_seats}
                                                        statusDisplay={ride.statusDisplay}
                                                        isFull
                                                        // onCancelBooking={() => handleCancelBooking(ride._id)}
                                                    />
                                                ))}
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        )}
                        {hasSearchResults && hasBookings && (
                            <TouchableOpacity
                                style={[styles.searchButton, { marginBottom: 24 }]}
                                onPress={() => router.push('/booked')}
                            >
                                <FontAwesome5
                                    name="ticket-alt"
                                    size={16}
                                    color="black"
                                    style={styles.searchIcon}
                                />
                                <Text style={styles.searchButtonText}>View Booked Rides</Text>
                            </TouchableOpacity>
                        )}
                    </>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    emptySearchContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        marginBottom: 20,
    },
    emptySearchText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
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
    },
    searchIcon: {
        marginRight: 8,
    },
    searchButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'black',
    },
});