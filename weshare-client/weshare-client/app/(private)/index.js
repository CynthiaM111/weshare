import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, SafeAreaView, TextInput, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import RideCard from '../../components/RideCard';
import DriverRideCard from '../../components/DriverRideCard';
import DriverRideDetail from '../../components/DriverRideDetail';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../../hooks/useApi';
// import ErrorDisplay from '../../components/ErrorDisplay';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomAlert from '../../components/CustomAlert';
import LocationPicker from '../../components/LocationPicker';
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/LanguageSwitcher';

export default function PrivateRidesScreen() {
    const { t } = useTranslation();

    // Function to translate status
    const translateStatus = (status) => {
        switch (status) {
            case 'Available':
                return t('common.status.available');
            case 'Nearly Full':
                return t('common.status.nearlyFull');
            case 'Full':
                return t('common.status.full');
            case 'Inactive':
                return t('common.status.inactive');
            case 'Completed':
                return t('common.status.completed');
            case 'Pending':
                return t('common.status.pending');
            default:
                return status;
        }
    };

    const router = useRouter();
    const { user } = useAuth();
    const [expandedSections, setExpandedSections] = useState({
        available: true,
        myRides: true,
        myBookings: true,
    });
    const [searchFrom, setSearchFrom] = useState('');
    const [searchTo, setSearchTo] = useState('');
    const [hasSearched, setHasSearched] = useState(false);
    const [recentSearches, setRecentSearches] = useState([]);

    // New state for driver ride detail modal
    const [selectedRideForDetail, setSelectedRideForDetail] = useState(null);
    const [detailModalVisible, setDetailModalVisible] = useState(false);

    // New state for ride options menu
    const [selectedRideForOptions, setSelectedRideForOptions] = useState(null);
    const [optionsModalVisible, setOptionsModalVisible] = useState(false);

    // Custom alert state
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({
        title: '',
        message: '',
        type: 'info',
        buttons: []
    });

    // Helper function to show custom alert
    const showAlert = (title, message, type = 'info', buttons = []) => {
        setAlertConfig({
            title,
            message,
            type,
            buttons
        });
        setAlertVisible(true);
    };

    // Helper function to hide alert
    const hideAlert = () => {
        setAlertVisible(false);
    };

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

    // Load recent searches
    const loadRecentSearches = useCallback(async () => {
        try {
            const userId = user?.id;
            if (!userId) {
                setRecentSearches([]);
                return;
            }

            const searches = await AsyncStorage.getItem(`privateRecentSearches_${userId}`);
            if (searches) {
                const parsedSearches = JSON.parse(searches);
                // Sort by frequency and get top 4
                const sortedSearches = Object.entries(parsedSearches)
                    .sort(([, a], [, b]) => b.count - a.count)
                    .slice(0, 4)
                    .map(([key, value]) => ({
                        from: value.from,
                        to: value.to,
                        count: value.count
                    }));
                setRecentSearches(sortedSearches);
            } else {
                setRecentSearches([]);
            }
        } catch (error) {
            console.error('Error loading recent searches:', error);
            setRecentSearches([]);
        }
    }, [user?.id]);

    // Update recent searches
    const updateRecentSearches = async (from, to) => {
        try {
            const userId = user?.id;
            if (!userId) return;

            const searches = await AsyncStorage.getItem(`privateRecentSearches_${userId}`);
            const parsedSearches = searches ? JSON.parse(searches) : {};
            const key = `${from}-${to}`;

            if (parsedSearches[key]) {
                parsedSearches[key].count += 1;
            } else {
                parsedSearches[key] = { from, to, count: 1 };
            }

            await AsyncStorage.setItem(`privateRecentSearches_${userId}`, JSON.stringify(parsedSearches));
            loadRecentSearches();
        } catch (error) {
            console.error('Error updating recent searches:', error);
        }
    };

    useEffect(() => {
        if (user) {
            fetchPrivateRides();
            loadRecentSearches();
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

    const handleSearch = async (prefilledFrom = searchFrom, prefilledTo = searchTo) => {
        if (!prefilledFrom && !prefilledTo) {
            showAlert(t('privateRides.errors.searchRequired'), t('privateRides.errors.searchRequiredMessage'), 'warning');
            return;
        }

        try {
            setHasSearched(true);
            await fetchAvailablePrivateRides({ from: prefilledFrom, to: prefilledTo });

            // Update recent searches if both from and to are provided
            if (prefilledFrom && prefilledTo) {
                await updateRecentSearches(prefilledFrom, prefilledTo);
            }
        } catch (error) {
            console.error('Search error:', error);
        }
    };

    const clearSearch = () => {
        setSearchFrom('');
        setSearchTo('');
        setHasSearched(false);
    };

    const handleRecentSearchPress = (search) => {
        setSearchFrom(search.from);
        setSearchTo(search.to);
        handleSearch(search.from, search.to);
    };

    // Handle opening ride detail modal
    const handleRideCardPress = (ride) => {
        setSelectedRideForDetail(ride);
        setDetailModalVisible(true);
    };

    // Handle closing ride detail modal
    const handleCloseDetailModal = () => {
        setDetailModalVisible(false);
        setSelectedRideForDetail(null);
    };

    // Handle opening ride options menu
    const handleRideOptionsPress = (ride) => {
        setSelectedRideForOptions(ride);
        setOptionsModalVisible(true);
    };

    // Handle closing ride options menu
    const handleCloseOptionsModal = () => {
        setOptionsModalVisible(false);
        setSelectedRideForOptions(null);
    };

    // Handle edit ride from options menu
    const handleEditRideFromOptions = () => {
        if (selectedRideForOptions) {
            handleEditRide(selectedRideForOptions);
        }
        handleCloseOptionsModal();
    };

    // Handle delete ride from options menu
    const handleDeleteRideFromOptions = () => {
        if (selectedRideForOptions) {
            handleDeleteRide(selectedRideForOptions._id);
        }
        handleCloseOptionsModal();
    };

    // Handle updating payment status
    const handleUpdatePaymentStatus = async (passengerId, paymentStatus) => {
        try {
            if (!selectedRideForDetail || !user?.token) {
                return;
            }

            const response = await axios.patch(
                `${process.env.EXPO_PUBLIC_API_URL}/rides/${selectedRideForDetail._id}/payment-status`,
                {
                    passengerId,
                    paymentStatus
                },
                {
                    headers: { Authorization: `Bearer ${user.token}` }
                }
            );

            // Update the local ride data
            if (selectedRideForDetail.bookedBy) {
                const updatedRide = {
                    ...selectedRideForDetail,
                    bookedBy: selectedRideForDetail.bookedBy.map(passenger =>
                        passenger.userId._id === passengerId
                            ? { ...passenger, paymentStatus }
                            : passenger
                    )
                };
                setSelectedRideForDetail(updatedRide);
            }

            // Refresh the rides list
            await fetchPrivateRides();

            showAlert(
                'Success',
                `Payment status updated to ${paymentStatus}`,
                'success'
            );
        } catch (error) {
            console.error('Error updating payment status:', error);
            showAlert(
                'Error',
                'Failed to update payment status. Please try again.',
                'error'
            );
        }
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
        showAlert(
            "Delete Ride",
            "Are you sure you want to delete this ride?",
            "warning",
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
                            showAlert("Error", "Failed to delete ride. Please try again.", "error");
                        }
                    }
                }
            ]
        );
    };

    const handleEditRide = (ride) => {
        router.push({
            pathname: '/(private)/add-private-ride',
            params: {
                ride: JSON.stringify(ride)
            }
        });
    };

    // GPS-based ride completion functions
    const handleStartRide = async (ride) => {
        try {
            // Request location permissions
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                showAlert(
                    'Location Permission Required',
                    'Please enable location access to start the ride.',
                    'warning'
                );
                return;
            }

            // Get current location
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            const { latitude, longitude } = location.coords;

            // Call API to start ride
            const response = await axios.post(
                `${process.env.EXPO_PUBLIC_API_URL}/rides/${ride._id}/start`,
                {
                    latitude,
                    longitude
                },
                {
                    headers: { Authorization: `Bearer ${user.token}` },
                }
            );

            // Show warning if location is far from origin
            if (response.data.warning) {
                showAlert(
                    'Location Warning',
                    response.data.warning,
                    'warning'
                );
            } else {
                showAlert(
                    'Ride Started',
                    'Your ride has been started successfully.',
                    'success'
                );
            }

            // Refresh the rides list
            fetchPrivateRides();

        } catch (error) {
            console.error('Error starting ride:', error);
            const errorMessage = error.response?.data?.error || 'Failed to start ride. Please try again.';
            showAlert('Error', errorMessage, 'error');
        }
    };

    const handleFinishRide = async (ride) => {
        try {
            // Request location permissions
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                showAlert(
                    'Location Permission Required',
                    'Please enable location access to finish the ride.',
                    'warning'
                );
                return;
            }

            // Get current location
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            const { latitude, longitude } = location.coords;

            // Call API to finish ride
            const response = await axios.post(
                `${process.env.EXPO_PUBLIC_API_URL}/rides/${ride._id}/finish`,
                {
                    latitude,
                    longitude
                },
                {
                    headers: { Authorization: `Bearer ${user.token}` },
                }
            );

            // Show warning if location is far from destination
            if (response.data.warning) {
                showAlert(
                    'Location Warning',
                    response.data.warning,
                    'warning'
                );
            } else {
                showAlert(
                    'Ride Completed',
                    `Ride completed successfully for ${response.data.completedPassengers} passenger(s).`,
                    'success'
                );
            }

            // Refresh the rides list
            fetchPrivateRides();

        } catch (error) {
            console.error('Error finishing ride:', error);
            const errorMessage = error.response?.data?.error || 'Failed to finish ride. Please try again.';
            showAlert('Error', errorMessage, 'error');
        }
    };

    useEffect(() => {
        if (privateRidesError) {
            showAlert(
                'Error Loading Private Rides',
                privateRidesError.userMessage || 'We encountered an error while loading your private rides. Please try again.',
                'error',
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
            showAlert(
                'Error Loading Available Rides',
                availableRidesError.userMessage || 'We encountered an error while loading available private rides. Please try again.',
                'error',
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

    // Check if user is authenticated - moved after all hooks
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
                        <Text style={styles.headerTitle}>{t('privateRides.header.title')}</Text>
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

    const groupedActiveRides = groupRidesByDate(activeRides);
    const groupedCompletedRides = groupRidesByDate(completedRides);
    const groupedAvailableRides = groupRidesByDate(availableRides);

    // Function to navigate to bookings screen
    const handleViewBookings = () => {
        router.push('/(rides)/booked');
    };

    return (
        <>
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
                        <Text style={styles.headerTitle}>{t('privateRides.header.title')}</Text>
                        <View style={styles.headerActions}>
                            <LanguageSwitcher style={styles.languageSwitcher} compact={true} />
                            <TouchableOpacity onPress={handleViewBookings} style={styles.bookingsButton}>
                                <FontAwesome5 name="ticket-alt" size={16} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => router.push('/(private)/private-history')} style={styles.historyButton}>
                                <FontAwesome5 name="history" size={18} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => router.push('/(private)/add-private-ride')} style={styles.addButton}>
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
                                    <Text style={styles.searchTitle}>{t('privateRides.search.title')}</Text>
                                    <View style={styles.searchContainer}>
                                        <View style={styles.inputColumn}>
                                            <View style={styles.inputWrapper}>
                                                <LocationPicker
                                                    value={searchFrom ? { name: searchFrom } : null}
                                                    onLocationSelect={(location) => setSearchFrom(location.name)}
                                                    placeholder={t('privateRides.search.fromPlaceholder')}
                                                    label=""
                                                    style={styles.locationPickerStyle}
                                                />
                                            </View>
                                            <View style={styles.inputWrapper}>
                                                <LocationPicker
                                                    value={searchTo ? { name: searchTo } : null}
                                                    onLocationSelect={(location) => setSearchTo(location.name)}
                                                    placeholder={t('privateRides.search.toPlaceholder')}
                                                    label=""
                                                    style={styles.locationPickerStyle}
                                                />
                                            </View>
                                        </View>
                                        <View style={styles.searchButtons}>
                                            <TouchableOpacity
                                                style={styles.searchButton}
                                                onPress={() => handleSearch()}
                                                disabled={isLoadingAvailableRides}
                                            >
                                                <Text style={styles.searchButtonText}>
                                                    {isLoadingAvailableRides ? t('privateRides.search.searching') : t('privateRides.search.searchButton')}
                                                </Text>
                                            </TouchableOpacity>
                                            {(searchFrom || searchTo) && (
                                                <TouchableOpacity
                                                    style={styles.clearButton}
                                                    onPress={clearSearch}
                                                >
                                                    <Text style={styles.clearButtonText}>{t('privateRides.search.clearButton')}</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                </View>

                                {/* Recent Searches Section */}
                                {recentSearches.length > 0 && !hasSearched && (
                                    <View style={styles.recentSearchesSection}>
                                        <Text style={styles.recentSearchesTitle}>{t('privateRides.recentSearches.title')}</Text>
                                        <View style={styles.recentSearchesList}>
                                            {recentSearches.map((search, index) => (
                                                <TouchableOpacity
                                                    key={index}
                                                    style={styles.recentSearchItem}
                                                    onPress={() => handleRecentSearchPress(search)}
                                                    activeOpacity={0.8}
                                                >
                                                    <View style={styles.recentSearchContent}>
                                                        <View style={styles.routeInfo}>
                                                            <Text style={styles.routeFrom}>{search.from}</Text>
                                                            <Ionicons name="arrow-forward" size={16} color="#94a3b8" />
                                                            <Text style={styles.routeTo}>{search.to}</Text>
                                                        </View>
                                                        <View style={styles.searchCount}>
                                                            <Ionicons name="time-outline" size={14} color="#64748b" />
                                                            <Text style={styles.countText}>{t('privateRides.recentSearches.times', { count: search.count })}</Text>
                                                        </View>
                                                    </View>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                )}

                                {/* Available Private Rides Section */}
                                {hasSearched && groupedAvailableRides.length > 0 && (
                                    <View style={styles.section}>
                                        <TouchableOpacity onPress={() => toggleExpand('available')}>
                                            <View style={styles.sectionHeader}>
                                                <Text style={styles.sectionTitle}>{t('privateRides.sections.availableRides.title')} ({availableRides.length})</Text>
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
                                                                        showDriverInfo={true}
                                                                    />
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
                                            {t('privateRides.emptyState.noSearchResults.subtitle')}
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

                                {/* My Rides Section */}
                                {groupedActiveRides.length > 0 && (
                                    <View style={styles.section}>
                                        <TouchableOpacity onPress={() => toggleExpand('myRides')}>
                                            <View style={styles.sectionHeader}>
                                                <Text style={styles.sectionTitle}>{t('privateRides.sections.myRides.title')} ({activeRides.length})</Text>
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
                                                    <View key={group.date} style={styles.dateGroup}>
                                                        <View style={styles.dateHeader}>
                                                            <FontAwesome5 name="calendar-alt" size={14} color="#6B7280" />
                                                            <Text style={styles.dateTitle}>{group.date}</Text>
                                                        </View>
                                                        {group.rides.map((ride) => {
                                                            const availableSeats = ride.seats - (ride.booked_seats || 0);
                                                            const getRideStatus = (ride) => {
                                                                if (ride.isPrivate) {
                                                                    return ride.status === 'active' ? translateStatus('Available') : translateStatus('Inactive');
                                                                }
                                                                if (availableSeats === 0) return translateStatus('Full');
                                                                if (availableSeats <= ride.seats * 0.3) return translateStatus('Nearly Full');
                                                                return translateStatus('Available');
                                                            };
                                                            const statusDisplay = getRideStatus(ride);

                                                            return (
                                                                <View key={ride._id} style={styles.rideCardWrapper}>
                                                                    <DriverRideCard
                                                                        ride={ride}
                                                                        onPress={() => handleRideCardPress(ride)}
                                                                        onStartRide={() => handleStartRide(ride)}
                                                                        onFinishRide={() => handleFinishRide(ride)}
                                                                    />
                                                                    <TouchableOpacity
                                                                        style={styles.optionsButton}
                                                                        onPress={() => handleRideOptionsPress(ride)}
                                                                    >
                                                                        <FontAwesome5 name="ellipsis-v" size={14} color="#6B7280" />
                                                                    </TouchableOpacity>
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
                                                            <FontAwesome5 name="calendar-alt" size={14} color="#6B7280" />
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
                                                                </View>
                                                            );
                                                        })}
                                                    </View>
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                )}

                                {/* My Bookings Section */}
                                <View style={styles.section}>
                                    <TouchableOpacity onPress={handleViewBookings}>
                                        <View style={styles.sectionHeader}>
                                            <Text style={styles.sectionTitle}>{t('privateRides.sections.myBookings.title')}</Text>
                                            <FontAwesome5
                                                name="arrow-right"
                                                size={16}
                                                color="#fff"
                                            />
                                        </View>
                                    </TouchableOpacity>

                                    <View style={styles.sectionContent}>
                                        <View style={styles.bookingsSummaryCard}>
                                            <View style={styles.bookingsSummaryHeader}>
                                                <FontAwesome5 name="ticket-alt" size={18} color="#6B7280" />
                                                <Text style={styles.bookingsSummaryTitle}>{t('privateRides.sections.myBookings.summaryTitle')}</Text>
                                            </View>
                                            <Text style={styles.bookingsSummaryText}>
                                                {t('privateRides.sections.myBookings.summaryText')}
                                            </Text>
                                            <TouchableOpacity
                                                style={styles.viewBookingsButton}
                                                onPress={handleViewBookings}
                                            >
                                                <FontAwesome5 name="external-link-alt" size={14} color="#fff" />
                                                <Text style={styles.viewBookingsButtonText}>{t('privateRides.sections.myBookings.viewButton')}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>

                                {!groupedActiveRides.length && !groupedCompletedRides.length && !groupedAvailableRides.length && (
                                    <View style={styles.emptyContainer}>
                                        <FontAwesome5 name="car" size={48} color="#D1D5DB" />
                                        <Text style={styles.emptyText}>{t('privateRides.emptyState.noRides.title')}</Text>
                                        <Text style={styles.emptySubtext}>{t('privateRides.emptyState.noRides.subtitle')}</Text>
                                        <TouchableOpacity
                                            style={styles.addButton}
                                            onPress={() => router.push('/(private)/add-private-ride')}
                                        >
                                            <FontAwesome5 name="plus" size={16} color="#fff" style={styles.addIcon} />
                                            <Text style={styles.addButtonText}>{t('privateRides.emptyState.noRides.button')}</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        }
                    />

                    {/* Ride Options Modal */}
                    <Modal
                        visible={optionsModalVisible}
                        transparent={true}
                        animationType="fade"
                        onRequestClose={handleCloseOptionsModal}
                    >
                        <TouchableOpacity
                            style={styles.optionsModalOverlay}
                            activeOpacity={1}
                            onPress={handleCloseOptionsModal}
                        >
                            <View style={styles.optionsModalContent}>
                                <View style={styles.optionsModalHeader}>
                                    <Text style={styles.optionsModalTitle}>Ride Options</Text>
                                    <TouchableOpacity onPress={handleCloseOptionsModal} style={styles.optionsCloseButton}>
                                        <FontAwesome5 name="times" size={16} color="#666" />
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity
                                    style={styles.optionItem}
                                    onPress={handleEditRideFromOptions}
                                >
                                    <FontAwesome5 name="edit" size={16} color="#007bff" />
                                    <Text style={styles.optionText}>Edit Ride</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.optionItem}
                                    onPress={handleDeleteRideFromOptions}
                                >
                                    <FontAwesome5 name="trash" size={16} color="#dc3545" />
                                    <Text style={[styles.optionText, styles.deleteOptionText]}>Delete Ride</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    </Modal>
                </SafeAreaView>
            </LinearGradient>

            {/* Driver Ride Detail Modal */}
            <DriverRideDetail
                visible={detailModalVisible}
                ride={selectedRideForDetail}
                onClose={handleCloseDetailModal}
                onUpdatePaymentStatus={handleUpdatePaymentStatus}
            />

            {/* Custom Alert */}
            <CustomAlert
                visible={alertVisible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                buttons={alertConfig.buttons}
                onDismiss={() => setAlertVisible(false)}
            />
        </>
    );
}

const styles = StyleSheet.create({
    backgroundGradient: {
        flex: 1,
    },
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        paddingTop: 20,
        backgroundColor: 'rgba(10, 36, 114, 0.95)',
        zIndex: 1000,
        elevation: 5,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
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
    bookingsButton: {
        padding: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    historyButton: {
        padding: 8,
    },
    section: {
        marginBottom: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#0a2472',
        padding: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        letterSpacing: 0.5,
    },
    sectionContent: {
        padding: 16,
    },
    dateGroup: {
        marginBottom: 20,
    },
    dateHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    dateTitle: {
        fontWeight: '600',
        color: '#374151',
        marginLeft: 8,
        fontSize: 14,
        letterSpacing: 0.5,
    },
    dateText: {
        fontWeight: '600',
        color: '#0a2472',
        marginRight: 12,
    },
    timeRangeText: {
        color: '#6B7280',
        fontSize: 14,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        backgroundColor: '#fff',
        borderRadius: 12,
        margin: 16,
    },
    emptyText: {
        fontSize: 16,
        color: '#6B7280',
        marginBottom: 20,
        textAlign: 'center',
        fontWeight: '500',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#9CA3AF',
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
    rideCardWrapper: {
        position: 'relative',
        marginBottom: 12,
    },
    optionsButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        zIndex: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
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
    inputColumn: {
        flexDirection: 'column',
        gap: 10,
    },
    inputWrapper: {
        flex: 1,
        marginBottom: 10,
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
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        gap: 10,
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
    passengersSection: {
        backgroundColor: '#F9FAFB',
        padding: 12,
        margin: 0,
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
    },
    passengersSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        flexWrap: 'wrap',
        gap: 8,
    },
    passengersSectionTitle: {
        fontWeight: '600',
        color: '#374151',
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        flex: 1,
        minWidth: 120,
    },
    rideCompletedBadge: {
        backgroundColor: '#10B981',
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
        backgroundColor: '#F59E0B',
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
        padding: 12,
        backgroundColor: '#ffffff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
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
        color: '#374151',
        fontSize: 14,
        flex: 1,
        fontWeight: '500',
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
        backgroundColor: '#8B5CF6',
    },
    checkedInBadge: {
        backgroundColor: '#3B82F6',
    },
    pendingBadge: {
        backgroundColor: '#F59E0B',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 4,
        paddingLeft: 22,
    },
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
    recentSearchesSection: {
        marginBottom: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 12,
        overflow: 'hidden',
        padding: 15,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    recentSearchesTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0a2472',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    recentSearchesList: {
        gap: 8,
    },
    recentSearchItem: {
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    recentSearchContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    routeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    routeFrom: {
        fontSize: 14,
        color: '#1e293b',
        fontWeight: '600',
    },
    routeTo: {
        fontSize: 14,
        color: '#1e293b',
        fontWeight: '600',
        marginLeft: 8,
    },
    searchCount: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    countText: {
        fontSize: 12,
        color: '#64748b',
        marginLeft: 4,
        fontWeight: '500',
    },
    locationPickerStyle: {
        marginBottom: 0,
        flex: 1,
    },
    optionsModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionsModalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 0,
        width: '85%',
        maxWidth: 320,
        shadowColor: '#0a2472',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 12,
        borderWidth: 1,
        borderColor: '#e8f4fd',
    },
    optionsModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        backgroundColor: 'rgba(10, 36, 114, 0.05)',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    optionsModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0a2472',
    },
    optionsCloseButton: {
        padding: 6,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        backgroundColor: '#fff',
    },
    optionText: {
        fontSize: 16,
        color: '#374151',
        marginLeft: 14,
        fontWeight: '500',
    },
    deleteOptionText: {
        color: '#dc3545',
        fontWeight: '600',
    },
    bookingsSummaryCard: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 20,
        marginTop: 15,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    bookingsSummaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    bookingsSummaryTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginLeft: 10,
    },
    bookingsSummaryText: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 15,
        lineHeight: 22,
    },
    viewBookingsButton: {
        backgroundColor: '#0a2472',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    viewBookingsButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
}); 