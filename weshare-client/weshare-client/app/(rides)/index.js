import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, SafeAreaView, Modal, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import RideCard from '../../components/RideCard';
import { useLocalSearchParams } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../../hooks/useApi';
// import ErrorDisplay from '../../components/ErrorDisplay';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';

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
            return;
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
            return;
        }
        const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/rides/private/user/${user.id}`, {
            headers: { Authorization: `Bearer ${user?.token}` },
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
                setSearchResults([]);
            }
        }
    }, [params.rides]);

    useEffect(() => {
        if (user?.id && user?.token) {
            fetchUserBookings();
            fetchPrivateRides();
        }
    }, [user]);

    // Auto-refresh when screen is focused to show updated data after booking
    useFocusEffect(
        useCallback(() => {
            if (user?.id && user?.token) {
                // Handle each API call separately to avoid crashes if one fails
                fetchUserBookings().catch(error => {
                    // Only log warnings for actual errors, not NOT_FOUND
                    if (error.code !== 'NOT_FOUND' && error.response?.status !== 404) {
                        console.warn('✅ Refreshed user bookings on focus');
                    }
                });

                fetchPrivateRides().catch(error => {
                    // Only log warnings for actual errors, not NOT_FOUND  
                    if (error.code !== 'NOT_FOUND' && error.response?.status !== 404) {
                        console.warn('✅ Refreshed private rides on focus');
                    }
                });

                // Refresh search results if they exist
                if (params.rides) {
                    try {
                        const parsedRides = JSON.parse(params.rides);
                        setSearchResults(parsedRides);
                    } catch (error) {
                        console.error('Error parsing search results:', error);
                    }
                }
            }
        }, [user, params.rides])
    );

    const onRefresh = useCallback(async () => {
        if (!user?.id || !user?.token) {
            return;
        }

        try {
            // Handle each API call separately to avoid crashes if one fails
            try {
                await fetchUserBookings();
            } catch (error) {
                if (error.code !== 'NOT_FOUND' && error.response?.status !== 404) {
                    console.warn('✅ Refreshed user bookings during pull refresh');
                }
            }

            try {
                await fetchPrivateRides();
            } catch (error) {
                if (error.code !== 'NOT_FOUND' && error.response?.status !== 404) {
                    console.warn('✅ Refreshed private rides during pull refresh');
                }
            }

            if (params.rides) {
                const parsedRides = JSON.parse(params.rides);
                setSearchResults(parsedRides);
            }
        } catch (error) {
            console.error('Error during refresh:', error);
        }
    }, [params.rides, user]);

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

    useEffect(() => {
        if (bookingsError && bookingsError.statusCode !== 404) {
            Alert.alert(
                'Error Loading Bookings',
                bookingsError.userMessage || 'We encountered an error while loading your booked rides. Please try again.',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel'
                    },
                    {
                        text: 'Retry',
                        onPress: () => retryFetchBookings()
                    }
                ]
            );
        }
    }, [bookingsError]);

    useEffect(() => {
        if (privateRidesError && privateRidesError.statusCode !== 404) {
            Alert.alert(
                'Error Loading Private Rides',
                privateRidesError.userMessage || 'We encountered an error while loading your private rides. Please try again.',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel'
                    },
                    {
                        text: 'Retry',
                        onPress: () => retryFetchPrivateRides()
                    }
                ]
            );
        }
    }, [privateRidesError]);

    // Separate available rides and booked rides
    // Filter out missed rides from active bookings as they should not appear in search results
    const bookedRideIds = new Set(
        userBookings?.filter(ride => ride.checkInStatus !== 'missed').map((ride) => ride._id) || []
    );
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
    const allBookedRides = groupRidesByDate(userBookings?.filter(ride => ride.checkInStatus !== 'missed') || []);
    const groupedPrivateRides = groupRidesByDate(privateRides || []);

    const hasSearchResults = searchResults.length > 0;
    const hasBookings = userBookings?.filter(ride => ride.checkInStatus !== 'missed').length > 0;
    const hasSearched = params.rides !== undefined; // User performed a search if params.rides is set
    const hasEmptySearchResults = hasSearched && !hasSearchResults; // User searched but got no results

    return (
        <LinearGradient
            colors={['#0a2472', '#1E90FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.backgroundGradient}
        >
            <SafeAreaView style={styles.container}>
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
                    contentContainerStyle={styles.scrollContent}
                    ListHeaderComponent={
                        <>
                            {/* No search performed yet */}
                            {!hasSearched && (
                                <View style={styles.emptySearchContainer}>
                                    <View style={styles.emptySearchIcon}>
                                        <FontAwesome5 name="route" size={56} color="#2196F3" />
                                    </View>
                                    <Text style={styles.welcomeTitle}>
                                        {hasBookings ? "Ready for your next adventure?" : "Welcome to WeShare!"}
                                    </Text>
                                    <Text style={styles.emptySearchText}>
                                        {hasBookings
                                            ? "Search for rides to discover new destinations and connect with fellow travelers."
                                            : 'Find shared rides to your destination and start your journey with us.'}
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.searchButton}
                                        onPress={() => router.push('/(home)')}
                                    >
                                        <FontAwesome5
                                            name="search"
                                            size={16}
                                            color="#fff"
                                            style={styles.searchIcon}
                                        />
                                        <Text style={styles.searchButtonText}>Search for Rides</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* User searched but no results found */}
                            {hasEmptySearchResults && (
                                <View style={styles.noResultsContainer}>
                                    <View style={styles.noResultsIcon}>
                                        <FontAwesome5 name="search-minus" size={52} color="#FF6B6B" />
                                    </View>
                                    <Text style={styles.noResultsTitle}>No rides found</Text>
                                    <Text style={styles.noResultsText}>
                                        We couldn't find any rides matching your search criteria. Try adjusting your search or check back later.
                                    </Text>
                                    <View style={styles.noResultsActions}>
                                        <TouchableOpacity
                                            style={styles.newSearchButton}
                                            onPress={() => router.push('/(home)')}
                                        >
                                            <FontAwesome5
                                                name="search"
                                                size={16}
                                                color="#fff"
                                                style={styles.newSearchIcon}
                                            />
                                            <Text style={styles.newSearchText}>Try New Search</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* Quick action buttons for empty results */}
                                    {user && (
                                        <View style={styles.emptyResultsActionsRow}>
                                            {hasBookings && (
                                                <TouchableOpacity
                                                    style={styles.emptyResultButton}
                                                    onPress={() => router.push('/(rides)/booked')}
                                                >
                                                    <FontAwesome5 name="ticket-alt" size={14} color="#2563EB" />
                                                    <Text style={styles.emptyResultButtonText}>My Bookings</Text>
                                                </TouchableOpacity>
                                            )}
                                            <TouchableOpacity
                                                style={styles.emptyResultButton}
                                                onPress={() => router.push('/(rides)/private')}
                                            >
                                                <FontAwesome5 name="car" size={14} color="#0a2472" />
                                                <Text style={styles.emptyResultButtonText}>My Rides</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            )}

                            {/* All action buttons and status messages at the top for better visibility */}
                            {hasSearchResults && (
                                <View style={styles.topActionsContainer}>
                                    {/* Already booked message */}
                                    {groupedBookedRides.length > 0 && (
                                        <View style={styles.bookedNotice}>
                                            <FontAwesome5 name="check-circle" size={18} color="#4CAF50" />
                                            <Text style={styles.bookedNoticeText}>Already booked</Text>
                                        </View>
                                    )}

                                    {/* Action buttons */}
                                    <View style={styles.quickActionsRow}>
                                        {hasBookings && (
                                            <TouchableOpacity
                                                style={styles.compactButton}
                                                onPress={() => router.push('/(rides)/booked')}
                                            >
                                                <FontAwesome5 name="ticket-alt" size={14} color="#2563EB" />
                                                <Text style={styles.compactButtonText}>Bookings</Text>
                                            </TouchableOpacity>
                                        )}
                                        {user && (
                                            <TouchableOpacity
                                                style={styles.compactButton}
                                                onPress={() => router.push('/(rides)/private')}
                                            >
                                                <FontAwesome5 name="car" size={14} color="#0a2472" />
                                                <Text style={styles.compactButtonText}>My Rides</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            )}

                            {hasSearchResults && groupedAvailableRides.length > 0 && (
                                <View style={styles.section}>
                                    <TouchableOpacity onPress={() => toggleExpand('available')}>
                                        <View style={styles.sectionHeader}>
                                            <View style={styles.sectionHeaderLeft}>
                                                <FontAwesome5 name="car" size={20} color="#fff" />
                                                <Text style={styles.sectionTitle}>Available Rides ({availableRides.length})</Text>
                                            </View>
                                            <FontAwesome5
                                                name={expandedSections.available ? 'chevron-up' : 'chevron-down'}
                                                size={16}
                                                color="#fff"
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
                                                            color="#0a2472"
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
                                <View style={styles.section}>
                                    <TouchableOpacity onPress={() => toggleExpand('full')}>
                                        <View style={[styles.sectionHeader, { backgroundColor: '#FF6B6B' }]}>
                                            <View style={styles.sectionHeaderLeft}>
                                                <FontAwesome5 name="ban" size={20} color="#fff" />
                                                <Text style={styles.sectionTitle}>Full Rides ({fullRides.length})</Text>
                                            </View>
                                            <FontAwesome5
                                                name={expandedSections.full ? 'chevron-up' : 'chevron-down'}
                                                size={16}
                                                color="#fff"
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
                                                            color="#0a2472"
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

                            {/* Show action buttons at bottom only when there are no search results */}
                            {!hasSearched && hasBookings && (
                                <View style={styles.actionButtonsContainer}>
                                    <TouchableOpacity
                                        style={styles.bookedButton}
                                        onPress={() => router.push('/(rides)/booked')}
                                    >
                                        <FontAwesome5 name="ticket-alt" size={16} color="#fff" style={styles.bookedIcon} />
                                        <Text style={styles.bookedButtonText}>View Booked Rides</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {!hasSearched && user && (
                                <View style={styles.actionButtonsContainer}>
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
    scrollContent: {
        padding: 16,
    },
    emptySearchContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        marginBottom: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderRadius: 20,
        marginHorizontal: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
    },
    emptySearchIcon: {
        marginBottom: 20,
        padding: 16,
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        borderRadius: 50,
    },
    welcomeTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 12,
        textAlign: 'center',
    },
    emptySearchText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#6B7280',
        marginBottom: 28,
        lineHeight: 24,
        paddingHorizontal: 8,
    },
    section: {
        marginBottom: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#2196F3',
    },
    sectionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginLeft: 10,
    },
    sectionContent: {
        padding: 16,
    },
    dateGroup: {
        marginBottom: 16,
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
    },
    dateHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    dateText: {
        fontWeight: '600',
        marginRight: 12,
        color: '#0a2472',
        fontSize: 14,
    },
    timeRangeText: {
        color: '#6c757d',
        fontSize: 12,
    },
    searchButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2196F3',
        paddingVertical: 14,
        paddingHorizontal: 28,
        borderRadius: 30,
        elevation: 4,
        shadowColor: '#2196F3',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    actionButtonsContainer: {
        marginTop: 12,
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: 20,
        borderRadius: 16,
        marginHorizontal: 8,
    },
    bookedButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2563EB',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
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
    privateRidesButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0a2472',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
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
    topActionsContainer: {
        marginBottom: 20,
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: 20,
        borderRadius: 16,
        marginHorizontal: 8,
    },
    bookedNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    bookedNoticeText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginLeft: 8,
    },
    quickActionsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        gap: 16,
    },
    compactButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        minWidth: 100,
        justifyContent: 'center',
        flex: 1,
        maxWidth: 120,
    },
    compactButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0a2472',
        marginLeft: 6,
    },
    noResultsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        marginBottom: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 16,
        marginHorizontal: 8,
    },
    noResultsIcon: {
        marginBottom: 16,
    },
    noResultsTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 12,
    },
    noResultsText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
        lineHeight: 24,
    },
    noResultsActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        gap: 16,
        marginBottom: 24,
    },
    newSearchButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2196F3',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    newSearchIcon: {
        marginRight: 8,
    },
    newSearchText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    emptyResultsActionsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        gap: 16,
    },
    emptyResultButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        minWidth: 100,
        justifyContent: 'center',
        flex: 1,
        maxWidth: 120,
    },
    emptyResultButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0a2472',
        marginLeft: 6,
    },
});