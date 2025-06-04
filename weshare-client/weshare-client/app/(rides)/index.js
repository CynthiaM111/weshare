import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, SafeAreaView, Modal, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import RideCard from '../../components/RideCard';
import { useLocalSearchParams } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import ErrorDisplay from '../../components/ErrorDisplay';

export default function RidesScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const params = useLocalSearchParams();
    const [searchResults, setSearchResults] = useState([]);
    const [expandedSections, setExpandedSections] = useState({
        available: true,
        full: true,
        booked: true,
    });
    const [selectedRide, setSelectedRide] = useState(null);

    const {
        data: userBookings,
        error: bookingsError,
        isLoading: isLoadingBookings,
        execute: fetchUserBookings,
        retry: retryFetchBookings
    } = useApi(async () => {
        if (!user?.id || !user?.token) {
            throw new Error('User ID or token missing');
        }
        const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/rides/booked`, {
            headers: { Authorization: `Bearer ${user.token}` },
        });
        return response.data;
    });

    const {
        data: privateRides,
        error: privateRidesError,
        isLoading: isLoadingPrivateRides,
        execute: fetchPrivateRides,
        retry: retryFetchPrivateRides
    } = useApi(async () => {
        if (!user?.id || !user?.token) {
            throw new Error('User ID or token missing');
        }
        const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/rides/private/user/${user.id}`, {
            headers: { Authorization: `Bearer ${user.token}` },
        });
        return response.data;
    });

    useEffect(() => {
        if (params.rides) {
            try {
                const parsedRides = JSON.parse(params.rides);
                setSearchResults(parsedRides);
            } catch (error) {
                console.error('Error parsing search results:', error);
            }
        }
    }, [params.rides]);

    useEffect(() => {
        if (user) {
            fetchUserBookings();
            fetchPrivateRides();
        }
    }, [user]);

    const onRefresh = useCallback(async () => {
        try {
            await Promise.all([
                fetchUserBookings(),
                fetchPrivateRides()
            ]);
            if (params.rides) {
                const parsedRides = JSON.parse(params.rides);
                setSearchResults(parsedRides);
            }
        } catch (error) {
            console.error('Error refreshing:', error);
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

    if (bookingsError) {
        return (
            <SafeAreaView style={styles.container}>
                <ErrorDisplay
                    error={bookingsError}
                    onRetry={retryFetchBookings}
                    title="Error Loading Bookings"
                    message="We couldn't load your booked rides at this time."
                    retryText="Retry"
                />
            </SafeAreaView>
        );
    }

    // Separate available rides and booked rides
    const bookedRideIds = new Set(userBookings?.map((ride) => ride._id) || []);
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
    const allBookedRides = groupRidesByDate(userBookings || []);
    const groupedPrivateRides = groupRidesByDate(privateRides || []);

    const hasSearchResults = searchResults.length > 0;
    const hasBookings = userBookings?.length > 0;

    return (
        <SafeAreaView style={{ flex: 1, padding: 16 }}>
            <FlatList
                data={[]}
                renderItem={null}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoadingBookings || isLoadingPrivateRides}
                        onRefresh={onRefresh}
                        colors={['#4CAF50']}
                        tintColor='#4CAF50'
                    />
                }
                contentContainerStyle={{ padding: 16 }}
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
                                                    />
                                                ))}
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        )}

                        {hasSearchResults && groupedBookedRides.length > 0 && (
                            <View style={styles.bookedContainer}>
                                <Text style={styles.bookedMessage}>🎉 You've already booked this ride!</Text>
                                <TouchableOpacity
                                    style={styles.bookedButton}
                                    onPress={() => router.push('/booked')}
                                >
                                    <FontAwesome5 name="ticket-alt" size={16} color="#fff" style={styles.bookedIcon} />
                                    <Text style={styles.bookedButtonText}>View Booked Rides</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {hasBookings && !groupedBookedRides.length > 0 && (
                            <View style={styles.bookedContainer}>
                                <TouchableOpacity
                                    style={styles.bookedButton}
                                    onPress={() => router.push('/booked')}
                                >
                                    <FontAwesome5 name="ticket-alt" size={16} color="#fff" style={styles.bookedIcon} />
                                    <Text style={styles.bookedButtonText}>View Booked Rides</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {user && (
                            <View style={styles.privateRidesContainer}>
                                <TouchableOpacity
                                    style={styles.privateRidesButton}
                                    onPress={() => router.push('/(rides)/private')}
                                >
                                    <FontAwesome5 name="car" size={16} color="#fff" style={styles.privateRidesIcon} />
                                    <Text style={styles.privateRidesButtonText}>View Your Private Rides</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </>
                }
            />
        </SafeAreaView>
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
        textAlign: 'center',
        marginLeft: 10,
        marginRight: 10,
    },
    bookedContainer: {
        marginTop: 20,
        alignItems: 'center',
        backgroundColor: '#F0F4FF',
        padding: 16,
        borderRadius: 12,
        borderColor: '#D1D5DB',
        borderWidth: 1,
    },

    bookedMessage: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 12,
        marginTop: 10,
        padding: 10,
    },

    bookedButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2563EB',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },

    bookedIcon: {
        marginRight: 8,
    },

    bookedButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff', // optional, but helps avoid transparency issues
    },
    privateRidesContainer: {
        marginTop: 12,
        alignItems: 'center',
    },
    privateRidesButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0a2472',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    privateRidesIcon: {
        marginRight: 8,
    },
    privateRidesButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});