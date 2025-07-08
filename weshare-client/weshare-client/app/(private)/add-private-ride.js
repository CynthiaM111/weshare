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
        console.log("calculatedPrice", calculatedPrice);
        if (calculatedPrice) {
            finalPrice = calculatedPrice.costSharing?.perPassengerCost;
            console.log("[frontend] finalPrice", finalPrice);
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

    return (
        <LinearGradient
            colors={['#0a2472', '#1E90FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.backgroundGradient}
        >
            <SafeAreaView style={styles.container}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardAvoidingView}
                >
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.header}>
                            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                                <Ionicons name="arrow-back" size={24} color="#fff" />
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>
                                {isEditing ? 'Edit Your Ride' : 'Add Your Ride'}
                            </Text>
                        </View>

                        <View style={styles.formContainer}>
                            <View style={styles.infoSection}>
                                <FontAwesome5 name="info-circle" size={16} color="#4CAF50" />
                                <Text style={styles.infoText}>
                                    Search for locations to automatically calculate pricing based on GPS coordinates and fuel costs
                                </Text>
                            </View>

                            <LocationPicker
                                value={startLocation}
                                onLocationSelect={setStartLocation}
                                placeholder="Search for departure location..."
                                label="From"
                                required={true}
                            />

                            <LocationPicker
                                value={endLocation}
                                onLocationSelect={setEndLocation}
                                placeholder="Search for destination..."
                                label="To"
                                required={true}
                            />

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Date <Text style={styles.required}>*</Text></Text>
                                <TouchableOpacity
                                    style={styles.dateTimeInput}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Text style={styles.dateTimeText}>
                                        {date.toLocaleDateString()}
                                    </Text>
                                    <Ionicons name="calendar-outline" size={24} color="#0a2472" />
                                </TouchableOpacity>
                                {showDatePicker && (
                                    <DateTimePicker
                                        value={date}
                                        mode="date"
                                        display="default"
                                        onChange={(event, selectedDate) => {
                                            setShowDatePicker(false);
                                            if (selectedDate) {
                                                setDate(selectedDate);
                                            }
                                        }}
                                    />
                                )}
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Time <Text style={styles.required}>*</Text></Text>
                                <TouchableOpacity
                                    style={styles.dateTimeInput}
                                    onPress={() => setShowTimePicker(true)}
                                >
                                    <Text style={styles.dateTimeText}>
                                        {time.toLocaleTimeString()}
                                    </Text>
                                    <Ionicons name="time-outline" size={24} color="#0a2472" />
                                </TouchableOpacity>
                                {showTimePicker && (
                                    <DateTimePicker
                                        value={time}
                                        mode="time"
                                        display="default"
                                        onChange={(event, selectedTime) => {
                                            setShowTimePicker(false);
                                            if (selectedTime) {
                                                setTime(selectedTime);
                                            }
                                        }}
                                    />
                                )}
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Description <Text style={styles.required}>*</Text></Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={description}
                                    onChangeText={setDescription}
                                    placeholder="Describe your ride (e.g., type of car, amenities)"
                                    placeholderTextColor="#666"
                                    multiline
                                    numberOfLines={4}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Estimated Time of Arrival <Text style={styles.required}>*</Text></Text>
                                <TextInput
                                    style={styles.input}
                                    value={eta}
                                    onChangeText={setEta}
                                    placeholder="e.g., 2 hours"
                                    placeholderTextColor="#666"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Seats <Text style={styles.required}>*</Text></Text>
                                <TextInput
                                    style={styles.input}
                                    value={seats}
                                    onChangeText={setSeats}
                                    placeholder="Enter the number of seats"
                                    placeholderTextColor="#666"
                                    keyboardType="numeric"
                                />
                            </View>

                            <View style={styles.vehicleSettingsSection}>
                                <Text style={styles.sectionTitle}>Vehicle Settings</Text>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Fuel Efficiency (L/100km)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={fuelEfficiency}
                                        onChangeText={setFuelEfficiency}
                                        placeholder="e.g., 7.0"
                                        placeholderTextColor="#666"
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
                                        placeholderTextColor="#666"
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>License Plate <Text style={styles.required}>*</Text></Text>
                                <TextInput
                                    style={styles.input}
                                    value={licensePlate}
                                    onChangeText={setLicensePlate}
                                    placeholder="Enter your car's license plate"
                                    placeholderTextColor="#666"
                                    returnKeyType="done"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Wheelchair Accessible</Text>
                                <TouchableOpacity
                                    style={styles.checkboxContainer}
                                    onPress={() => setWheelchairAccessible(!wheelchairAccessible)}
                                >
                                    <View style={styles.checkbox}>
                                        <Ionicons
                                            name={wheelchairAccessible ? "checkmark-circle" : "ellipse-outline"}
                                            size={24}
                                            color="#0a2472"
                                        />
                                    </View>
                                    <Text style={styles.checkboxText}>
                                        {wheelchairAccessible ? "Yes, my vehicle is wheelchair-accessible" : "No, my vehicle is not wheelchair-accessible"}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Pricing Preview */}
                            <PricingPreview
                                startLocation={startLocation}
                                endLocation={endLocation}
                                seats={parseInt(seats) || 0}
                                fuelEfficiency={parseFloat(fuelEfficiency) || 7.0}
                                pricePerLiter={parseFloat(pricePerLiter) || 1700}
                                onPriceCalculated={handlePriceCalculated}
                            />

                            <TouchableOpacity
                                style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                                onPress={handleSubmit}
                                disabled={isLoading}
                            >
                                <Text style={styles.submitButtonText}>
                                    {isLoading
                                        ? (isEditing ? 'Updating Ride...' : 'Adding Ride...')
                                        : (isEditing ? 'Update Your Ride' : 'Add Your Ride')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>

                <CustomAlert
                    visible={alertVisible}
                    title={alertConfig.title}
                    message={alertConfig.message}
                    type={alertConfig.type}
                    buttons={alertConfig.buttons}
                    onClose={() => setAlertVisible(false)}
                />
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backgroundGradient: {
        flex: 1,
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    backButton: {
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    formContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    infoSection: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e8f5e8',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
    },
    infoText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#2c3e50',
        flex: 1,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0a2472',
        marginBottom: 8,
    },
    required: {
        color: '#e53e3e',
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        fontSize: 16,
        color: '#333',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    dateTimeInput: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    dateTimeText: {
        fontSize: 16,
        color: '#333',
    },
    vehicleSettingsSection: {
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 8,
        marginBottom: 20,
        borderLeftWidth: 3,
        borderLeftColor: '#4CAF50',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0a2472',
        marginBottom: 16,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    checkbox: {
        marginRight: 12,
    },
    checkboxText: {
        fontSize: 16,
        color: '#333',
        flex: 1,
    },
    submitButton: {
        backgroundColor: '#0a2472',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    submitButtonDisabled: {
        backgroundColor: 'rgba(10, 36, 114, 0.7)',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
}); 