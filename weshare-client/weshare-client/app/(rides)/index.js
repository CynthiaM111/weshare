import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, SafeAreaView, Modal, ScrollView, Alert, StatusBar, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import RideCard from '../../components/RideCard';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../../hooks/useApi';
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

            if (params.rides) {
                const parsedRides = JSON.parse(params.rides);
                setSearchResults(parsedRides);
            }
        } catch (error) {
            console.error('Error during refresh:', error);
        }
    }, [params.rides, user]);

    const groupRidesByDate = (ridesToGroup) => {
        // Handle undefined, null, or non-array values
        if (!ridesToGroup || !Array.isArray(ridesToGroup)) {
            return [];
        }

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

    const handleRidePress = useCallback((rideId) => {
        router.push(`/(rides)/${rideId}`);
    }, [router]);

    const handleToggleExpand = useCallback((section) => {
        setExpandedSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    }, []);

    const handleSearchPress = useCallback(() => {
        router.push('/(home)');
    }, [router]);

    const handleBookedPress = useCallback(() => {
        router.push('/(rides)/booked');
    }, [router]);

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

    // Separate available rides and booked rides
    // Filter out missed rides from active bookings as they should not appear in search results
    const bookedRideIds = useMemo(() => new Set(
        (userBookings || []).filter(ride => ride.checkInStatus !== 'missed').map((ride) => ride._id) || []
    ), [userBookings]);

    const availableRides = useMemo(() => (searchResults || []).filter(
        (ride) => !bookedRideIds.has(ride._id) && ride.available_seats > 0
    ), [searchResults, bookedRideIds]);

    const bookedRidesFromSearch = useMemo(() => (searchResults || []).filter((ride) => bookedRideIds.has(ride._id)), [searchResults, bookedRideIds]);

    const fullRides = useMemo(() => (searchResults || []).filter(
        (ride) => !bookedRideIds.has(ride._id) && ride.available_seats <= 0
    ), [searchResults, bookedRideIds]);

    const groupedAvailableRides = useMemo(() => groupRidesByDate(availableRides), [availableRides]);
    const groupedBookedRides = useMemo(() => groupRidesByDate(bookedRidesFromSearch), [bookedRidesFromSearch]);
    const groupedFullRides = useMemo(() => groupRidesByDate(fullRides), [fullRides]);
    const allBookedRides = useMemo(() => groupRidesByDate((userBookings || []).filter(ride => ride.checkInStatus !== 'missed')), [userBookings]);

    const hasSearchResults = useMemo(() => (searchResults || []).length > 0, [searchResults]);
    const hasBookings = useMemo(() => (userBookings || []).filter(ride => ride.checkInStatus !== 'missed').length > 0, [userBookings]);
    const hasSearched = useMemo(() => params.rides !== undefined, [params.rides]); // User performed a search if params.rides is set
    const hasEmptySearchResults = useMemo(() => hasSearched && !hasSearchResults, [hasSearched, hasSearchResults]); // User searched but got no results

    const renderRideCard = useCallback(({ item: ride, isBooked = false, isFull = false }) => (
        <RideCard
            key={ride._id}
            ride={ride}
            onPress={() => handleRidePress(ride._id)}
            isBooked={isBooked}
            availableSeats={ride.available_seats}
            statusDisplay={ride.statusDisplay}
            isFull={isFull}
        />
    ), [handleRidePress]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#3b82f6" />

            {/* Header with Gradient */}
            <LinearGradient
                colors={['#3b82f6', '#1d4ed8', '#1e40af']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerGradient}
            >
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <View style={styles.headerLeft}>
                            <View style={styles.headerIconContainer}>
                                <Ionicons name="car-sport" size={32} color="#fbbf24" />
                            </View>
                            <View>
                                <Text style={styles.headerTitle}>Available Rides</Text>
                                <Text style={styles.headerSubtitle}>
                                    {hasSearchResults ? `${(searchResults || []).length} rides found` : 'Find your perfect ride'}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.headerRight}>
                            <Ionicons name="star" size={20} color="#fbbf24" />
                        </View>
                    </View>
                </View>
            </LinearGradient>

            <FlatList
                data={[]}
                renderItem={null}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoadingBookings}
                        onRefresh={onRefresh}
                        colors={['#3b82f6']}
                        tintColor='#3b82f6'
                    />
                }
                contentContainerStyle={styles.scrollContent}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                windowSize={10}
                initialNumToRender={5}
                updateCellsBatchingPeriod={50}
                getItemLayout={undefined}
                keyExtractor={(item, index) => index.toString()}
                ListHeaderComponent={
                    <>
                        {/* No search performed yet */}
                        {!hasSearched && (
                            <View style={styles.emptySearchContainer}>
                                <View style={styles.emptySearchIcon}>
                                    <Text style={styles.emptySearchEmoji}>🎯</Text>
                                </View>
                                <Text style={styles.welcomeTitle}>
                                    {hasBookings ? "Ready for your next adventure?" : "Welcome to WeShare!"}
                                </Text>
                                <Text style={styles.emptySearchText}>
                                    {hasBookings
                                        ? "Search for rides to discover new destinations and connect with fellow travelers."
                                        : 'Find shared rides to your destination and start your journey with us.'}
                                </Text>
                                <LinearGradient
                                    colors={['#3b82f6', '#1d4ed8']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.searchButtonGradient}
                                >
                                    <TouchableOpacity
                                        style={styles.searchButton}
                                        onPress={handleSearchPress}
                                    >
                                        <Ionicons name="search" size={20} color="#fff" />
                                        <Text style={styles.searchButtonText}>Search for Rides</Text>
                                    </TouchableOpacity>
                                </LinearGradient>
                            </View>
                        )}

                        {/* User searched but no results found */}
                        {hasEmptySearchResults && (
                            <View style={styles.noResultsContainer}>
                                <View style={styles.noResultsIcon}>
                                    <Text style={styles.noResultsEmoji}>🔍</Text>
                                </View>
                                <Text style={styles.noResultsTitle}>No rides found</Text>
                                <Text style={styles.noResultsText}>
                                    We couldn't find any rides matching your search criteria. Try adjusting your search or check back later.
                                </Text>
                                <LinearGradient
                                    colors={['#3b82f6', '#1d4ed8']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.newSearchButtonGradient}
                                >
                                    <TouchableOpacity
                                        style={styles.newSearchButton}
                                        onPress={handleSearchPress}
                                    >
                                        <Ionicons name="search" size={20} color="#fff" />
                                        <Text style={styles.newSearchText}>Try New Search</Text>
                                    </TouchableOpacity>
                                </LinearGradient>

                                {/* Quick action buttons for empty results */}
                                {user && (
                                    <View style={styles.emptyResultsActionsRow}>
                                        {hasBookings && (
                                            <TouchableOpacity
                                                style={styles.emptyResultButton}
                                                onPress={handleBookedPress}
                                            >
                                                <Ionicons name="ticket" size={16} color="#3b82f6" />
                                                <Text style={styles.emptyResultButtonText}>My Bookings</Text>
                                            </TouchableOpacity>
                                        )}
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
                                        <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                                        <Text style={styles.bookedNoticeText}>Already booked</Text>
                                    </View>
                                )}

                                {/* Action buttons */}
                                <View style={styles.quickActionsRow}>
                                    {hasBookings && (
                                        <TouchableOpacity
                                            style={styles.compactButton}
                                            onPress={handleBookedPress}
                                        >
                                            <Ionicons name="ticket" size={16} color="#3b82f6" />
                                            <Text style={styles.compactButtonText}>Bookings</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        )}

                        {hasSearchResults && groupedAvailableRides.length > 0 && (
                            <View style={styles.section}>
                                <TouchableOpacity onPress={() => handleToggleExpand('available')}>
                                    <LinearGradient
                                        colors={['#10b981', '#059669']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.sectionHeaderGradient}
                                    >
                                        <View style={styles.sectionHeader}>
                                            <View style={styles.sectionHeaderLeft}>
                                                <Text style={styles.sectionEmoji}>✅</Text>
                                                <Text style={styles.sectionTitle}>Available Rides ({(availableRides || []).length})</Text>
                                            </View>
                                            <Ionicons
                                                name={expandedSections.available ? 'chevron-up' : 'chevron-down'}
                                                size={16}
                                                color="#fff"
                                            />
                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>

                                {expandedSections.available && (
                                    <View style={styles.sectionContent}>
                                        {groupedAvailableRides.map((group) => (
                                            <View key={`available-${group.date}`} style={styles.dateGroup}>
                                                <View style={styles.dateHeader}>
                                                    <Ionicons
                                                        name="calendar"
                                                        size={16}
                                                        color="#3b82f6"
                                                        style={{ marginRight: 8 }}
                                                    />
                                                    <Text style={styles.dateText}>{group.date}</Text>
                                                    <Text style={styles.timeRangeText}>{group.timeRange}</Text>
                                                </View>
                                                {group.rides.map((ride) => (
                                                    <View key={ride._id}>
                                                        {renderRideCard({ item: ride, isBooked: false })}
                                                    </View>
                                                ))}
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        )}

                        {hasSearchResults && groupedFullRides.length > 0 && (
                            <View style={styles.section}>
                                <TouchableOpacity onPress={() => handleToggleExpand('full')}>
                                    <LinearGradient
                                        colors={['#ef4444', '#dc2626']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.sectionHeaderGradient}
                                    >
                                        <View style={styles.sectionHeader}>
                                            <View style={styles.sectionHeaderLeft}>
                                                <Text style={styles.sectionEmoji}>🚫</Text>
                                                <Text style={styles.sectionTitle}>Full Rides ({(fullRides || []).length})</Text>
                                            </View>
                                            <Ionicons
                                                name={expandedSections.full ? 'chevron-up' : 'chevron-down'}
                                                size={16}
                                                color="#fff"
                                            />
                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>

                                {expandedSections.full && (
                                    <View style={styles.sectionContent}>
                                        {groupedFullRides.map((group) => (
                                            <View key={`full-${group.date}`} style={styles.dateGroup}>
                                                <View style={styles.dateHeader}>
                                                    <Ionicons
                                                        name="calendar"
                                                        size={16}
                                                        color="#3b82f6"
                                                        style={{ marginRight: 8 }}
                                                    />
                                                    <Text style={styles.dateText}>{group.date}</Text>
                                                    <Text style={styles.timeRangeText}>{group.timeRange}</Text>
                                                </View>
                                                {group.rides.map((ride) => (
                                                    <View key={ride._id}>
                                                        {renderRideCard({ item: ride, isBooked: false, isFull: true })}
                                                    </View>
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
                                <LinearGradient
                                    colors={['#3b82f6', '#1d4ed8']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.bookedButtonGradient}
                                >
                                    <TouchableOpacity
                                        style={styles.bookedButton}
                                        onPress={handleBookedPress}
                                    >
                                        <Ionicons name="ticket" size={20} color="#fff" />
                                        <Text style={styles.bookedButtonText}>View Booked Rides</Text>
                                    </TouchableOpacity>
                                </LinearGradient>
                            </View>
                        )}
                    </>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    headerGradient: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        minHeight: 140,
    },
    header: {
        flex: 1,
        justifyContent: 'center',
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 16,
    },
    headerRight: {
        padding: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 12,
        minWidth: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerIconContainer: {
        marginRight: 12,
        padding: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 48,
        minHeight: 48,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#ffffff',
        marginBottom: 4,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '500',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    emptySearchContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        marginBottom: 20,
        backgroundColor: '#ffffff',
        borderRadius: 24,
        marginHorizontal: 8,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 8,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    emptySearchIcon: {
        marginBottom: 20,
        padding: 20,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderRadius: 60,
    },
    emptySearchEmoji: {
        fontSize: 48,
    },
    welcomeTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#1f2937',
        marginBottom: 12,
        textAlign: 'center',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    },
    emptySearchText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#6b7280',
        marginBottom: 32,
        lineHeight: 24,
        paddingHorizontal: 8,
        fontWeight: '500',
    },
    searchButtonGradient: {
        borderRadius: 16,
        padding: 3,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    searchButton: {
        backgroundColor: 'transparent',
        paddingVertical: 18,
        paddingHorizontal: 32,
        borderRadius: 13,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginLeft: 8,
    },
    section: {
        marginBottom: 20,
        backgroundColor: '#ffffff',
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    sectionHeaderGradient: {
        borderRadius: 0,
        padding: 0,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 18,
    },
    sectionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionEmoji: {
        fontSize: 20,
        marginRight: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    },
    sectionContent: {
        padding: 20,
    },
    dateGroup: {
        marginBottom: 20,
        backgroundColor: '#f8fafc',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    dateHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    dateText: {
        fontWeight: '700',
        marginRight: 12,
        color: '#1f2937',
        fontSize: 16,
    },
    timeRangeText: {
        color: '#6b7280',
        fontSize: 14,
        fontWeight: '500',
    },
    actionButtonsContainer: {
        marginTop: 16,
        alignItems: 'center',
        backgroundColor: '#ffffff',
        padding: 24,
        borderRadius: 20,
        marginHorizontal: 8,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    bookedButtonGradient: {
        borderRadius: 16,
        padding: 3,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    bookedButton: {
        backgroundColor: 'transparent',
        paddingVertical: 18,
        paddingHorizontal: 28,
        borderRadius: 13,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bookedButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        marginLeft: 8,
    },
    topActionsContainer: {
        marginBottom: 24,
        alignItems: 'center',
        backgroundColor: '#ffffff',
        padding: 24,
        borderRadius: 20,
        marginHorizontal: 8,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    bookedNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    bookedNoticeText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#065f46',
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
        backgroundColor: '#f8fafc',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        minWidth: 120,
        justifyContent: 'center',
        flex: 1,
        maxWidth: 140,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    compactButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1f2937',
        marginLeft: 8,
    },
    noResultsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        marginBottom: 20,
        backgroundColor: '#ffffff',
        borderRadius: 24,
        marginHorizontal: 8,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 8,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    noResultsIcon: {
        marginBottom: 20,
        padding: 20,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 60,
    },
    noResultsEmoji: {
        fontSize: 48,
    },
    noResultsTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1f2937',
        marginBottom: 12,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    },
    noResultsText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#6b7280',
        marginBottom: 24,
        lineHeight: 24,
        fontWeight: '500',
    },
    newSearchButtonGradient: {
        borderRadius: 16,
        padding: 3,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    newSearchButton: {
        backgroundColor: 'transparent',
        paddingVertical: 18,
        paddingHorizontal: 28,
        borderRadius: 13,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    newSearchText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginLeft: 8,
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
        backgroundColor: '#f8fafc',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        minWidth: 120,
        justifyContent: 'center',
        flex: 1,
        maxWidth: 140,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    emptyResultButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1f2937',
        marginLeft: 8,
    },
});