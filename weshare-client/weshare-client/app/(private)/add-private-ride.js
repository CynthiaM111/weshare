import { View, Text, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import axios from 'axios';
import { useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';
import CustomAlert from '../../components/CustomAlert';
import LocationPicker from '../../components/LocationPicker';
import PricingPreview from '../../components/PricingPreview';

export default function AddPrivateRideScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [startLocation, setStartLocation] = useState(null);
    const [endLocation, setEndLocation] = useState(null);
    const [date, setDate] = useState(new Date());
    const [time, setTime] = useState(new Date());
    const [description, setDescription] = useState('');
    const [eta, setEta] = useState('');
    const [licensePlate, setLicensePlate] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [rideId, setRideId] = useState(null);
    const [seats, setSeats] = useState('');
    const [fuelEfficiency, setFuelEfficiency] = useState('7.0');
    const [pricePerLiter, setPricePerLiter] = useState('1700');
    const [calculatedPrice, setCalculatedPrice] = useState(null);
    const [wheelchairAccessible, setWheelchairAccessible] = useState(false);
    const [startLocationValid, setStartLocationValid] = useState(false);
    const [endLocationValid, setEndLocationValid] = useState(false);

    // Custom alert state
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({
        title: '',
        message: '',
        type: 'info',
        buttons: []
    });

    // Get ride data from route params if it exists
    const params = useLocalSearchParams();
    const hasInitialized = useRef(false);

    const showAlert = (title, message, type = 'info', buttons = []) => {
        setAlertConfig({
            title,
            message,
            type,
            buttons: buttons.length > 0 ? buttons : [{ text: 'OK', onPress: () => setAlertVisible(false) }]
        });
        setAlertVisible(true);
    };

    useEffect(() => {
        if (params?.ride && !hasInitialized.current) {
            try {
                const parsedRide = JSON.parse(params.ride);
                setIsEditing(true);
                setRideId(parsedRide._id);

                // Set locations if they exist
                if (parsedRide.startLocation) {
                    setStartLocation(parsedRide.startLocation);
                } else if (parsedRide.from) {
                    setStartLocation({ name: parsedRide.from });
                }

                if (parsedRide.endLocation) {
                    setEndLocation(parsedRide.endLocation);
                } else if (parsedRide.to) {
                    setEndLocation({ name: parsedRide.to });
                }

                setDescription(parsedRide.description);
                setLicensePlate(parsedRide.licensePlate);
                setEta(parsedRide.estimatedArrivalTime.toString());
                setSeats(parsedRide.seats.toString());
                setFuelEfficiency(parsedRide.fuelEfficiency?.toString() || '7.0');
                setPricePerLiter(parsedRide.pricePerLiter?.toString() || '1700');
                setWheelchairAccessible(parsedRide.wheelchairAccessible);

                // Set date and time from departure_time
                if (parsedRide.departure_time) {
                    const departureDate = new Date(parsedRide.departure_time);
                    setDate(departureDate);
                    setTime(departureDate);
                }

                hasInitialized.current = true;
            } catch (error) {
                console.error('Error parsing ride data:', error);
            }
        }
    }, [params?.ride]);

    // Fetch driver verification data to prefill license plate for new rides
    useEffect(() => {
        const fetchDriverProfile = async () => {
            // Only fetch if we're not editing and user is logged in
            if (isEditing || !user?.token) return;

            try {
                const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/driver-verification/profile`, {
                    headers: {
                        'Authorization': `Bearer ${user.token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('Driver profile data for license plate prefill:', data);

                    // Prefill license plate if driver is verified and license plate is not already set
                    if (data?.verifiedDriver && data?.driverProfile?.vehicleLicensePlate && !licensePlate) {
                        setLicensePlate(data.driverProfile.vehicleLicensePlate);
                        console.log('Prefilled license plate:', data.driverProfile.vehicleLicensePlate);
                    }
                }
            } catch (error) {
                console.error('Error fetching driver profile for license plate prefill:', error);
            }
        };

        fetchDriverProfile();
    }, [user, isEditing, licensePlate]);

    const { execute: addPrivateRide, isLoading } = useApi(async (rideData) => {
        const url = isEditing
            ? `${process.env.EXPO_PUBLIC_API_URL}/rides/${rideId}`
            : `${process.env.EXPO_PUBLIC_API_URL}/rides`;

        const method = isEditing ? 'put' : 'post';

        const response = await axios[method](url, rideData, {
            headers: {
                'Authorization': `Bearer ${user.token}`
            }
        });

        if (response.status !== (isEditing ? 200 : 201)) {
            throw new Error(`Failed to ${isEditing ? 'update' : 'add'} private ride`);
        }

        return response.data;
    });

    const handleSubmit = async () => {
        if (!startLocationValid || !endLocationValid) {
            showAlert('Invalid Locations', 'Please select valid locations from the suggestions for both pickup and destination.', 'warning');
            return;
        }

        if (!startLocation?.latitude || !endLocation?.latitude || !description || !eta || !licensePlate || !seats) {
            showAlert('Missing Information', 'Please fill in all required fields including GPS coordinates', 'warning');
            return;
        }

        // Validate numeric fields
        const numSeats = parseInt(seats);
        const numEta = parseInt(eta);
        const numFuelEfficiency = parseFloat(fuelEfficiency);
        const numPricePerLiter = parseFloat(pricePerLiter);

        if (isNaN(numSeats) || numSeats < 1) {
            showAlert('Invalid Seats', 'Please enter a valid number of seats (minimum 1)', 'warning');
            return;
        }

        if (isNaN(numEta) || numEta < 1) {
            showAlert('Invalid ETA', 'Please enter a valid ETA in hours (minimum 1)', 'warning');
            return;
        }

        if (isNaN(numFuelEfficiency) || numFuelEfficiency < 1) {
            showAlert('Invalid Fuel Efficiency', 'Please enter a valid fuel efficiency (minimum 1 L/100km)', 'warning');
            return;
        }

        if (isNaN(numPricePerLiter) || numPricePerLiter < 1) {
            showAlert('Invalid Fuel Price', 'Please enter a valid fuel price (minimum 1 RWF/L)', 'warning');
            return;
        }

        // Pricing calculation is optional - if not available, use a default calculation
        let finalPrice = null;

        if (calculatedPrice) {
            finalPrice = calculatedPrice.costSharing?.perPassengerCost;

        } else {
            // Simple fallback calculation
            const distance = 50; // Default distance in km
            const fuelLiters = (distance * numFuelEfficiency) / 100;
            const totalFuelCost = fuelLiters * numPricePerLiter;
            const passengerShare = totalFuelCost * 0.75; // 75% for passengers
            finalPrice = passengerShare / numSeats;
        }

        try {
            const formattedDate = date.toISOString().split('T')[0];
            const formattedTime = time.toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit'
            });

            const rideData = {
                startLocation: {
                    name: startLocation.name,
                    latitude: startLocation.latitude,
                    longitude: startLocation.longitude
                },
                endLocation: {
                    name: endLocation.name,
                    latitude: endLocation.latitude,
                    longitude: endLocation.longitude
                },
                date: formattedDate,
                time: formattedTime,
                description,
                estimatedArrivalTime: numEta,
                licensePlate,
                isPrivate: true,
                seats: numSeats,
                fuelEfficiency: numFuelEfficiency,
                pricePerLiter: numPricePerLiter,
                price: finalPrice,
                wheelchairAccessible
            };

            await addPrivateRide(rideData);
            showAlert(
                'Success!',
                `Private ride ${isEditing ? 'updated' : 'added'} successfully with automatic pricing`,
                'success',
                [
                    {
                        text: 'View My Rides',
                        onPress: () => router.push('/(private)'),
                    },
                    {
                        text: 'OK',
                        onPress: () => router.back(),
                    }
                ]
            );
        } catch (error) {
            console.error('Error submitting ride:', error);
            let userMessage = 'An unexpected error occurred';

            if (error?.response?.data?.error) {
                userMessage = error.response.data.error;
            } else if (error?.userMessage) {
                userMessage = error.userMessage;
            } else if (error?.message) {
                userMessage = error.message;
            }

            showAlert('Error', userMessage, 'error');
        }
    };

    const handlePriceCalculated = (pricingData) => {
        setCalculatedPrice(pricingData);
    };

    const onTimeChange = (event, selectedTime) => {
        setShowTimePicker(false);
        if (selectedTime) {
            setTime(selectedTime);
        }
    };

    const onDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setDate(selectedDate);
        }
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (time) => {
        return time.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.gradient}
            >
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                    >
                        <Ionicons name="arrow-back" size={24} color="#ffffff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {isEditing ? 'Edit Private Ride' : 'Create Private Ride'}
                    </Text>
                    <View style={styles.headerSpacer} />
                </View>
            </LinearGradient>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoidingView}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.content}>
                        {/* Location Section */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <FontAwesome5 name="map-marker-alt" size={20} color="#667eea" />
                                <Text style={styles.sectionTitle}>Location Details</Text>
                            </View>

                            <LocationPicker
                                value={startLocation}
                                onLocationSelect={setStartLocation}
                                placeholder="Enter pickup location..."
                                label="Pickup Location"
                                required={true}
                                onValidityChange={setStartLocationValid}
                            />

                            <LocationPicker
                                value={endLocation}
                                onLocationSelect={setEndLocation}
                                placeholder="Enter destination..."
                                label="Destination"
                                required={true}
                                onValidityChange={setEndLocationValid}
                            />
                        </View>

                        {/* Trip Details Section */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <FontAwesome5 name="calendar-alt" size={20} color="#667eea" />
                                <Text style={styles.sectionTitle}>Trip Details</Text>
                            </View>

                            {/* Date and Time */}
                            <View style={styles.row}>
                                <TouchableOpacity
                                    style={styles.dateTimeButton}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <FontAwesome5 name="calendar" size={16} color="#667eea" />
                                    <Text style={styles.dateTimeText}>{formatDate(date)}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.dateTimeButton}
                                    onPress={() => setShowTimePicker(true)}
                                >
                                    <FontAwesome5 name="clock" size={16} color="#667eea" />
                                    <Text style={styles.dateTimeText}>{formatTime(time)}</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Description */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>
                                    Description <Text style={styles.required}>*</Text>
                                </Text>
                                <TextInput
                                    style={styles.textArea}
                                    value={description}
                                    onChangeText={setDescription}
                                    placeholder="Where are you meeting with the passenger(s)? (e.g., Kigali Heights Mall entrance, Remera bus stop, etc.)"
                                    placeholderTextColor="#64748b"
                                    multiline
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                />
                            </View>

                            {/* ETA */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>
                                    Estimated Travel Time (hours) <Text style={styles.required}>*</Text>
                                </Text>
                                <TextInput
                                    style={styles.input}
                                    value={eta}
                                    onChangeText={setEta}
                                    placeholder="e.g., 2"
                                    placeholderTextColor="#64748b"
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        {/* Vehicle Details Section */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <FontAwesome5 name="car" size={20} color="#667eea" />
                                <Text style={styles.sectionTitle}>Vehicle Details</Text>
                            </View>

                            {/* License Plate */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>
                                    License Plate <Text style={styles.required}>*</Text>
                                </Text>
                                <TextInput
                                    style={styles.input}
                                    value={licensePlate}
                                    onChangeText={setLicensePlate}
                                    placeholder="e.g., RAA123A"
                                    placeholderTextColor="#64748b"
                                    autoCapitalize="characters"
                                />
                            </View>

                            {/* Seats */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>
                                    Available Seats <Text style={styles.required}>*</Text>
                                </Text>
                                <TextInput
                                    style={styles.input}
                                    value={seats}
                                    onChangeText={setSeats}
                                    placeholder="e.g., 3"
                                    placeholderTextColor="#64748b"
                                    keyboardType="numeric"
                                />
                            </View>

                            {/* Wheelchair Accessible */}
                            <View style={styles.checkboxGroup}>
                                <TouchableOpacity
                                    style={styles.checkbox}
                                    onPress={() => setWheelchairAccessible(!wheelchairAccessible)}
                                >
                                    <View style={[styles.checkboxBox, wheelchairAccessible && styles.checkboxChecked]}>
                                        {wheelchairAccessible && (
                                            <FontAwesome5 name="check" size={12} color="#ffffff" />
                                        )}
                                    </View>
                                    <Text style={styles.checkboxLabel}>Wheelchair Accessible</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Fuel Details Section */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <FontAwesome5 name="gas-pump" size={20} color="#667eea" />
                                <Text style={styles.sectionTitle}>Fuel Details</Text>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Fuel Efficiency (L/100km)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={fuelEfficiency}
                                    onChangeText={setFuelEfficiency}
                                    placeholder="e.g., 7.0"
                                    placeholderTextColor="#64748b"
                                    keyboardType="numeric"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Fuel Price (RWF/L)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={pricePerLiter}
                                    onChangeText={setPricePerLiter}
                                    placeholder="e.g., 1700"
                                    placeholderTextColor="#64748b"
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        {/* Pricing Preview */}
                        {startLocation && endLocation && seats && fuelEfficiency && pricePerLiter && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <FontAwesome5 name="calculator" size={20} color="#667eea" />
                                    <Text style={styles.sectionTitle}>Pricing Preview</Text>
                                </View>
                                <PricingPreview
                                    startLocation={startLocation}
                                    endLocation={endLocation}
                                    seats={seats}
                                    fuelEfficiency={fuelEfficiency}
                                    pricePerLiter={pricePerLiter}
                                    onPriceCalculated={handlePriceCalculated}
                                    pricing={calculatedPrice}
                                />
                            </View>
                        )}

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={isLoading}
                        >
                            <Text style={styles.submitButtonText}>
                                {isLoading ? 'Creating...' : (isEditing ? 'Update Ride' : 'Create Ride')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Date Picker */}
            {showDatePicker && (
                <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                    minimumDate={new Date()}
                />
            )}

            {/* Time Picker */}
            {showTimePicker && (
                <DateTimePicker
                    value={time}
                    mode="time"
                    display="default"
                    onChange={onTimeChange}
                />
            )}

            {/* Custom Alert */}
            <CustomAlert
                visible={alertVisible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                buttons={alertConfig.buttons}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    gradient: {
        paddingTop: 20,
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
        flex: 1,
    },
    headerSpacer: {
        width: 40,
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    content: {
        gap: 20,
    },
    section: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginLeft: 12,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    dateTimeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    dateTimeText: {
        fontSize: 16,
        color: '#475569',
        marginLeft: 8,
        fontWeight: '500',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    required: {
        color: '#ef4444',
    },
    input: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        fontSize: 16,
        color: '#1f2937',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        fontSize: 16,
        color: '#1f2937',
    },
    checkboxGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    checkbox: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    checkboxBox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#d1d5db',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    checkboxChecked: {
        backgroundColor: '#667eea',
        borderColor: '#667eea',
    },
    checkboxLabel: {
        fontSize: 16,
        color: '#374151',
        flex: 1,
    },
    submitButton: {
        backgroundColor: '#667eea',
        paddingVertical: 18,
        paddingHorizontal: 32,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 20,
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    submitButtonDisabled: {
        backgroundColor: '#9ca3af',
        shadowOpacity: 0.1,
    },
    submitButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    // LocationPicker specific styles
    locationPickerContainer: {
        marginBottom: 20,
    },
    locationPickerInput: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    locationPickerLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
}); 