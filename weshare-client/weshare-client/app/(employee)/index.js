
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, Modal, Button, Animated } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';

export default function EmployeeHomeScreen() {
   
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [scannerVisible, setScannerVisible] = useState(false);
    const [currentRideId, setCurrentRideId] = useState(null);
    const [scannedPassenger, setScannedPassenger] = useState(null);
    const [cameraReady, setCameraReady] = useState(false);
    const [isCheckingIn, setIsCheckingIn] = useState(false);
    const [facing, setFacing] = useState('back');
    const [permission, requestPermission] = useCameraPermissions();
    const [scanLinePosition] = useState(new Animated.Value(0)); 

    // Debug permission status
    useEffect(() => {
        
    }, [permission]);

    // Animate scanning line
    useEffect(() => {
        if (scannerVisible && cameraReady) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(scanLinePosition, {
                        toValue: 230, // Move down within QR frame (250px - 20px padding)
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
        let isMounted = true;

        const fetchRides = async () => {
            try {
                setLoading(true);
                const token = await AsyncStorage.getItem('token');
                const res = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/rides/employee`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (isMounted) {
                    setRides(res.data);
                }
            } catch (error) {
                console.error('Error fetching rides:', error);
                if (isMounted) {
                    Alert.alert('Error', 'Failed to load rides');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchRides();
        return () => {
            isMounted = false;
        };
    }, []);

    const handleCheckIn = async (rideId, userId, bookingId) => {
        setIsCheckingIn(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.post(
                `${process.env.EXPO_PUBLIC_API_URL}/rides/check-in`,
                { rideId, userId, bookingId },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setScannedPassenger({
                name: res.data.passenger.name,
                email: res.data.passenger.email,
            });
            Alert.alert('Success', 'Passenger checked in');
          
        } catch (error) {
            Alert.alert('Error', error.response?.data?.error || 'Check-in failed');
            setScannedPassenger(null);
            setScannerVisible(false);
        } finally {
            setIsCheckingIn(false);
        }
    };

    const handleBarCodeScanned = useCallback(({ type, data }) => {
        
        
        if (!cameraReady || !scannerVisible || isCheckingIn){
           
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
            Alert.alert('Error', 'Invalid QR code: ' + error.message);
            setScannedPassenger(null);
            setScannerVisible(false);
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
                style={styles.checkInButton}
                onPress={() => startCheckIn(item._id)}
                disabled={isCheckingIn}
            >
                <Text style={styles.checkInText}>Begin Check-In</Text>
            </TouchableOpacity>
        </View>
    );

    // Early return for permission loading
    if (!permission) {
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>Checking camera permissions...</Text>
            </View>
        );
    }

    // Early return for permission denied
    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.message}>We need your permission to show the camera</Text>
                <Button onPress={requestPermission} title="Grant Permission" />
            </View>
        );
    }

    // Main render
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Employee Check-In</Text>
            {loading ? (
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
    confirmationText: {
        fontSize: 18,
        color: '#4A5568',
        marginLeft: 15,
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
});