import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, SafeAreaView, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import RideCard from '../../components/RideCard';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import ErrorDisplay from '../../components/ErrorDisplay';
import { LinearGradient } from 'expo-linear-gradient';

export default function PrivateRidesScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [expandedSections, setExpandedSections] = useState({
        available: true,
        myRides: true,
    });
    const [searchFrom, setSearchFrom] = useState('');
    const [searchTo, setSearchTo] = useState('');
    const [hasSearched, setHasSearched] = useState(false);

    // User's own private rides
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

        const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/rides/private`, {
            headers: { Authorization: `Bearer ${user.token}` },
        });

        return response.data.rides || [];
    });

    // Available private rides from other users
    const {
        data: availablePrivateRides,
        error: availableRidesError,
        isLoading: isLoadingAvailableRides,
        execute: fetchAvailablePrivateRides,
        retry: retryFetchAvailableRides
    } = useApi(async (searchParams = {}) => {
        if (!user?.id || !user?.token) {
            throw new Error('User ID or token missing');
        }

        const params = {};
        if (searchParams.from) params.from = searchParams.from;
        if (searchParams.to) params.to = searchParams.to;

        const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/rides/private/available`, {
            headers: { Authorization: `Bearer ${user.token}` },
            params
        });

        return response.data.rides || [];
    });

    useEffect(() => {
        if (user) {
            fetchPrivateRides();
        }
    }, [user]);

    const onRefresh = useCallback(async () => {
        try {
            const promises = [fetchPrivateRides()];

            // Only fetch available rides if user has searched
            if (hasSearched && (searchFrom || searchTo)) {
                promises.push(fetchAvailablePrivateRides({ from: searchFrom, to: searchTo }));
            }

            await Promise.all(promises);
        } catch (error) {
            console.error('Error refreshing:', error);
        }
    }, [searchFrom, searchTo, hasSearched]);

    const handleSearch = async () => {
        if (!searchFrom && !searchTo) {
            Alert.alert('Search Required', 'Please enter at least a departure or destination location to search for rides.');
            return;
        }

        try {
            setHasSearched(true);
            await fetchAvailablePrivateRides({ from: searchFrom, to: searchTo });
        } catch (error) {
            console.error('Search error:', error);
        }
    };

    const clearSearch = () => {
        setSearchFrom('');
        setSearchTo('');
        setHasSearched(false);
    };

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

    const handleDeleteRide = async (rideId) => {
        Alert.alert(
            "Delete Ride",
            "Are you sure you want to delete this ride?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {

                            await axios.delete(`${process.env.EXPO_PUBLIC_API_URL}/rides/${rideId}`, {
                                headers: { Authorization: `Bearer ${user.token}` },
                            });
                            // Refresh the rides list
                            fetchPrivateRides();
                        } catch (error) {

                            Alert.alert("Error", "Failed to delete ride. Please try again.");
                        }
                    }
                }
            ]
        );
    };

    const handleEditRide = (ride) => {
        router.push({
            pathname: '/(rides)/add-private-ride',
            params: {
                ride: JSON.stringify(ride)
            }
        });
    };

    if (privateRidesError) {
        return (
            <SafeAreaView style={styles.container}>
                <ErrorDisplay
                    error={privateRidesError}
                    onRetry={retryFetchPrivateRides}
                    title="Error Loading Private Rides"
                    message="We couldn't load your private rides at this time."
                    retryText="Retry"
                />
            </SafeAreaView>
        );
    }

    if (availableRidesError) {
        return (
            <SafeAreaView style={styles.container}>
                <ErrorDisplay
                    error={availableRidesError}
                    onRetry={retryFetchAvailableRides}
                    title="Error Loading Available Rides"
                    message="We couldn't load available private rides at this time."
                    retryText="Retry"
                />
            </SafeAreaView>
        );
    }

    const rides = Array.isArray(privateRides) ? privateRides : [];
    const availableRides = Array.isArray(availablePrivateRides) ? availablePrivateRides : [];

    const currentDate = new Date();

    const activeRides = rides.filter(ride => new Date(ride.departure_time) >= currentDate);
    const pastRides = rides.filter(ride => new Date(ride.departure_time) < currentDate);

    const groupedActiveRides = groupRidesByDate(activeRides);
    const groupedPastRides = groupRidesByDate(pastRides);
    const groupedAvailableRides = groupRidesByDate(availableRides);

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
                    <Text style={styles.headerTitle}>Private Rides</Text>
                    <TouchableOpacity onPress={() => router.push('/(rides)/add-private-ride')} style={styles.addButton}>
                        <FontAwesome5 name="plus" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={[]}
                    renderItem={null}
                    refreshControl={
                        <RefreshControl
                            refreshing={isLoadingPrivateRides || isLoadingAvailableRides}
                            onRefresh={onRefresh}
                            colors={['#4CAF50']}
                            tintColor='#4CAF50'
                        />
                    }
                    contentContainerStyle={styles.scrollContent}
                    ListHeaderComponent={
                        <View>
                            {/* Search Section for Available Private Rides */}
                            <View style={styles.searchSection}>
                                <Text style={styles.searchTitle}>Search Available Private Rides</Text>
                                <View style={styles.searchContainer}>
                                    <View style={styles.inputRow}>
                                        <View style={styles.inputWrapper}>
                                            <Ionicons name="location-outline" size={16} color="#666" />
                                            <TextInput
                                                style={styles.searchInput}
                                                placeholder="From..."
                                                value={searchFrom}
                                                onChangeText={setSearchFrom}
                                                placeholderTextColor="#999"
                                            />
                                        </View>
                                        <View style={styles.inputWrapper}>
                                            <Ionicons name="location" size={16} color="#666" />
                                            <TextInput
                                                style={styles.searchInput}
                                                placeholder="To..."
                                                value={searchTo}
                                                onChangeText={setSearchTo}
                                                placeholderTextColor="#999"
                                            />
                                        </View>
                                    </View>
                                    <View style={styles.searchButtons}>
                                        <TouchableOpacity
                                            style={styles.searchButton}
                                            onPress={handleSearch}
                                            disabled={isLoadingAvailableRides}
                                        >
                                            <Text style={styles.searchButtonText}>
                                                {isLoadingAvailableRides ? 'Searching...' : 'Search'}
                                            </Text>
                                        </TouchableOpacity>
                                        {(searchFrom || searchTo) && (
                                            <TouchableOpacity
                                                style={styles.clearButton}
                                                onPress={clearSearch}
                                            >
                                                <Text style={styles.clearButtonText}>Clear</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            </View>

                            {/* Available Private Rides Section */}
                            {hasSearched && groupedAvailableRides.length > 0 && (
                                <View style={styles.section}>
                                    <TouchableOpacity onPress={() => toggleExpand('available')}>
                                        <View style={styles.sectionHeader}>
                                            <Text style={styles.sectionTitle}>Available Private Rides ({availableRides.length})</Text>
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
                                                        <FontAwesome5 name="calendar-alt" size={14} color="#0a2472" />
                                                        <Text style={styles.dateTitle}>{group.date}</Text>
                                                    </View>

                                                    {group.rides.map((ride) => {
                                                        const availableSeats = ride.available_seats || (ride.seats - (ride.booked_seats || 0));
                                                        const statusDisplay = ride.statusDisplay || 'Available';

                                                        return (
                                                            <View key={ride._id} style={styles.rideCardContainer}>
                                                                <RideCard
                                                                    ride={ride}
                                                                    onPress={() => router.push(`/(rides)/${ride._id}`)}
                                                                    isPrivate={true}
                                                                    availableSeats={availableSeats}
                                                                    statusDisplay={statusDisplay}
                                                                    isFull={availableSeats === 0}
                                                                />
                                                                {ride.driver && (
                                                                    <View style={styles.driverInfo}>
                                                                        <FontAwesome5 name="user" size={12} color="#666" />
                                                                        <Text style={styles.driverText}>Driver: {ride.driver.name || ride.driver.email}</Text>
                                                                    </View>
                                                                )}
                                                            </View>
                                                        );
                                                    })}
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            )}

                            {hasSearched && availableRides.length === 0 && !isLoadingAvailableRides && (
                                <View style={styles.noResultsContainer}>
                                    <Text style={styles.noResultsText}>
                                        No private rides found matching your search criteria.
                                    </Text>
                                </View>
                            )}

                            {/* {!hasSearched && (
                                <View style={styles.searchPromptContainer}>
                                    <FontAwesome5 name="search" size={48} color="rgba(255, 255, 255, 0.6)" />
                                    <Text style={styles.searchPromptText}>
                                        Search for available private rides using the form above
                                    </Text>
                                </View>
                            )} */}

                            {groupedActiveRides.length > 0 && (
                                <View style={styles.section}>
                                    <TouchableOpacity onPress={() => toggleExpand('myRides')}>
                                        <View style={styles.sectionHeader}>
                                            <Text style={styles.sectionTitle}>My Rides ({activeRides.length})</Text>
                                            <FontAwesome5
                                                name={expandedSections.myRides ? 'chevron-up' : 'chevron-down'}
                                                size={16}
                                                color="#fff"
                                            />
                                        </View>
                                    </TouchableOpacity>

                                    {expandedSections.myRides && (
                                        <View style={styles.sectionContent}>
                                            {groupedActiveRides.map((group) => (
                                                <View key={`active-${group.date}`} style={styles.dateGroup}>
                                                    <View style={styles.myRideDateHeader}>
                                                        <FontAwesome5
                                                            name="calendar-alt"
                                                            size={16}
                                                            color="#0a2472"
                                                            style={styles.dateIcon}
                                                        />
                                                        <Text style={styles.myRideDateText}>{group.date}</Text>
                                                        <Text style={styles.myRideTimeRangeText}>{group.timeRange}</Text>
                                                    </View>
                                                    {group.rides.map((ride) => {
                                                        // Calculate ride status and available seats
                                                        const availableSeats = ride.seats - (ride.booked_seats || 0);
                                                        const getRideStatus = (ride) => {
                                                            if (ride.isPrivate) {
                                                                return ride.status === 'active' ? 'Available' : 'Inactive';
                                                            }
                                                            if (availableSeats === 0) return 'Full';
                                                            if (availableSeats <= ride.seats * 0.3) return 'Nearly Full';
                                                            return 'Available';
                                                        };
                                                        const statusDisplay = getRideStatus(ride);

                                                        return (
                                                            <View key={ride._id} style={styles.rideCardContainer}>
                                                                <RideCard
                                                                    ride={ride}
                                                                    onPress={() => { }} // Make unclickable
                                                                    isPrivate={true}
                                                                    availableSeats={availableSeats}
                                                                    statusDisplay={statusDisplay}
                                                                    isFull={availableSeats === 0}
                                                                />
                                                                <View style={styles.rideActions}>
                                                                    <TouchableOpacity
                                                                        style={[styles.actionButton, styles.editButton]}
                                                                        onPress={() => handleEditRide(ride)}
                                                                    >
                                                                        <FontAwesome5 name="edit" size={16} color="#fff" />
                                                                    </TouchableOpacity>
                                                                    <TouchableOpacity
                                                                        style={[styles.actionButton, styles.deleteButton]}
                                                                        onPress={() => handleDeleteRide(ride._id)}
                                                                    >
                                                                        <FontAwesome5 name="trash" size={16} color="#fff" />
                                                                    </TouchableOpacity>
                                                                </View>
                                                            </View>
                                                        );
                                                    })}
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            )}

                            {groupedPastRides.length > 0 && (
                                <View style={styles.section}>
                                    <TouchableOpacity onPress={() => toggleExpand('myRides')}>
                                        <View style={styles.sectionHeader}>
                                            <Text style={styles.sectionTitle}>Past Rides ({pastRides.length})</Text>
                                            <FontAwesome5
                                                name={expandedSections.myRides ? 'chevron-up' : 'chevron-down'}
                                                size={16}
                                                color="#fff"
                                            />
                                        </View>
                                    </TouchableOpacity>

                                    {expandedSections.myRides && (
                                        <View style={styles.sectionContent}>
                                            {groupedPastRides.map((group) => (
                                                <View key={`past-${group.date}`} style={styles.dateGroup}>
                                                    <View style={styles.myRideDateHeader}>
                                                        <FontAwesome5
                                                            name="calendar-alt"
                                                            size={16}
                                                            color="#0a2472"
                                                            style={styles.dateIcon}
                                                        />
                                                        <Text style={styles.myRideDateText}>{group.date}</Text>
                                                        <Text style={styles.myRideTimeRangeText}>{group.timeRange}</Text>
                                                    </View>
                                                    {group.rides.map((ride) => {
                                                        // Calculate ride status and available seats
                                                        const availableSeats = ride.seats - (ride.booked_seats || 0);
                                                        const getRideStatus = (ride) => {
                                                            if (ride.isPrivate) {
                                                                return ride.status === 'active' ? 'Available' : 'Inactive';
                                                            }
                                                            if (availableSeats === 0) return 'Full';
                                                            if (availableSeats <= ride.seats * 0.3) return 'Nearly Full';
                                                            return 'Available';
                                                        };
                                                        const statusDisplay = getRideStatus(ride);

                                                        return (
                                                            <View key={ride._id} style={styles.rideCardContainer}>
                                                                <RideCard
                                                                    ride={ride}
                                                                    onPress={() => { }} // Make unclickable
                                                                    isPrivate={true}
                                                                    availableSeats={availableSeats}
                                                                    statusDisplay={statusDisplay}
                                                                    isFull={availableSeats === 0}
                                                                />
                                                                <View style={styles.rideActions}>
                                                                    <TouchableOpacity
                                                                        style={[styles.actionButton, styles.editButton]}
                                                                        onPress={() => handleEditRide(ride)}
                                                                    >
                                                                        <FontAwesome5 name="edit" size={16} color="#fff" />
                                                                    </TouchableOpacity>
                                                                    <TouchableOpacity
                                                                        style={[styles.actionButton, styles.deleteButton]}
                                                                        onPress={() => handleDeleteRide(ride._id)}
                                                                    >
                                                                        <FontAwesome5 name="trash" size={16} color="#fff" />
                                                                    </TouchableOpacity>
                                                                </View>
                                                            </View>
                                                        );
                                                    })}
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            )}

                            {!groupedActiveRides.length && !groupedPastRides.length && (
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>No private rides found</Text>
                                    <TouchableOpacity
                                        style={styles.addButton}
                                        onPress={() => router.push('/(rides)/add-private-ride')}
                                    >
                                        <FontAwesome5 name="plus" size={16} color="#fff" style={styles.addIcon} />
                                        <Text style={styles.addButtonText}>Add Private Ride</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
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
    addButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
        textAlign: 'center',
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
        backgroundColor: '#0a2472',
        padding: 15,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    sectionContent: {
        padding: 15,
    },
    dateGroup: {
        marginBottom: 15,
    },
    dateHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        paddingBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    dateIcon: {
        marginRight: 8,
    },
    dateText: {
        fontWeight: 'bold',
        color: '#fff',
        marginRight: 12,
    },
    timeRangeText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 14,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 16,
        color: '#fff',
        marginBottom: 20,
        textAlign: 'center',
    },
    addIcon: {
        marginRight: 8,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#fff',
        fontSize: 16,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        backgroundColor: '#0a2472',
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    rideCardContainer: {
        marginBottom: 12,
    },
    rideActions: {
        position: 'absolute',
        right: 8,
        top: 8,
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
    editButton: {
        backgroundColor: '#007bff',
        padding: 8,
        borderRadius: 5,
        marginRight: 10,
    },
    deleteButton: {
        backgroundColor: '#dc3545',
    },
    scrollContent: {
        padding: 16,
    },
    driverInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        paddingLeft: 16,
    },
    driverText: {
        color: '#666',
        marginLeft: 8,
        fontSize: 12,
    },
    dateTitle: {
        fontWeight: 'bold',
        color: '#0a2472',
        marginLeft: 8,
        fontSize: 14,
    },
    searchSection: {
        marginBottom: 20,
    },
    searchTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
    },
    searchContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 10,
        padding: 15,
    },
    inputRow: {
        flexDirection: 'row',
        gap: 10,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    searchInput: {
        flex: 1,
        padding: 10,
        fontSize: 14,
        color: '#333',
    },
    searchButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 15,
        gap: 10,
    },
    searchButton: {
        backgroundColor: '#0a2472',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        flex: 1,
        alignItems: 'center',
    },
    searchButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    clearButton: {
        backgroundColor: '#dc3545',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
    },
    clearButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    noResultsContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    noResultsText: {
        fontSize: 16,
        color: '#fff',
        marginBottom: 20,
        textAlign: 'center',
    },
    myRideDateHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        paddingBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    myRideDateText: {
        fontWeight: 'bold',
        color: '#0a2472',
        marginRight: 12,
    },
    myRideTimeRangeText: {
        color: '#666',
        fontSize: 14,
    },
    searchPromptContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    searchPromptText: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.6)',
        marginTop: 20,
        textAlign: 'center',
    },
}); 