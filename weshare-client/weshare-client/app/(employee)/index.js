import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, Modal, Button, Animated } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useApi } from '../../hooks/useApi';
import ErrorDisplay from '../../components/ErrorDisplay';

export default function EmployeeHomeScreen() {
    const [scannerVisible, setScannerVisible] = useState(false);
    const [currentRideId, setCurrentRideId] = useState(null);
    const [scannedPassenger, setScannedPassenger] = useState(null);
    const [cameraReady, setCameraReady] = useState(false);
    const [facing, setFacing] = useState('back');
    const [permission, requestPermission] = useCameraPermissions();
    const [scanLinePosition] = useState(new Animated.Value(0));
    const [scanError, setScanError] = useState(null);
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

    const handleCheckIn = async (rideId, userId, bookingId) => {
        try {
            const result = await checkInPassenger({ rideId, userId, bookingId });
            setScannedPassenger({
                name: result.passenger.name,
                email: result.passenger.email,
            });
            setScanError(null);
        } catch (error) {
            // Error is already handled by useApi
            console.error('Check-in error:', error);
            setScannedPassenger(null);
            setScannerVisible(false);
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
                throw new Error('Invalid QR code: missing rideId, userId, or bookingId');
            }

            if (rideId !== currentRideId) {
                throw new Error('QR code does not match the current ride');
            }

            const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);
            if (!isValidObjectId(rideId) || !isValidObjectId(userId)) {
                throw new Error('Invalid rideId or userId format');
            }

            handleCheckIn(rideId, userId, bookingId);
        } catch (error) {
            console.error('QR scan error:', error.message);
            setScannedPassenger(null);
            setScannerVisible(false);
            setScanError(error.message);
        }
    }, [cameraReady, scannerVisible, currentRideId, isCheckingIn]);

    const startCheckIn = (rideId) => {
        setCurrentRideId(rideId);
        setScannedPassenger(null);
        setScannerVisible(true);
        setCameraReady(false);
    };

    const toggleCameraFacing = () => {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    };

    // Error handling for scanError
    if (scanError) {
        return (
            <View style={styles.errorContainer}>
                <ErrorDisplay
                    error={scanError}
                    onRetry={() => startCheckIn(currentRideId)} // Retry scanning for the same ride
                    onDismiss={() => setScanError(null)} // Clear error and return to ride list
                    title="QR Scan Error"
                    message="There was an issue scanning the QR code."
                />
            </View>
        );
    }

    if (ridesError) {
        return (
            <View style={styles.errorContainer}>
                <ErrorDisplay
                    error={ridesError}
                    onRetry={retryFetchRides}
                    title="Error Loading Rides"
                    message="We couldn't load the rides at this time."
                />
            </View>
        );
    }

    if (checkInError) {
        return (
            <View style={styles.errorContainer}>
                <ErrorDisplay
                    error={checkInError}
                    onRetry={retryCheckIn}
                    title="Error During Check-in"
                    message="We couldn't process the check-in at this time."
                />
            </View>
        );
    }

    // Early return for permission loading
    if (!permission) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.loadingText}>Checking camera permissions...</Text>
            </View>
        );
    }

    // Early return for permission denied
    if (!permission.granted) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.message}>We need your permission to show the camera</Text>
                <Button onPress={requestPermission} title="Grant Permission" />
            </View>
        );
    }

    const renderRide = ({ item }) => (
        <View style={styles.rideCard}>
            <View style={styles.routeContainer}>
                <Ionicons name="location-outline" size={20} color="#2C7A7B" style={styles.icon} />
                <Text style={styles.routeText}>
                    {item.categoryId.from} → {item.categoryId.to}
                </Text>
            </View>
            <View style={styles.timeContainer}>
                <Ionicons name="calendar-outline" size={18} color="#F56565" style={styles.icon} />
                <Text style={styles.timeText}>
                    {new Date(item.departure_time).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                    })}
                </Text>
                <Ionicons name="time-outline" size={18} color="#F56565" style={styles.icon} />
                <Text style={styles.timeText}>
                    {new Date(item.departure_time).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                    })}
                </Text>
            </View>
            <Text style={styles.detailText}>
                Seats: {item.seats - item.booked_seats}/{item.seats}
            </Text>
            <Text style={styles.detailText}>Status: {item.statusDisplay}</Text>
            <TouchableOpacity
                style={[styles.checkInButton, isCheckingIn && styles.buttonDisabled]}
                onPress={() => startCheckIn(item._id)}
                disabled={isCheckingIn}
            >
                <Text style={styles.checkInText}>
                    {isCheckingIn ? 'Processing...' : 'Begin Check-In'}
                </Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Employee Check-In</Text>
            {isLoadingRides ? (
                <Text style={styles.loadingText}>Loading...</Text>
            ) : (
                <FlatList
                    data={rides}
                    renderItem={renderRide}
                    keyExtractor={(item) => item._id}
                    ListEmptyComponent={<Text style={styles.emptyText}>No rides available</Text>}
                />
            )}
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
                                <Text style={styles.scannerText}>Scan Passenger QR Code</Text>
                                <View style={styles.qrFrame} />
                                <View style={styles.buttonGroup}>
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={toggleCameraFacing}
                                        disabled={isCheckingIn}
                                    >
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
                                        <Text style={styles.actionButtonText}>Close</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </>
                    ) : (
                        <View style={styles.confirmationContainer}>
                            <View style={styles.confirmationHeader}>
                                <Ionicons name="checkmark-circle" size={72} color="#4CAF50" />
                                <Text style={styles.confirmationTitle}>Check-In Successful</Text>
                            </View>
                            <View style={styles.passengerInfo}>
                                <View style={styles.infoRow}>
                                    <Ionicons name="person" size={24} color="#2D3748" />
                                    <Text style={styles.confirmationText}>
                                        Passenger: {scannedPassenger.name}
                                    </Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <Ionicons name="mail" size={24} color="#2D3748" />
                                    <Text style={styles.confirmationText}>
                                        Email: {scannedPassenger.email}
                                    </Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <Ionicons name="time" size={24} color="#2D3748" />
                                    <Text style={styles.confirmationText}>
                                        Time: {new Date().toLocaleTimeString()}
                                    </Text>
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
                                    <Text style={styles.actionButtonText}>Done</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#F7FAFC',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#2D3748',
        marginBottom: 20,
        textAlign: 'center',
    },
    rideCard: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 12,
        marginBottom: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderLeftWidth: 4,
        borderLeftColor: '#319795',
    },
    routeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    routeText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2C7A7B',
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        flexWrap: 'wrap',
    },
    timeText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#F56565',
        marginRight: 15,
    },
    detailText: {
        fontSize: 14,
        color: '#4A5568',
        marginBottom: 5,
    },
    checkInButton: {
        backgroundColor: '#319795',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginTop: 10,
    },
    checkInText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    icon: {
        marginRight: 8,
    },
    loadingText: {
        fontSize: 16,
        color: '#4A5568',
        textAlign: 'center',
        marginTop: 20,
    },
    message: {
        fontSize: 16,
        color: '#4A5568',
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    emptyText: {
        fontSize: 16,
        color: '#4A5568',
        textAlign: 'center',
        marginTop: 20,
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
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    scannerText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '600',
        marginTop: 50,
        textAlign: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 10,
        borderRadius: 5,
    },
    confirmationContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 20,
    },
    confirmationTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#2D3748',
        marginBottom: 20,
    },
    confirmationHeader: {
        alignItems: 'center',
        marginBottom: 30,
    },
    confirmationText: {
        fontSize: 16,
        color: '#4A5568',
        marginBottom: 10,
    },
    passengerInfo: {
        width: '100%',
        marginBottom: 40,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 10,
        paddingHorizontal: 20,
    },
    buttonGroup: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 20,
    },
    actionButton: {
        paddingVertical: 15,
        paddingHorizontal: 25,
        borderRadius: 8,
        minWidth: '45%',
        alignItems: 'center',
        backgroundColor: '#319795',
    },
    nextButton: {
        backgroundColor: '#319795',
    },
    closeButton: {
        backgroundColor: '#F56565',
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    qrFrame: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        borderRadius: 10,
        backgroundColor: 'transparent',
    },
    buttonDisabled: {
        opacity: 0.7,
    },
});