import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, SafeAreaView, Alert, TextInput, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import RideCard from '../../components/RideCard';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../../hooks/useApi';
// import ErrorDisplay from '../../components/ErrorDisplay';
import { LinearGradient } from 'expo-linear-gradient';

export default function PrivateRidesScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [expandedSections, setExpandedSections] = useState({
        available: true,
        myRides: true,
        completed: true,
    });
    const [searchFrom, setSearchFrom] = useState('');
    const [searchTo, setSearchTo] = useState('');
    const [hasSearched, setHasSearched] = useState(false);
    const [pinModalVisible, setPinModalVisible] = useState(false);
    const [pinInput, setPinInput] = useState('');
    const [selectedRideForCompletion, setSelectedRideForCompletion] = useState(null);
    const [selectedPassenger, setSelectedPassenger] = useState(null);

    // Check if user is authenticated
    if (!user) {
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
                        <View style={styles.headerPlaceholder} />
                    </View>

                    <View style={styles.loginPromptContainer}>
                        <View style={styles.loginPromptCard}>
                            <View style={styles.loginPromptIcon}>
                                <FontAwesome5 name="lock" size={48} color="#0a2472" />
                            </View>
                            <Text style={styles.loginPromptTitle}>Login Required</Text>
                            <Text style={styles.loginPromptText}>
                                Please login to access private rides and book your journey.
                            </Text>
                            <TouchableOpacity
                                style={styles.loginPromptButton}
                                onPress={() => router.push('/(auth)/login')}
                            >
                                <FontAwesome5 name="sign-in-alt" size={16} color="#fff" />
                                <Text style={styles.loginPromptButtonText}>LOGIN / SIGN UP</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        );
    }

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

    const handleCompleteRideWithPin = (ride, passenger) => {
        setSelectedRideForCompletion(ride);
        setSelectedPassenger(passenger);
        setPinModalVisible(true);
    };

    const submitPinCompletion = async () => {
        if (pinInput.length !== 6) {
            Alert.alert('Invalid PIN', 'Please enter a 6-digit PIN');
            return;
        }

        try {
            // Get the correct passenger user ID
            const passengerUserId = selectedPassenger.userId._id || selectedPassenger.userId;

            console.log('Submitting PIN completion:', {
                rideId: selectedRideForCompletion._id,
                pin: pinInput,
                passengerUserId: passengerUserId,
                passenger: selectedPassenger
            });

            const response = await axios.post(
                `${process.env.EXPO_PUBLIC_API_URL}/rides/${selectedRideForCompletion._id}/complete-with-pin`,
                {
                    pin: pinInput,
                    passengerUserId: passengerUserId
                },
                {
                    headers: { Authorization: `Bearer ${user.token}` },
                }
            );

            const passengerName = selectedPassenger.userId?.name || selectedPassenger.userId?.email || 'the passenger';
            Alert.alert('Success', `Ride completed for ${passengerName}`);

            // Reset modal state
            setPinModalVisible(false);
            setPinInput('');
            setSelectedRideForCompletion(null);
            setSelectedPassenger(null);

            // Refresh the rides list
            fetchPrivateRides();

        } catch (error) {
            console.error('Error completing ride with PIN:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);

            const errorMessage = error.response?.data?.error || 'Failed to complete ride with PIN';
            Alert.alert('Error', errorMessage);
        }
    };

    useEffect(() => {
        if (privateRidesError) {
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

    useEffect(() => {
        if (availableRidesError) {
            Alert.alert(
                'Error Loading Available Rides',
                availableRidesError.userMessage || 'We encountered an error while loading available private rides. Please try again.',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel'
                    },
                    {
                        text: 'Retry',
                        onPress: () => retryFetchAvailableRides()
                    }
                ]
            );
        }
    }, [availableRidesError]);

    const rides = Array.isArray(privateRides) ? privateRides : [];
    const availableRides = Array.isArray(availablePrivateRides) ? availablePrivateRides : [];

    const currentDate = new Date();

    const activeRides = rides.filter(ride =>
        new Date(ride.departure_time) >= currentDate &&
        ride.computedStatus !== 'completed'
    );

    const completedRides = rides.filter(ride =>
        ride.computedStatus === 'completed' ||
        (ride.bookedBy && ride.bookedBy.length > 0 && ride.allPassengersCompleted)
    );

    const pastRides = rides.filter(ride =>
        new Date(ride.departure_time) < currentDate &&
        ride.computedStatus !== 'completed' &&
        !(ride.bookedBy && ride.bookedBy.length > 0 && ride.allPassengersCompleted)
    );

    const groupedActiveRides = groupRidesByDate(activeRides);
    const groupedCompletedRides = groupRidesByDate(completedRides);
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
                    <View style={styles.headerActions}>
                        <TouchableOpacity onPress={() => router.push('/(rides)/private-history')} style={styles.historyButton}>
                            <FontAwesome5 name="history" size={18} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => router.push('/(rides)/add-private-ride')} style={styles.addButton}>
                            <FontAwesome5 name="plus" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
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

                                                                {/* Show booked passengers */}
                                                                {ride.bookedBy && ride.bookedBy.length > 0 && (
                                                                    <View style={styles.passengersSection}>
                                                                        <View style={styles.passengersSectionHeader}>
                                                                            <Text style={styles.passengersSectionTitle}>
                                                                                Booked Passengers ({ride.bookedBy.length})
                                                                            </Text>
                                                                            {ride.allPassengersCompleted && (
                                                                                <View style={styles.rideCompletedBadge}>
                                                                                    <FontAwesome5 name="check-circle" size={12} color="#fff" />
                                                                                    <Text style={styles.rideCompletedText}>Ride Completed</Text>
                                                                                </View>
                                                                            )}
                                                                            {ride.somePassengersCompleted && !ride.allPassengersCompleted && (
                                                                                <View style={styles.partialCompletedBadge}>
                                                                                    <FontAwesome5 name="clock" size={12} color="#fff" />
                                                                                    <Text style={styles.partialCompletedText}>
                                                                                        {ride.completedPassengers}/{ride.bookedBy.length} Completed
                                                                                    </Text>
                                                                                </View>
                                                                            )}
                                                                        </View>
                                                                        {ride.bookedBy.map((booking, index) => {
                                                                            const passenger = booking.userId || booking;
                                                                            const passengerName = passenger.name || passenger.email || `Passenger ${index + 1}`;
                                                                            const checkInStatus = booking.checkInStatus || 'pending';

                                                                            return (
                                                                                <View key={booking.bookingId || index} style={styles.passengerContainer}>
                                                                                    <View style={styles.passengerRow}>
                                                                                        <View style={styles.passengerInfo}>
                                                                                            <FontAwesome5 name="user" size={14} color="#666" />
                                                                                            <Text style={styles.passengerName}>{passengerName}</Text>
                                                                                        </View>
                                                                                        <View style={[
                                                                                            styles.statusBadge,
                                                                                            checkInStatus === 'completed' ? styles.completedBadge :
                                                                                                checkInStatus === 'checked-in' ? styles.checkedInBadge :
                                                                                                    styles.pendingBadge
                                                                                        ]}>
                                                                                            <Text style={styles.statusBadgeText}>
                                                                                                {checkInStatus === 'completed' ? 'Completed' :
                                                                                                    checkInStatus === 'checked-in' ? 'Checked In' :
                                                                                                        'Pending'}
                                                                                            </Text>
                                                                                        </View>
                                                                                    </View>
                                                                                    {checkInStatus !== 'completed' && !ride.allPassengersCompleted && (
                                                                                        <View style={styles.buttonRow}>
                                                                                            <TouchableOpacity
                                                                                                style={styles.completePinButton}
                                                                                                onPress={() => handleCompleteRideWithPin(ride, booking)}
                                                                                            >
                                                                                                <FontAwesome5 name="key" size={12} color="#fff" />
                                                                                                <Text style={styles.completePinButtonText}>Complete with PIN</Text>
                                                                                            </TouchableOpacity>
                                                                                        </View>
                                                                                    )}
                                                                                </View>
                                                                            );
                                                                        })}
                                                                    </View>
                                                                )}

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

                            {groupedCompletedRides.length > 0 && (
                                <View style={styles.section}>
                                    <TouchableOpacity onPress={() => toggleExpand('completed')}>
                                        <View style={styles.sectionHeader}>
                                            <Text style={styles.sectionTitle}>Completed Rides ({completedRides.length})</Text>
                                            <FontAwesome5
                                                name={expandedSections.completed ? 'chevron-up' : 'chevron-down'}
                                                size={16}
                                                color="#fff"
                                            />
                                        </View>
                                    </TouchableOpacity>

                                    {expandedSections.completed && (
                                        <View style={styles.sectionContent}>
                                            {groupedCompletedRides.map((group) => (
                                                <View key={`completed-${group.date}`} style={styles.dateGroup}>
                                                    <View style={styles.dateHeader}>
                                                        <FontAwesome5 name="calendar-alt" size={14} color="#0a2472" />
                                                        <Text style={styles.dateTitle}>{group.date}</Text>
                                                    </View>

                                                    {group.rides.map((ride) => {
                                                        const availableSeats = ride.available_seats || (ride.seats - (ride.booked_seats || 0));
                                                        const statusDisplay = ride.statusDisplay || 'Completed';

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

                                                                {/* Show booked passengers for past rides */}
                                                                {ride.bookedBy && ride.bookedBy.length > 0 && (
                                                                    <View style={styles.passengersSection}>
                                                                        <Text style={styles.passengersSectionTitle}>Passengers ({ride.bookedBy.length})</Text>
                                                                        {ride.bookedBy.map((booking, index) => {
                                                                            const passenger = booking.userId || booking;
                                                                            const passengerName = passenger.name || passenger.email || `Passenger ${index + 1}`;
                                                                            const checkInStatus = booking.checkInStatus || 'pending';

                                                                            return (
                                                                                <View key={booking.bookingId || index} style={styles.passengerContainer}>
                                                                                    <View style={styles.passengerRow}>
                                                                                        <View style={styles.passengerInfo}>
                                                                                            <FontAwesome5 name="user" size={14} color="#666" />
                                                                                            <Text style={styles.passengerName}>{passengerName}</Text>
                                                                                        </View>
                                                                                        <View style={[
                                                                                            styles.statusBadge,
                                                                                            checkInStatus === 'completed' ? styles.completedBadge :
                                                                                                checkInStatus === 'checked-in' ? styles.checkedInBadge :
                                                                                                    styles.pendingBadge
                                                                                        ]}>
                                                                                            <Text style={styles.statusBadgeText}>
                                                                                                {checkInStatus === 'completed' ? 'Completed' :
                                                                                                    checkInStatus === 'checked-in' ? 'Checked In' :
                                                                                                        'Pending'}
                                                                                            </Text>
                                                                                        </View>
                                                                                    </View>
                                                                                </View>
                                                                            );
                                                                        })}
                                                                    </View>
                                                                )}

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

                            {!groupedActiveRides.length && !groupedCompletedRides.length && !groupedPastRides.length && (
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

                <Modal
                    visible={pinModalVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setPinModalVisible(false)}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <FontAwesome5 name="key" size={48} color="#4CAF50" style={styles.modalIcon} />
                            <Text style={styles.modalTitle}>Complete Ride with PIN</Text>
                            <Text style={styles.pinSubtitle}>
                                {selectedPassenger ?
                                    `Enter the PIN provided by ${selectedPassenger.userId?.name || selectedPassenger.userId?.email || 'the passenger'}` :
                                    'Enter the PIN provided by the passenger'
                                }
                            </Text>
                            <TextInput
                                style={styles.pinInput}
                                value={pinInput}
                                onChangeText={setPinInput}
                                placeholder="Enter 6-digit PIN"
                                placeholderTextColor="#999"
                                keyboardType="numeric"
                                maxLength={6}
                                autoFocus={true}
                            />
                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={styles.cancelModalButton}
                                    onPress={() => {
                                        setPinModalVisible(false);
                                        setPinInput('');
                                        setSelectedRideForCompletion(null);
                                        setSelectedPassenger(null);
                                    }}
                                >
                                    <Text style={styles.cancelModalButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.submitPinButton, pinInput.length !== 6 && styles.disabledButton]}
                                    onPress={submitPinCompletion}
                                    disabled={pinInput.length !== 6}
                                >
                                    <Text style={styles.submitPinButtonText}>Complete Ride</Text>
                                </TouchableOpacity>
                            </View>
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
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    historyButton: {
        padding: 8,
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
        marginBottom: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 16,
        paddingBottom: 8,
    },
    dateHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 8,
        borderBottomWidth: 2,
        borderBottomColor: 'rgba(255, 255, 255, 0.3)',
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
        marginBottom: 32,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 0,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        borderWidth: 1,
        borderColor: '#e0e0e0',
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
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        width: '80%',
        alignItems: 'center',
    },
    modalIcon: {
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0a2472',
        marginBottom: 10,
    },
    pinSubtitle: {
        color: '#666',
        fontSize: 14,
        marginBottom: 20,
        textAlign: 'center',
    },
    pinInput: {
        width: '100%',
        padding: 15,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        marginBottom: 20,
        fontSize: 18,
        textAlign: 'center',
        letterSpacing: 5,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        gap: 10,
    },
    cancelModalButton: {
        backgroundColor: '#dc3545',
        padding: 12,
        borderRadius: 5,
        flex: 1,
        alignItems: 'center',
    },
    cancelModalButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    submitPinButton: {
        backgroundColor: '#4CAF50',
        padding: 12,
        borderRadius: 5,
        flex: 1,
        alignItems: 'center',
    },
    submitPinButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
    passengersSection: {
        backgroundColor: '#f8f9fa',
        padding: 12,
        margin: 0,
        marginTop: 8,
        borderTopWidth: 2,
        borderTopColor: '#e0e0e0',
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
        borderLeftWidth: 0,
    },
    passengersSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#d1d5db',
        flexWrap: 'wrap',
        gap: 8,
    },
    passengersSectionTitle: {
        fontWeight: 'bold',
        color: '#0a2472',
        fontSize: 16,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        flex: 1,
        minWidth: 120,
    },
    rideCompletedBadge: {
        backgroundColor: '#38a169',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        maxWidth: 120,
    },
    rideCompletedText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: 'bold',
        marginLeft: 3,
        flexShrink: 1,
    },
    partialCompletedBadge: {
        backgroundColor: '#ff8c00',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        maxWidth: 100,
    },
    partialCompletedText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: 'bold',
        marginLeft: 3,
        flexShrink: 1,
    },
    passengerContainer: {
        marginBottom: 8,
        padding: 8,
        backgroundColor: '#ffffff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    passengerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    passengerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    passengerName: {
        marginLeft: 8,
        color: '#333',
        fontSize: 14,
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 8,
    },
    statusBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#fff',
    },
    completedBadge: {
        backgroundColor: '#805ad5',
    },
    checkedInBadge: {
        backgroundColor: '#3182ce',
    },
    pendingBadge: {
        backgroundColor: '#ff8c00',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 4,
        paddingLeft: 22,
    },
    completePinButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        flexDirection: 'row',
        alignItems: 'center',
    },
    completePinButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
    // Login prompt styles
    loginPromptContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    loginPromptCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
        maxWidth: 350,
        width: '100%',
    },
    loginPromptIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(10, 36, 114, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    loginPromptTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0a2472',
        marginBottom: 12,
        textAlign: 'center',
    },
    loginPromptText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 30,
    },
    loginPromptButton: {
        backgroundColor: '#0a2472',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#0a2472',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    loginPromptButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
}); 