import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, Modal, Animated, TextInput } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useApi } from '../../hooks/useApi';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

// Memoized booking item component for better performance
const BookingItem = React.memo(({ item, onCheckIn, isCheckingIn }) => {
    const handleCheckIn = useCallback(() => {
        try {
            if (item && onCheckIn) {
                onCheckIn(item);
            }
        } catch (error) {
            console.warn('Error in handleCheckIn:', error);
        }
    }, [item, onCheckIn]);

    // Safety check for item
    if (!item || typeof item !== 'object') {
        return null;
    }

    const isCheckedIn = item.status === 'checked_in' || item.status === 'checked-in';

    return (
        <View style={[styles.bookingCard, isCheckedIn && styles.checkedInCard]}>
            <View style={styles.bookingHeader}>
                <View style={styles.passengerInfo}>
                    <View style={[styles.avatarContainer, isCheckedIn && styles.checkedInAvatar]}>
                        <Ionicons name="person" size={20} color="#fff" />
                    </View>
                    <View style={styles.passengerDetails}>
                        <Text style={[styles.passengerName, isCheckedIn && styles.checkedInText]}>
                            {item.passenger?.name || 'Unknown Passenger'}
                        </Text>
                        {item.passenger?.email && (
                            <Text style={[styles.passengerEmail, isCheckedIn && styles.checkedInSubtext]}>
                                {item.passenger.email}
                            </Text>
                        )}
                    </View>
                </View>
                <View style={[styles.bookingStatus, isCheckedIn && styles.checkedInStatus]}>
                    <Ionicons
                        name={isCheckedIn ? "checkmark-circle" : "time-outline"}
                        size={16}
                        color={isCheckedIn ? "#4CAF50" : "#0a2472"}
                    />
                    <Text style={[styles.bookingStatusText, isCheckedIn && styles.checkedInStatusText]}>
                        {isCheckedIn ? 'Checked In' : 'Not Checked In'}
                    </Text>
                </View>
            </View>

            {!isCheckedIn && (
                <TouchableOpacity
                    style={[styles.checkInButton, styles.manualCheckInButton]}
                    onPress={handleCheckIn}
                    disabled={isCheckingIn}
                    activeOpacity={0.8}
                >
                    <Ionicons name="checkmark" size={16} color="#fff" />
                    <Text style={styles.checkInText}>Check In</Text>
                </TouchableOpacity>
            )}
        </View>
    );
});

// Memoized ride item component for better performance
const RideItem = React.memo(({ item, onStartCheckIn, onStartManualCheckIn, isCheckingIn }) => {
    const handleStartCheckIn = useCallback(() => {
        try {
            if (item?._id && onStartCheckIn) {
                onStartCheckIn(item._id);
            }
        } catch (error) {
            console.warn('Error in handleStartCheckIn:', error);
        }
    }, [item?._id, onStartCheckIn]);

    const handleStartManualCheckIn = useCallback(() => {
        try {
            if (item?._id && onStartManualCheckIn) {
                onStartManualCheckIn(item._id);
            }
        } catch (error) {
            console.warn('Error in handleStartManualCheckIn:', error);
        }
    }, [item?._id, onStartManualCheckIn]);

    // Safety check for item
    if (!item || typeof item !== 'object') {
        return null;
    }

    const availableSeats = (item.seats || 0) - (item.booked_seats || 0);

    // Determine status and color based on seat availability
    const getStatusInfo = () => {
        const totalSeats = item.seats || 0;
        const bookedSeats = item.booked_seats || 0;
        const available = totalSeats - bookedSeats;
        const occupancyRate = (bookedSeats / totalSeats) * 100;

        if (available === 0) {
            return { status: 'Full', color: '#F56565', backgroundColor: 'rgba(245, 101, 101, 0.15)' };
        } else if (occupancyRate >= 80) {
            return { status: 'Nearly Full', color: '#FF9800', backgroundColor: 'rgba(255, 152, 0, 0.15)' };
        } else {
            return { status: 'Available', color: '#4CAF50', backgroundColor: 'rgba(76, 175, 80, 0.15)' };
        }
    };

    const statusInfo = getStatusInfo();

    return (
        <View style={styles.rideCard}>
            <View style={styles.cardHeader}>
                <View style={styles.routeContainer}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="location-outline" size={20} color="#fff" />
                    </View>
                    <Text style={styles.routeText}>
                        {item.categoryId?.from || 'Unknown'} → {item.categoryId?.to || 'Unknown'}
                    </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusInfo.backgroundColor }]}>
                    <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.status}</Text>
                </View>
            </View>

            <View style={styles.timeContainer}>
                <View style={styles.timeItem}>
                    <Ionicons name="calendar-outline" size={18} color="#0a2472" />
                    <Text style={styles.timeText}>
                        {item.departure_time ? new Date(item.departure_time).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                        }) : 'Unknown'}
                    </Text>
                </View>
                <View style={styles.timeItem}>
                    <Ionicons name="time-outline" size={18} color="#0a2472" />
                    <Text style={styles.timeText}>
                        {item.departure_time ? new Date(item.departure_time).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                        }) : 'Unknown'}
                    </Text>
                </View>
            </View>

            <View style={styles.seatsContainer}>
                <View style={styles.seatInfo}>
                    <Ionicons name="people-outline" size={16} color="#0a2472" />
                    <Text style={styles.seatText}>
                        {availableSeats}/{item.seats || 0} seats available
                    </Text>
                </View>
            </View>

            <View style={styles.buttonGroup}>
                <TouchableOpacity
                    style={[styles.checkInButton, styles.qrButton, isCheckingIn && styles.buttonDisabled]}
                    onPress={handleStartCheckIn}
                    disabled={isCheckingIn}
                    activeOpacity={0.8}
                >
                    <FontAwesome5 name="qrcode" size={16} color="#fff" />
                    <Text style={styles.checkInText}>QR Scan</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.checkInButton, styles.manualButton, isCheckingIn && styles.buttonDisabled]}
                    onPress={handleStartManualCheckIn}
                    disabled={isCheckingIn}
                    activeOpacity={0.8}
                >
                    <Ionicons name="search" size={16} color="#fff" />
                    <Text style={styles.checkInText}>Manual</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
});

export default function EmployeeHomeScreen() {
    const [scannerVisible, setScannerVisible] = useState(false);
    const [manualCheckInVisible, setManualCheckInVisible] = useState(false);
    const [currentRideId, setCurrentRideId] = useState(null);
    const [scannedPassenger, setScannedPassenger] = useState(null);
    const [cameraReady, setCameraReady] = useState(false);
    const [facing, setFacing] = useState('back');
    const [permission, requestPermission] = useCameraPermissions();
    const [scanLinePosition] = useState(new Animated.Value(0));
    const [scanError, setScanError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [filteredBookings, setFilteredBookings] = useState([]);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [hasError, setHasError] = useState(false);

    const {
        data: rides,
        error: ridesError,
        isLoading: isLoadingRides,
        execute: fetchRides,
        retry: retryFetchRides
    } = useApi(async () => {
        const token = await AsyncStorage.getItem('token');
        const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/rides/employee`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    });

    const {
        data: rideBookings,
        error: bookingsError,
        isLoading: isLoadingBookings,
        execute: fetchRideBookings,
        retry: retryFetchBookings
    } = useApi(async (rideId) => {
        const token = await AsyncStorage.getItem('token');
        const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/rides/${rideId}/bookings`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    });

    const {
        error: checkInError,
        isLoading: isCheckingIn,
        execute: checkInPassenger,
        retry: retryCheckIn
    } = useApi(async ({ rideId, userId, bookingId }) => {
        const token = await AsyncStorage.getItem('token');
        const response = await axios.post(
            `${process.env.EXPO_PUBLIC_API_URL}/rides/check-in`,
            { rideId, userId, bookingId },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    });

    // Animate scanning line
    useEffect(() => {
        if (scannerVisible && cameraReady) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(scanLinePosition, {
                        toValue: 230,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(scanLinePosition, {
                        toValue: 0,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }
    }, [scannerVisible, cameraReady, scanLinePosition]);

    // Fetch rides effect
    useEffect(() => {
        fetchRides();
    }, []);

    // Debounced search query to prevent excessive filtering
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 300); // 300ms delay

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Memoized filtered bookings to prevent unnecessary re-computation
    const memoizedFilteredBookings = useMemo(() => {
        if (rideBookings && debouncedSearchQuery.trim()) {
            return rideBookings.filter(booking => {
                const passengerName = booking.passenger?.name || '';
                const passengerEmail = booking.passenger?.email || '';
                const query = debouncedSearchQuery.toLowerCase();

                return passengerName.toLowerCase().includes(query) ||
                    passengerEmail.toLowerCase().includes(query);
            });
        }
        return rideBookings || [];
    }, [rideBookings, debouncedSearchQuery]);

    // Filter bookings based on search query
    useEffect(() => {
        setFilteredBookings(memoizedFilteredBookings);
    }, [memoizedFilteredBookings]);

    const handleCheckIn = async (rideId, userId, bookingId) => {
        try {
            const result = await checkInPassenger({ rideId, userId, bookingId });
            setScannedPassenger({
                name: result.passenger.name,
                email: result.passenger.email,
            });
            setScanError(null);
            // Refresh bookings after successful check-in
            if (currentRideId) {
                fetchRideBookings(currentRideId);
            }
        } catch (error) {
            console.error('Check-in error:', error);
            setScannedPassenger(null);
            setScannerVisible(false);
            setManualCheckInVisible(false);
        }
    };

    const handleBarCodeScanned = useCallback(({ type, data }) => {
        if (!cameraReady || !scannerVisible || isCheckingIn) {
            return;
        }

        try {
            const parsedData = JSON.parse(data);
            const { rideId, userId, bookingId } = parsedData;

            if (!rideId || !userId || !bookingId) {
                throw Object.assign(new Error('Missing data in QR code'), {
                    userMessage: 'This QR code is missing required ride or user information.'
                });
            }

            if (rideId !== currentRideId) {
                const err = new Error('QR code does not match the current ride');
                err.userMessage = 'This QR code is for a different ride. Please scan the correct code.';
                throw err;
            }

            const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);
            if (!isValidObjectId(rideId) || !isValidObjectId(userId)) {
                throw Object.assign(new Error('Invalid format'), {
                    userMessage: 'The QR code contains invalid ride or user IDs.'
                });
            }

            handleCheckIn(rideId, userId, bookingId);
        } catch (error) {
            setScannedPassenger(null);
            setScannerVisible(false);
            setScanError(error);
        }
    }, [cameraReady, scannerVisible, currentRideId, isCheckingIn]);

    const startCheckIn = (rideId) => {
        setCurrentRideId(rideId);
        setScannedPassenger(null);
        setScannerVisible(true);
        setCameraReady(false);
    };

    const startManualCheckIn = async (rideId) => {
        setCurrentRideId(rideId);
        setSearchQuery('');
        setSelectedBooking(null);
        setManualCheckInVisible(true);
        await fetchRideBookings(rideId);
    };

    const handleManualCheckIn = (booking) => {
        if (booking.status === 'checked_in') {
            Alert.alert('Already Checked In', 'This passenger has already been checked in.');
            return;
        }

        if (!booking.passenger?._id) {
            Alert.alert('Invalid Booking', 'This booking has invalid passenger data. Please contact support.');
            return;
        }

        const passengerName = booking.passenger?.name || 'Unknown Passenger';

        Alert.alert(
            'Confirm Check-In',
            `Check in ${passengerName}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Check In',
                    onPress: () => handleCheckIn(currentRideId, booking.passenger._id, booking._id)
                }
            ]
        );
    };

    // Memoized callback functions to prevent unnecessary re-renders
    const handleCheckInMemoized = useCallback((booking) => {
        handleManualCheckIn(booking);
    }, [currentRideId]);

    const handleStartCheckInMemoized = useCallback((rideId) => {
        startCheckIn(rideId);
    }, []);

    const handleStartManualCheckInMemoized = useCallback((rideId) => {
        startManualCheckIn(rideId);
    }, []);

    const toggleCameraFacing = () => {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    };

    // Error handling for scanError
    useEffect(() => {
        if (scanError) {
            const userMessage =
                scanError?.userMessage ||
                scanError?.response?.data?.error ||
                "There was an issue scanning the QR code.";

            Alert.alert('QR Scan Error', userMessage, [
                { text: 'Try Again', onPress: () => startCheckIn(currentRideId) },
                { text: 'Cancel', style: 'cancel' }
            ]);
        }
    }, [scanError]);

    useEffect(() => {
        if (ridesError) {
            const userMessage =
                ridesError?.userMessage ||
                ridesError?.response?.data?.error ||
                "We couldn't load the rides at this time.";

            Alert.alert('Error Loading Rides', userMessage, [
                { text: 'Try Again', onPress: retryFetchRides },
                { text: 'Cancel', style: 'cancel' }
            ]);
        }
    }, [ridesError]);

    useEffect(() => {
        if (checkInError) {
            const userMessage =
                checkInError?.userMessage ||
                checkInError?.response?.data?.error ||
                "We couldn't process the check-in at this time.";

            Alert.alert('Error During Check-in', userMessage, [
                { text: 'Try Again', onPress: retryCheckIn },
                { text: 'Cancel', style: 'cancel' }
            ]);
        }
    }, [checkInError]);

    useEffect(() => {
        if (bookingsError) {
            const userMessage =
                bookingsError?.userMessage ||
                bookingsError?.response?.data?.error ||
                "We couldn't load the bookings at this time.";

            // Add more specific error handling for permission issues
            if (bookingsError?.response?.status === 403) {
                Alert.alert(
                    'Access Denied',
                    'You do not have permission to access bookings for this ride. Please contact your administrator.',
                    [
                        { text: 'OK', style: 'default' }
                    ]
                );
            } else {
                Alert.alert('Error Loading Bookings', userMessage, [
                    { text: 'Try Again', onPress: () => retryFetchBookings(currentRideId) },
                    { text: 'Cancel', style: 'cancel' }
                ]);
            }
        }
    }, [bookingsError]);

    // Early return for permission loading
    useEffect(() => {
        if (permission && !permission.granted) {
            Alert.alert('Camera Permission', 'We need your permission to show the camera', [
                { text: 'Grant Permission', onPress: () => requestPermission() },
                { text: 'Cancel', style: 'cancel' }
            ]);
        }
    }, [permission]);

    // Reset error state when component mounts or when rides are successfully loaded
    useEffect(() => {
        if (rides && !ridesError) {
            setHasError(false);
        }
    }, [rides, ridesError]);

    // Error boundary effect - only for critical errors
    useEffect(() => {
        // Add global error handler for UIFrameGuarded errors
        const originalConsoleError = console.error;
        console.error = (...args) => {
            if (args[0]?.includes?.('UIFrameGuarded') || args[0]?.includes?.('viewState')) {
                console.warn('Suppressed UIFrameGuarded error:', ...args);
                return;
            }
            originalConsoleError(...args);
        };

        return () => {
            console.error = originalConsoleError;
        };
    }, []);

    const renderRide = ({ item }) => {
        if (!item) return null;
        return (
            <RideItem
                item={item}
                onStartCheckIn={handleStartCheckInMemoized}
                onStartManualCheckIn={handleStartManualCheckInMemoized}
                isCheckingIn={isCheckingIn}
            />
        );
    };

    const renderBooking = ({ item }) => {
        if (!item) return null;
        return (
            <BookingItem
                item={item}
                onCheckIn={handleCheckInMemoized}
                isCheckingIn={isCheckingIn}
            />
        );
    };

    // Safety check for rides data
    const safeRides = Array.isArray(rides) ? rides : [];
    const safeFilteredBookings = Array.isArray(filteredBookings) ? filteredBookings : [];

    return (
        <LinearGradient
            colors={['#0a2472', '#1E90FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.backgroundGradient}
        >
            <SafeAreaView style={styles.container}>
                {hasError ? (
                    <View style={styles.errorContainer}>
                        <Ionicons name="warning" size={48} color="#fff" />
                        <Text style={styles.errorText}>Something went wrong</Text>
                        <Text style={styles.errorSubtext}>Please restart the app</Text>
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={() => {
                                setHasError(false);
                                fetchRides();
                            }}
                        >
                            <Text style={styles.retryButtonText}>Try Again</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <View style={styles.header}>
                            <View style={styles.headerContent}>
                                <View style={styles.logoContainer}>
                                    <FontAwesome5 name="user-tie" size={24} color="#fff" />
                                </View>
                                <Text style={styles.title}>Employee Check-In</Text>
                                <Text style={styles.subtitle}>Scan QR codes or search passengers</Text>
                            </View>
                        </View>

                        <View style={styles.content}>
                            {isLoadingRides ? (
                                <View style={styles.loadingContainer}>
                                    <Ionicons name="refresh" size={32} color="#fff" />
                                    <Text style={styles.loadingText}>Loading rides...</Text>
                                </View>
                            ) : (
                                <FlatList
                                    data={safeRides}
                                    renderItem={renderRide}
                                    keyExtractor={(item) => item?._id || Math.random().toString()}
                                    getItemLayout={(data, index) => ({
                                        length: 200, // Approximate height of each ride card
                                        offset: 200 * index,
                                        index,
                                    })}
                                    removeClippedSubviews={true}
                                    maxToRenderPerBatch={5}
                                    windowSize={5}
                                    initialNumToRender={3}
                                    updateCellsBatchingPeriod={50}
                                    onEndReachedThreshold={0.5}
                                    ListEmptyComponent={
                                        <View style={styles.emptyContainer}>
                                            <Ionicons name="car-outline" size={48} color="#fff" />
                                            <Text style={styles.emptyText}>No rides available</Text>
                                            <Text style={styles.emptySubtext}>Check back later for new rides</Text>
                                        </View>
                                    }
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={styles.listContainer}
                                />
                            )}
                        </View>
                    </>
                )}

                {/* QR Scanner Modal */}
                <Modal
                    visible={scannerVisible}
                    animationType="slide"
                    onRequestClose={() => {
                        setScannerVisible(false);
                        setScannedPassenger(null);
                        setCameraReady(false);
                    }}
                >
                    <View style={styles.scannerContainer}>
                        {!scannedPassenger ? (
                            <>
                                <CameraView
                                    style={StyleSheet.absoluteFillObject}
                                    facing={facing}
                                    onBarcodeScanned={scannerVisible ? handleBarCodeScanned : undefined}
                                    onCameraReady={() => {
                                        console.log("Camera is ready")
                                        setCameraReady(true)
                                    }}
                                    barcodeScannerSettings={{
                                        barcodeTypes: ['qr'],
                                    }}
                                    autoFocus="on"
                                    focusDepth={0}
                                    enableTorch={false}
                                />
                                <View style={styles.scannerOverlay}>
                                    <View style={styles.scannerHeader}>
                                        <Text style={styles.scannerTitle}>Scan Passenger QR Code</Text>
                                        <Text style={styles.scannerSubtitle}>Position the QR code within the frame</Text>
                                    </View>

                                    <View style={styles.qrFrameContainer}>
                                        <View style={styles.qrFrame} />
                                        <Animated.View
                                            style={[
                                                styles.scanLine,
                                                { transform: [{ translateY: scanLinePosition }] }
                                            ]}
                                        />
                                    </View>

                                    <View style={styles.buttonGroup}>
                                        <TouchableOpacity
                                            style={styles.actionButton}
                                            onPress={toggleCameraFacing}
                                            disabled={isCheckingIn}
                                        >
                                            <Ionicons name="camera-reverse" size={20} color="#fff" />
                                            <Text style={styles.actionButtonText}>Flip Camera</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.actionButton, styles.closeButton]}
                                            onPress={() => {
                                                setScannerVisible(false);
                                                setScannedPassenger(null);
                                                setCameraReady(false);
                                            }}
                                            disabled={isCheckingIn}
                                        >
                                            <Ionicons name="close" size={20} color="#fff" />
                                            <Text style={styles.actionButtonText}>Close</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </>
                        ) : (
                            <View style={styles.confirmationContainer}>
                                <View style={styles.confirmationHeader}>
                                    <View style={styles.successIcon}>
                                        <Ionicons name="checkmark-circle" size={72} color="#4CAF50" />
                                    </View>
                                    <Text style={styles.confirmationTitle}>Check-In Successful</Text>
                                    <Text style={styles.confirmationSubtitle}>Passenger has been checked in</Text>
                                </View>

                                <View style={styles.passengerInfo}>
                                    <View style={styles.infoRow}>
                                        <View style={styles.infoIcon}>
                                            <Ionicons name="person" size={24} color="#0a2472" />
                                        </View>
                                        <View style={styles.infoContent}>
                                            <Text style={styles.infoLabel}>Passenger</Text>
                                            <Text style={styles.infoValue}>{scannedPassenger.name}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <View style={styles.infoIcon}>
                                            <Ionicons name="mail" size={24} color="#0a2472" />
                                        </View>
                                        <View style={styles.infoContent}>
                                            <Text style={styles.infoLabel}>Email</Text>
                                            <Text style={styles.infoValue}>{scannedPassenger.email}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <View style={styles.infoIcon}>
                                            <Ionicons name="time" size={24} color="#0a2472" />
                                        </View>
                                        <View style={styles.infoContent}>
                                            <Text style={styles.infoLabel}>Check-in Time</Text>
                                            <Text style={styles.infoValue}>{new Date().toLocaleTimeString()}</Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.buttonGroup}>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.nextButton]}
                                        onPress={() => {
                                            setScannedPassenger(null);
                                            setCameraReady(false);
                                        }}
                                    >
                                        <Ionicons name="scan" size={20} color="#fff" />
                                        <Text style={styles.actionButtonText}>Scan Next</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.closeButton]}
                                        onPress={() => {
                                            setScannerVisible(false);
                                            setScannedPassenger(null);
                                            setCameraReady(false);
                                        }}
                                    >
                                        <Ionicons name="checkmark" size={20} color="#fff" />
                                        <Text style={styles.actionButtonText}>Done</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                </Modal>

                {/* Manual Check-In Modal */}
                <Modal
                    visible={manualCheckInVisible}
                    animationType="slide"
                    onRequestClose={() => {
                        setManualCheckInVisible(false);
                        setSearchQuery('');
                        setSelectedBooking(null);
                    }}
                >
                    <LinearGradient
                        colors={['#667eea', '#764ba2']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.backgroundGradient}
                    >
                        <SafeAreaView style={styles.container}>
                            <View style={styles.modalHeader}>
                                <TouchableOpacity
                                    style={styles.closeModalButton}
                                    onPress={() => {
                                        setManualCheckInVisible(false);
                                        setSearchQuery('');
                                        setSelectedBooking(null);
                                    }}
                                >
                                    <Ionicons name="close" size={24} color="#fff" />
                                </TouchableOpacity>
                                <Text style={styles.modalTitle}>Manual Check-In</Text>
                                <View style={styles.placeholder} />
                            </View>

                            <View style={styles.searchContainer}>
                                <View style={styles.searchInputContainer}>
                                    <Ionicons name="search" size={20} color="#667eea" />
                                    <TextInput
                                        style={styles.searchInput}
                                        placeholder="Search by passenger name or email..."
                                        placeholderTextColor="rgba(102, 126, 234, 0.6)"
                                        value={searchQuery}
                                        onChangeText={setSearchQuery}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                    {searchQuery.length > 0 && (
                                        <TouchableOpacity
                                            onPress={() => setSearchQuery('')}
                                            style={styles.clearButton}
                                        >
                                            <Ionicons name="close-circle" size={20} color="#667eea" />
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {/* Statistics Display */}
                                {rideBookings && (
                                    <View style={styles.statsContainer}>
                                        <View style={styles.statCard}>
                                            <View style={styles.statIcon}>
                                                <Ionicons name="people" size={20} color="#667eea" />
                                            </View>
                                            <View style={styles.statContent}>
                                                <Text style={styles.statNumber}>{rideBookings.length}</Text>
                                                <Text style={styles.statLabel}>Total Passengers</Text>
                                            </View>
                                        </View>
                                        <View style={styles.statCard}>
                                            <View style={[styles.statIcon, styles.checkedInIcon]}>
                                                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                                            </View>
                                            <View style={styles.statContent}>
                                                <Text style={[styles.statNumber, styles.checkedInNumber]}>
                                                    {rideBookings.filter(b => b.status === 'checked_in' || b.status === 'checked-in').length}
                                                </Text>
                                                <Text style={styles.statLabel}>Checked In</Text>
                                            </View>
                                        </View>
                                        <View style={styles.statCard}>
                                            <View style={[styles.statIcon, styles.pendingIcon]}>
                                                <Ionicons name="time-outline" size={20} color="#FF9800" />
                                            </View>
                                            <View style={styles.statContent}>
                                                <Text style={[styles.statNumber, styles.pendingNumber]}>
                                                    {rideBookings.filter(b => b.status !== 'checked_in' && b.status !== 'checked-in').length}
                                                </Text>
                                                <Text style={styles.statLabel}>Pending</Text>
                                            </View>
                                        </View>
                                    </View>
                                )}
                            </View>

                            <View style={styles.bookingsContainer}>
                                {isLoadingBookings ? (
                                    <View style={styles.loadingContainer}>
                                        <Ionicons name="refresh" size={32} color="#fff" />
                                        <Text style={styles.loadingText}>Loading passengers...</Text>
                                    </View>
                                ) : (
                                    <FlatList
                                        data={safeFilteredBookings}
                                        renderItem={renderBooking}
                                        keyExtractor={(item) => item?._id || Math.random().toString()}
                                        getItemLayout={(data, index) => ({
                                            length: 120, // Approximate height of each booking card
                                            offset: 120 * index,
                                            index,
                                        })}
                                        removeClippedSubviews={true}
                                        maxToRenderPerBatch={5}
                                        windowSize={5}
                                        initialNumToRender={3}
                                        updateCellsBatchingPeriod={50}
                                        onEndReachedThreshold={0.5}
                                        ListEmptyComponent={
                                            <View style={styles.emptyContainer}>
                                                <Ionicons name="people-outline" size={48} color="#fff" />
                                                <Text style={styles.emptyText}>
                                                    {searchQuery ? 'No passengers found' : 'No passengers booked'}
                                                </Text>
                                                <Text style={styles.emptySubtext}>
                                                    {searchQuery ? 'Try a different search term' : 'Passengers will appear here when they book'}
                                                </Text>
                                            </View>
                                        }
                                        showsVerticalScrollIndicator={false}
                                        contentContainerStyle={styles.listContainer}
                                    />
                                )}
                            </View>
                        </SafeAreaView>
                    </LinearGradient>
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
        backgroundColor: 'rgba(10, 36, 114, 0.9)',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    headerContent: {
        alignItems: 'center',
    },
    logoContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    listContainer: {
        paddingBottom: 20,
    },
    rideCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        borderLeftWidth: 4,
        borderLeftColor: '#0a2472',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    routeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#0a2472',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    routeText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0a2472',
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
        textAlign: 'center',
    },
    timeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    timeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(10, 36, 114, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        flex: 1,
        marginHorizontal: 4,
    },
    timeText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0a2472',
        marginLeft: 8,
    },
    seatsContainer: {
        marginBottom: 16,
    },
    seatInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(10, 36, 114, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    seatText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#0a2472',
        marginLeft: 8,
    },
    buttonGroup: {
        flexDirection: 'row',
        gap: 12,
    },
    checkInButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        gap: 8,
        flex: 1,
    },
    qrButton: {
        backgroundColor: '#0a2472',
    },
    manualButton: {
        backgroundColor: '#4CAF50',
    },
    manualCheckInButton: {
        backgroundColor: '#0a2472',
        marginTop: 12,
    },
    checkInText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    loadingText: {
        fontSize: 16,
        color: '#fff',
        marginTop: 16,
        fontWeight: '500',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 18,
        color: '#fff',
        fontWeight: '600',
        marginTop: 16,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        marginTop: 8,
        textAlign: 'center',
    },
    scannerContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    scannerOverlay: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    scannerHeader: {
        alignItems: 'center',
        marginTop: 60,
    },
    scannerTitle: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    scannerSubtitle: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 16,
        textAlign: 'center',
    },
    qrFrameContainer: {
        position: 'relative',
        width: 250,
        height: 250,
    },
    qrFrame: {
        width: 250,
        height: 250,
        borderWidth: 3,
        borderColor: '#FFFFFF',
        borderRadius: 16,
        backgroundColor: 'transparent',
    },
    scanLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: '#4CAF50',
        borderRadius: 1,
    },
    confirmationContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 20,
    },
    confirmationHeader: {
        alignItems: 'center',
        marginBottom: 40,
    },
    successIcon: {
        marginBottom: 16,
    },
    confirmationTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#0a2472',
        marginBottom: 8,
        textAlign: 'center',
    },
    confirmationSubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    passengerInfo: {
        width: '100%',
        marginBottom: 40,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(10, 36, 114, 0.05)',
        borderRadius: 12,
        paddingVertical: 16,
    },
    infoIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(10, 36, 114, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 16,
        color: '#0a2472',
        fontWeight: '600',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        flex: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        gap: 8,
    },
    nextButton: {
        backgroundColor: '#0a2472',
    },
    closeButton: {
        backgroundColor: '#F56565',
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    // Manual Check-In Modal Styles
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 20,
        backgroundColor: 'rgba(102, 126, 234, 0.95)',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    closeModalButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    placeholder: {
        width: 44,
    },
    searchContainer: {
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        borderWidth: 1,
        borderColor: 'rgba(102, 126, 234, 0.1)',
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#667eea',
        marginLeft: 12,
        fontWeight: '500',
    },
    clearButton: {
        marginLeft: 8,
        padding: 4,
    },
    bookingsContainer: {
        flex: 1,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    bookingCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        borderWidth: 1,
        borderColor: 'rgba(102, 126, 234, 0.05)',
    },
    checkedInCard: {
        backgroundColor: 'rgba(76, 175, 80, 0.08)',
        borderLeftWidth: 4,
        borderLeftColor: '#4CAF50',
        borderColor: 'rgba(76, 175, 80, 0.2)',
    },
    bookingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    passengerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#667eea',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    passengerDetails: {
        flex: 1,
    },
    passengerName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#667eea',
        marginBottom: 4,
    },
    passengerEmail: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    bookingStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    checkedInStatus: {
        backgroundColor: 'rgba(76, 175, 80, 0.15)',
    },
    bookingStatusText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#667eea',
    },
    checkedInText: {
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    checkedInSubtext: {
        color: 'rgba(76, 175, 80, 0.7)',
    },
    checkedInAvatar: {
        backgroundColor: '#4CAF50',
    },
    checkedInStatusText: {
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        gap: 12,
    },
    statCard: {
        flex: 1,
        padding: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        borderWidth: 1,
        borderColor: 'rgba(102, 126, 234, 0.05)',
        alignItems: 'center',
    },
    statIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statContent: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#667eea',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        fontWeight: '600',
        textAlign: 'center',
    },
    checkedInIcon: {
        backgroundColor: 'rgba(76, 175, 80, 0.15)',
    },
    checkedInNumber: {
        color: '#4CAF50',
    },
    pendingIcon: {
        backgroundColor: 'rgba(255, 152, 0, 0.15)',
    },
    pendingNumber: {
        color: '#FF9800',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    errorText: {
        fontSize: 18,
        color: '#fff',
        fontWeight: '600',
        marginBottom: 16,
        textAlign: 'center',
    },
    errorSubtext: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
    },
    retryButton: {
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#4CAF50',
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});