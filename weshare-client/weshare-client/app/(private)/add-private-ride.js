import { View, Text, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';
import CustomAlert from '../../components/CustomAlert';

export default function AddPrivateRideScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
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
    const [price, setPrice] = useState('');
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
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Add Private Ride</Text>
                    </View>

                    <View style={styles.loginPromptContainer}>
                        <View style={styles.loginPromptCard}>
                            <View style={styles.loginPromptIcon}>
                                <Ionicons name="car-sport" size={48} color="#0a2472" />
                            </View>
                            <Text style={styles.loginPromptTitle}>Login Required</Text>
                            <Text style={styles.loginPromptText}>
                                Please login to create and share your private rides with other travelers.
                            </Text>
                            <TouchableOpacity
                                style={styles.loginPromptButton}
                                onPress={() => router.push('/(auth)/login')}
                            >
                                <Ionicons name="log-in" size={16} color="#fff" />
                                <Text style={styles.loginPromptButtonText}>LOGIN / SIGN UP</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    // Check if user is verified
    if (!user.isVerified) {
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
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Add Private Ride</Text>
                    </View>

                    <View style={styles.loginPromptContainer}>
                        <View style={styles.loginPromptCard}>
                            <View style={styles.loginPromptIcon}>
                                <Ionicons name="shield-checkmark" size={48} color="#0a2472" />
                            </View>
                            <Text style={styles.loginPromptTitle}>Verification Required</Text>
                            <Text style={styles.loginPromptText}>
                                Only verified drivers can post private rides. Please verify your account by completing the phone verification process.
                            </Text>
                            <TouchableOpacity
                                style={styles.loginPromptButton}
                                onPress={() => router.push('/(auth)/verify')}
                            >
                                <Ionicons name="shield-checkmark" size={16} color="#fff" />
                                <Text style={styles.loginPromptButtonText}>VERIFY ACCOUNT</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    useEffect(() => {
        if (params?.ride && !hasInitialized.current) {
            try {
                const parsedRide = JSON.parse(params.ride);
                setIsEditing(true);
                setRideId(parsedRide._id);
                setFrom(parsedRide.from);
                setTo(parsedRide.to);
                setDescription(parsedRide.description);
                setLicensePlate(parsedRide.licensePlate);
                setEta(parsedRide.estimatedArrivalTime.toString());
                setSeats(parsedRide.seats.toString());
                setPrice(parsedRide.price.toString());
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
        if (!from || !to || !description || !eta || !licensePlate || !seats || price === '') {
            showAlert('Missing Information', 'Please fill in all required fields', 'warning');
            return;
        }

        // Validate numeric fields
        const numSeats = parseInt(seats);
        const numPrice = parseFloat(price);
        const numEta = parseInt(eta);

        if (isNaN(numSeats) || numSeats < 1) {
            showAlert('Invalid Seats', 'Please enter a valid number of seats (minimum 1)', 'warning');
            return;
        }

        if (isNaN(numPrice) || numPrice < 0) {
            showAlert('Invalid Price', 'Please enter a valid price (0 or higher)', 'warning');
            return;
        }

        if (isNaN(numEta) || numEta < 1) {
            showAlert('Invalid ETA', 'Please enter a valid ETA in hours (minimum 1)', 'warning');
            return;
        }

        try {
            const formattedDate = date.toISOString().split('T')[0];
            const formattedTime = time.toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit'
            });

            const rideData = {
                from,
                to,
                date: formattedDate,
                time: formattedTime,
                description,
                estimatedArrivalTime: numEta,
                licensePlate,
                isPrivate: true,
                seats: numSeats,
                price: numPrice,
                wheelchairAccessible
            };

            await addPrivateRide(rideData);
            showAlert(
                'Success!',
                `Private ride ${isEditing ? 'updated' : 'added'} successfully`,
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

            // Handle specific backend validation errors with user-friendly messages
            let userMessage = 'An error occurred while processing your request.';

            if (error?.response?.data?.error) {
                const backendError = error.response.data.error;

                // Map backend errors to user-friendly messages
                switch (true) {
                    case backendError.includes('verified drivers'):
                        userMessage = 'Only verified drivers can post private rides. Please verify your account first by completing the phone verification process.';
                        break;
                    case backendError.includes('maximum limit of 5 rides'):
                        userMessage = 'You have reached the daily limit of 5 rides. Please try again tomorrow.';
                        break;
                    case backendError.includes('already have a ride scheduled'):
                        userMessage = 'You already have a ride scheduled for this time. Please choose a different time (minimum 30 minutes apart).';
                        break;
                    case backendError.includes('wait at least 30 minutes'):
                        userMessage = 'Please wait at least 30 minutes between posting rides.';
                        break;
                    case backendError.includes('wheelchair-accessible'):
                        userMessage = 'Please specify if your vehicle is wheelchair-accessible by selecting Yes or No.';
                        break;
                    case backendError.includes('within 30 minutes of departure'):
                        userMessage = 'Cannot edit ride details within 30 minutes of departure. Please contact passengers directly if changes are needed.';
                        break;
                    default:
                        userMessage = backendError;
                }
            } else if (error?.userMessage) {
                userMessage = error.userMessage;
            } else if (error?.message) {
                userMessage = error.message;
            }

            showAlert('Error', userMessage, 'error');
        }
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
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>From <Text style={styles.required}>*</Text></Text>
                                <TextInput
                                    style={styles.input}
                                    value={from}
                                    onChangeText={setFrom}
                                    placeholder="Enter departure location"
                                    placeholderTextColor="#666"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>To <Text style={styles.required}>*</Text></Text>
                                <TextInput
                                    style={styles.input}
                                    value={to}
                                    onChangeText={setTo}
                                    placeholder="Enter destination"
                                    placeholderTextColor="#666"
                                />
                            </View>

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

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Price (RWF) <Text style={styles.required}>*</Text></Text>
                                <TextInput
                                    style={styles.input}
                                    value={price}
                                    onChangeText={setPrice}
                                    placeholder="Enter the price (0 for negotiable)"
                                    placeholderTextColor="#666"
                                    keyboardType="numeric"
                                />
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
                                <Text style={styles.label}>Wheelchair Accessible <Text style={styles.required}>*</Text></Text>
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
            </SafeAreaView>

            {/* Custom Alert - moved to root level */}
            <CustomAlert
                visible={alertVisible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                buttons={alertConfig.buttons}
                onDismiss={hideAlert}
            />
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
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0a2472',
        marginBottom: 8,
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
    loginPromptContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginPromptCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    loginPromptIcon: {
        alignItems: 'center',
        marginBottom: 20,
    },
    loginPromptTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0a2472',
        marginBottom: 10,
    },
    loginPromptText: {
        color: '#333',
        marginBottom: 20,
    },
    loginPromptButton: {
        backgroundColor: '#0a2472',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loginPromptButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
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
        marginRight: 10,
    },
    checkboxText: {
        fontSize: 16,
        color: '#333',
    },
    required: {
        color: 'red',
        fontWeight: 'bold',
    },
}); 