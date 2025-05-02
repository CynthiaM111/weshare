// app/(rides)/index.js
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Button, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import RideCard from '../../components/RideCard';
import { useLocalSearchParams } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { config } from '../../config';

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
        booked: true
    });


    // Parse the rides from params on component mount
    useEffect(() => {
        if (params.rides) {
            const parsedRides = JSON.parse(params.rides);
            setSearchResults(parsedRides);
        }
    }, [params.rides]);

    // Fetch user's bookings when component mounts
    useEffect(() => {
        if (user) {
            fetchUserBookings();
        }
    }, [user]);

    const fetchUserBookings = async () => {
        try {
            const response = await axios.get(`${config.API_URL}/rides/booked`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setUserBookings(response.data);
        } catch (error) {
            console.error('Error fetching user bookings:', error);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            // Refresh user bookings
            await fetchUserBookings();
            if (params.rides) {
                const parsedRides = JSON.parse(params.rides);
                setSearchResults(parsedRides);
            }
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

    // Separate available rides and booked rides
    const bookedRideIds = new Set(userBookings.map(ride => ride._id));
    const availableRides = searchResults.filter(ride =>
        !bookedRideIds.has(ride._id) && (ride.seats - (ride.booked_seats || 0) > 0)
    );
    const bookedRidesFromSearch = searchResults.filter(ride =>
        bookedRideIds.has(ride._id)
    );
    const fullRides = searchResults.filter(ride =>
        !bookedRideIds.has(ride._id) && (ride.seats - (ride.booked_seats || 0) <= 0)
    );

    const groupedAvailableRides = groupRidesByDate(availableRides);
    const groupedBookedRides = groupRidesByDate(bookedRidesFromSearch);
    const groupedFullRides = groupRidesByDate(fullRides);
    const allBookedRides = groupRidesByDate(userBookings);

    // Check if we have any rides to show (from search or bookings)
    const hasSearchResults = searchResults.length > 0;
    const hasBookings = userBookings.length > 0;

    const handleCancelBooking = async (rideId) => {
        try {
            await axios.delete(`${config.API_URL}/rides/${rideId}/cancel`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            
            // Remove the booking from userBookings
            const newUserBookings = new Set(userBookings);
            newUserBookings.delete(rideId);
            setUserBookings(newUserBookings);
            
            // Refresh the rides data
            onRefresh();
        } catch (error) {
            console.error('Error canceling booking:', error);
            alert('Failed to cancel booking. Please try again.');
        }
    };

    return (
        <View style={{ flex: 1, padding: 16 }}>
            <FlatList
                data={[]} // Empty data to use ListHeaderComponent and ListFooterComponent
                renderItem={null}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={["#4CAF50"]} // Android
                        tintColor="#4CAF50" // iOS
                    />
                }
                ListHeaderComponent={
                    <>
                        {/* Show search button if no search results */}
                        {!hasSearchResults && (
                            <View style={styles.emptySearchContainer}>
                                {hasBookings ? (
                                    <>
                                        <Text style={styles.emptySearchText}>You haven't searched for any rides yet</Text>
                                        <Button
                                            title="Search for Rides"
                                            onPress={() => router.push('/')}
                                            color="#4CAF50"
                                        />
                                    </>
                                ) : (
                                    <>
                                        <Text style={styles.emptySearchText}>No rides found. Start by searching for rides</Text>
                                        <Button
                                            title="Search for Rides"
                                            onPress={() => router.push('/(home)')}
                                            color="#4CAF50"
                                        />
                                    </>
                                )}
                            </View>
                        )}

                        {/* Available Rides Section */}
                        {hasSearchResults && groupedAvailableRides.length > 0 && (
                            <View style={{ marginBottom: 24 }}>
                                <TouchableOpacity onPress={() => toggleExpand('available')}>
                                    <View style={styles.sectionHeader}>
                                        <Text style={styles.sectionTitle}>Available Rides</Text>
                                        <FontAwesome5
                                            name={expandedSections.available ? "chevron-up" : "chevron-down"}
                                            size={16}
                                            color="black"
                                        />
                                    </View>
                                </TouchableOpacity>

                                {expandedSections.available && (
                                    <View style={styles.sectionContent}>
                                        {groupedAvailableRides.map(group => (
                                            <View key={`available-${group.date}`} style={styles.dateGroup}>
                                                <View style={styles.dateHeader}>
                                                    <FontAwesome5 name="calendar-alt" size={16} color="black" style={{ marginRight: 8 }} />
                                                    <Text style={styles.dateText}>{group.date}</Text>
                                                    <Text style={styles.timeRangeText}>{group.timeRange}</Text>
                                                </View>
                                                {group.rides.map(ride => (
                                                    <RideCard
                                                        key={ride._id}
                                                        ride={ride}
                                                        onPress={() => router.push(`/(rides)/${ride._id}`)}
                                                        isBooked={false}
                                                        availableSeats={ride.seats - (ride.booked_seats || 0)}
                                                    />
                                                ))}
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Full Rides Section */}
                        {hasSearchResults && groupedFullRides.length > 0 && (
                            <View style={{ marginBottom: 24 }}>
                                <TouchableOpacity onPress={() => toggleExpand('full')}>
                                    <View style={styles.sectionHeader}>
                                        <Text style={styles.sectionTitle}>Full Rides</Text>
                                        <FontAwesome5
                                            name={expandedSections.full ? "chevron-up" : "chevron-down"}
                                            size={16}
                                            color="black"
                                        />
                                    </View>
                                </TouchableOpacity>

                                {expandedSections.full && (
                                    <View style={styles.sectionContent}>
                                        {groupedFullRides.map(group => (
                                            <View key={`full-${group.date}`} style={styles.dateGroup}>
                                                <View style={styles.dateHeader}>
                                                    <FontAwesome5 name="calendar-alt" size={16} color="black" style={{ marginRight: 8 }} />
                                                    <Text style={styles.dateText}>{group.date}</Text>
                                                    <Text style={styles.timeRangeText}>{group.timeRange}</Text>
                                                </View>
                                                {group.rides.map(ride => (
                                                    <RideCard
                                                        key={ride._id}
                                                        ride={ride}
                                                        onPress={() => router.push(`/(rides)/${ride._id}`)}
                                                        isBooked={false}
                                                        availableSeats={0}
                                                        isFull
                                                    />
                                                ))}
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        )}
                    </>
                }
                ListFooterComponent={
                    <>
                        {/* Booked Rides Section - Show always if user has bookings */}
                        {hasBookings && (
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
                                        {allBookedRides.map(group => (
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
                                                        onPress={() => router.push(`/(rides)/${ride._id}`)}
                                                        isBooked={true}
                                                        availableSeats={ride.seats - (ride.booked_seats || 0)}
                                                        showCancelButton={false}
                                                    />
                                                ))}
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
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
});