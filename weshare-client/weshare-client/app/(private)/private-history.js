import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, SafeAreaView, Modal, TextInput, Alert, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../../hooks/useApi';
// import ErrorDisplay from '../../components/ErrorDisplay';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';

const PrivateHistoryScreen = () => {
    const router = useRouter();
    const { user } = useAuth();
    const [repeatModalVisible, setRepeatModalVisible] = useState(false);
    const [selectedRideForRepeat, setSelectedRideForRepeat] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state for repeat ride
    const [repeatDate, setRepeatDate] = useState(new Date());
    const [repeatTime, setRepeatTime] = useState(new Date());
    const [repeatDescription, setRepeatDescription] = useState('');
    const [repeatSeats, setRepeatSeats] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    const {
        data: historyData,
        error: historyError,
        isLoading: isLoadingHistory,
        execute: fetchPrivateHistory,
        retry: retryFetchHistory
    } = useApi(async () => {
        if (!user?.id || !user?.token) {
            return;
        }

        const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/rides/private/history`, {
            headers: { Authorization: `Bearer ${user.token}` },
        });

        return response.data;
    });

    useEffect(() => {
        if (user) {
            fetchPrivateHistory();
        }
    }, [user]);

    const onRefresh = useCallback(async () => {
        if (user) {
            fetchPrivateHistory();
        }
    }, [user]);

    const handleRepeatRide = (ride) => {
        setSelectedRideForRepeat(ride);
        // Set default values
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setRepeatDate(tomorrow);
        setRepeatTime(new Date(ride.departure_time));
        setRepeatDescription(ride.description || '');
        setRepeatSeats(ride.seats.toString());
        setRepeatModalVisible(true);
    };

    const submitRepeatRide = async () => {
        if (!selectedRideForRepeat) return;

        // Validate seats
        const seatsNumber = parseInt(repeatSeats);
        if (!seatsNumber || seatsNumber < 1 || seatsNumber > 50) {
            Alert.alert('Invalid Seats', 'Please enter a valid number of seats (1-50).');
            return;
        }

        // Combine date and time
        const departureDateTime = new Date(repeatDate);
        departureDateTime.setHours(repeatTime.getHours());
        departureDateTime.setMinutes(repeatTime.getMinutes());

        // Validate that the date/time is in the future
        if (departureDateTime <= new Date()) {
            Alert.alert('Invalid Date/Time', 'Please select a future date and time.');
            return;
        }

        setIsSubmitting(true);

        try {
            // Format date and time to match the API expectations
            const formattedDate = repeatDate.toISOString().split('T')[0];
            const formattedTime = repeatTime.toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit'
            });

            // Calculate ETA in hours if available
            let estimatedArrivalTimeHours = 2; // Default 2 hours
            if (selectedRideForRepeat.estimatedArrivalTime && selectedRideForRepeat.departure_time) {
                const originalDeparture = new Date(selectedRideForRepeat.departure_time);
                const originalArrival = new Date(selectedRideForRepeat.estimatedArrivalTime);
                const durationMs = originalArrival.getTime() - originalDeparture.getTime();
                estimatedArrivalTimeHours = Math.ceil(durationMs / (1000 * 60 * 60)); // Convert to hours
            }

            const rideData = {
                from: selectedRideForRepeat.from,
                to: selectedRideForRepeat.to,
                date: formattedDate,
                time: formattedTime,
                description: repeatDescription,
                estimatedArrivalTime: estimatedArrivalTimeHours,
                licensePlate: selectedRideForRepeat.licensePlate,
                isPrivate: true,
                seats: seatsNumber,
                price: selectedRideForRepeat.price
            };

            const response = await axios.post(
                `${process.env.EXPO_PUBLIC_API_URL}/rides`,
                rideData,
                {
                    headers: { Authorization: `Bearer ${user.token}` },
                }
            );

            Alert.alert('Success', 'Ride repeated successfully!', [
                {
                    text: 'OK',
                    onPress: () => {
                        setRepeatModalVisible(false);
                        setSelectedRideForRepeat(null);
                        router.push('/(private)');
                    }
                }
            ]);

        } catch (error) {
            console.error('Error repeating ride:', error);
            console.error('Error response:', error.response?.data);
            const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to repeat ride. Please try again.';
            Alert.alert('Error', errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const cancelRepeatRide = () => {
        setRepeatModalVisible(false);
        setSelectedRideForRepeat(null);
        setRepeatDescription('');
        setRepeatSeats('');
    };

    useEffect(() => {
        if (historyError) {
            Alert.alert(
                'Error Loading History',
                historyError.userMessage || 'We encountered an error while loading your private ride history. Please try again.',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel'
                    },
                    {
                        text: 'Retry',
                        onPress: () => retryFetchHistory()
                    }
                ]
            );
        }
    }, [historyError]);

    const history = historyData?.history || [];

    const renderHistoryItem = ({ item }) => {
        const getStatusColor = (status) => {
            if (item.allPassengersCompleted) return '#28a745'; // Green for completed
            if (item.somePassengersCompleted) return '#ff8c00'; // Orange for partial
            return '#718096'; // Gray for no completion
        };

        return (
            <View style={styles.historyCard}>
                <View style={styles.cardHeader}>
                    <Text style={styles.routeText}>{item.from} → {item.to}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                        <Text style={styles.statusText}>
                            {item.allPassengersCompleted ? 'Completed' :
                                item.somePassengersCompleted ? `${item.completedPassengers}/${item.totalPassengers} Done` :
                                    'No Completion'}
                        </Text>
                    </View>
                </View>

                <View style={styles.cardContent}>
                    <View style={styles.detailRow}>
                        <FontAwesome5 name="calendar" size={14} color="#666" />
                        <Text style={styles.detailText}>
                            {format(new Date(item.departure_time), 'PPP p')}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <FontAwesome5 name="car" size={14} color="#666" />
                        <Text style={styles.detailText}>{item.licensePlate}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <FontAwesome5 name="users" size={14} color="#666" />
                        <Text style={styles.detailText}>
                            {item.totalPassengers} passenger{item.totalPassengers !== 1 ? 's' : ''}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <FontAwesome5 name="money-bill-wave" size={14} color="#666" />
                        <Text style={styles.detailText}>{item.price} RWF</Text>
                    </View>

                    {item.description && (
                        <View style={styles.detailRow}>
                            <FontAwesome5 name="info-circle" size={14} color="#666" />
                            <Text style={styles.detailText}>{item.description}</Text>
                        </View>
                    )}
                </View>

                {item.bookedBy && item.bookedBy.length > 0 && (
                    <View style={styles.passengersSection}>
                        <Text style={styles.passengersSectionTitle}>Passengers</Text>
                        {item.bookedBy.map((booking, index) => {
                            const passenger = booking.userId || booking;
                            const passengerName = passenger.name || passenger.email || `Passenger ${index + 1}`;

                            return (
                                <View key={booking.bookingId || index} style={styles.passengerRow}>
                                    <FontAwesome5 name="user" size={12} color="#666" />
                                    <Text style={styles.passengerName}>{passengerName}</Text>
                                    <View style={[
                                        styles.passengerStatusBadge,
                                        booking.checkInStatus === 'completed' ? styles.completedPassenger :
                                            booking.checkInStatus === 'checked-in' ? styles.checkedInPassenger :
                                                styles.pendingPassenger
                                    ]}>
                                        <Text style={styles.passengerStatusText}>
                                            {booking.checkInStatus === 'completed' ? 'Completed' :
                                                booking.checkInStatus === 'checked-in' ? 'Checked In' :
                                                    'Pending'}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* Repeat Ride Button */}
                <View style={styles.cardActions}>
                    <TouchableOpacity
                        style={styles.repeatButton}
                        onPress={() => handleRepeatRide(item)}
                    >
                        <FontAwesome5 name="redo" size={16} color="#fff" />
                        <Text style={styles.repeatButtonText}>Repeat Ride</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

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
                    <Text style={styles.headerTitle}>Private Ride History</Text>
                    <View style={styles.headerPlaceholder} />
                </View>

                <FlatList
                    data={history}
                    renderItem={renderHistoryItem}
                    keyExtractor={(item) => item._id}
                    refreshControl={
                        <RefreshControl
                            refreshing={isLoadingHistory}
                            onRefresh={onRefresh}
                            colors={['#4CAF50']}
                            tintColor='#4CAF50'
                        />
                    }
                    contentContainerStyle={styles.scrollContent}
                    ListEmptyComponent={
                        !isLoadingHistory && (
                            <View style={styles.emptyContainer}>
                                <FontAwesome5 name="history" size={64} color="rgba(255, 255, 255, 0.6)" />
                                <Text style={styles.emptyText}>No ride history found</Text>
                                <Text style={styles.emptySubText}>Completed private rides will appear here</Text>
                            </View>
                        )
                    }
                />

                {/* Repeat Ride Modal */}
                <Modal
                    visible={repeatModalVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={cancelRepeatRide}
                >
                    <KeyboardAvoidingView
                        style={styles.modalContainer}
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    >
                        <View style={styles.modalContent}>
                            <ScrollView
                                contentContainerStyle={styles.modalScrollContent}
                                keyboardShouldPersistTaps="handled"
                                showsVerticalScrollIndicator={false}
                            >
                                <View style={styles.modalHeader}>
                                    <FontAwesome5 name="redo" size={24} color="#0a2472" />
                                    <Text style={styles.modalTitle}>Repeat Ride</Text>
                                </View>

                                {selectedRideForRepeat && (
                                    <View style={styles.ridePreview}>
                                        <Text style={styles.previewTitle}>Route</Text>
                                        <Text style={styles.previewText}>
                                            {selectedRideForRepeat.from} → {selectedRideForRepeat.to}
                                        </Text>
                                        <Text style={styles.previewSubtext}>
                                            {selectedRideForRepeat.price} RWF • License: {selectedRideForRepeat.licensePlate}
                                        </Text>
                                    </View>
                                )}

                                <View style={styles.formSection}>
                                    <Text style={styles.formLabel}>Date</Text>
                                    <TouchableOpacity
                                        style={styles.dateTimeButton}
                                        onPress={() => setShowDatePicker(true)}
                                    >
                                        <FontAwesome5 name="calendar" size={16} color="#0a2472" />
                                        <Text style={styles.dateTimeText}>
                                            {format(repeatDate, 'PPP')}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.formSection}>
                                    <Text style={styles.formLabel}>Time</Text>
                                    <TouchableOpacity
                                        style={styles.dateTimeButton}
                                        onPress={() => setShowTimePicker(true)}
                                    >
                                        <FontAwesome5 name="clock" size={16} color="#0a2472" />
                                        <Text style={styles.dateTimeText}>
                                            {format(repeatTime, 'p')}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.formSection}>
                                    <Text style={styles.formLabel}>Number of Seats</Text>
                                    <TextInput
                                        style={styles.seatsInput}
                                        value={repeatSeats}
                                        onChangeText={setRepeatSeats}
                                        placeholder="Enter number of seats..."
                                        placeholderTextColor="#999"
                                        keyboardType="numeric"
                                        maxLength={2}
                                    />
                                </View>

                                <View style={styles.formSection}>
                                    <Text style={styles.formLabel}>Description (Optional)</Text>
                                    <TextInput
                                        style={styles.descriptionInput}
                                        value={repeatDescription}
                                        onChangeText={setRepeatDescription}
                                        placeholder="Add any additional details..."
                                        placeholderTextColor="#999"
                                        multiline
                                        numberOfLines={3}
                                        textAlignVertical="top"
                                    />
                                </View>

                                <View style={styles.modalButtons}>
                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        onPress={cancelRepeatRide}
                                    >
                                        <Text style={styles.cancelButtonText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.submitButton, isSubmitting && styles.disabledButton]}
                                        onPress={submitRepeatRide}
                                        disabled={isSubmitting}
                                    >
                                        <Text style={styles.submitButtonText}>
                                            {isSubmitting ? 'Creating...' : 'Create Ride'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>

                            {showDatePicker && (
                                <DateTimePicker
                                    value={repeatDate}
                                    mode="date"
                                    display="default"
                                    minimumDate={new Date()}
                                    onChange={(event, selectedDate) => {
                                        setShowDatePicker(false);
                                        if (selectedDate) {
                                            setRepeatDate(selectedDate);
                                        }
                                    }}
                                />
                            )}

                            {showTimePicker && (
                                <DateTimePicker
                                    value={repeatTime}
                                    mode="time"
                                    display="default"
                                    onChange={(event, selectedTime) => {
                                        setShowTimePicker(false);
                                        if (selectedTime) {
                                            setRepeatTime(selectedTime);
                                        }
                                    }}
                                />
                            )}
                        </View>
                    </KeyboardAvoidingView>
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
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
        textAlign: 'center',
    },
    headerPlaceholder: {
        width: 32,
        height: 32,
    },
    scrollContent: {
        padding: 16,
    },
    historyCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    routeText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0a2472',
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    cardContent: {
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    detailText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#333',
    },
    passengersSection: {
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#0a2472',
    },
    passengersSectionTitle: {
        fontWeight: 'bold',
        color: '#0a2472',
        marginBottom: 8,
        fontSize: 14,
    },
    passengerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        marginBottom: 4,
    },
    passengerName: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        color: '#333',
    },
    passengerStatusBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    passengerStatusText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#fff',
    },
    completedPassenger: {
        backgroundColor: '#28a745', // Green
    },
    checkedInPassenger: {
        backgroundColor: '#3182ce', // Blue
    },
    pendingPassenger: {
        backgroundColor: '#ff8c00', // Orange
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        marginTop: 60,
    },
    emptyText: {
        fontSize: 18,
        color: '#fff',
        textAlign: 'center',
        marginTop: 16,
        fontWeight: '600',
    },
    emptySubText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
        marginTop: 8,
    },
    cardActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 12,
    },
    repeatButton: {
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#0a2472',
        flexDirection: 'row',
        alignItems: 'center',
    },
    repeatButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        width: '100%',
        maxHeight: '90%',
        maxWidth: 400,
    },
    modalScrollContent: {
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0a2472',
        marginLeft: 8,
    },
    ridePreview: {
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
    },
    previewTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0a2472',
        marginBottom: 4,
    },
    previewText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '600',
        marginBottom: 4,
    },
    previewSubtext: {
        fontSize: 12,
        color: '#666',
    },
    formSection: {
        marginBottom: 20,
    },
    formLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0a2472',
        marginBottom: 8,
    },
    dateTimeButton: {
        padding: 12,
        borderWidth: 1,
        borderColor: '#0a2472',
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    dateTimeText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#0a2472',
        fontWeight: '500',
    },
    seatsInput: {
        padding: 12,
        borderWidth: 1,
        borderColor: '#0a2472',
        borderRadius: 8,
        color: '#0a2472',
        fontSize: 16,
        backgroundColor: '#f8f9fa',
    },
    descriptionInput: {
        padding: 12,
        borderWidth: 1,
        borderColor: '#0a2472',
        borderRadius: 8,
        color: '#0a2472',
        backgroundColor: '#f8f9fa',
        fontSize: 14,
        minHeight: 80,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        padding: 14,
        borderWidth: 1,
        borderColor: '#0a2472',
        borderRadius: 8,
        backgroundColor: '#fff',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0a2472',
    },
    submitButton: {
        flex: 1,
        padding: 14,
        borderRadius: 8,
        backgroundColor: '#0a2472',
        alignItems: 'center',
    },
    submitButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
});

export default PrivateHistoryScreen; 