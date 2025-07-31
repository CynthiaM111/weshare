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
import { useTranslation } from 'react-i18next';
import CustomAlert from '../../components/CustomAlert';
import LocationPicker from '../../components/LocationPicker';
import PricingPreview from '../../components/PricingPreview';
import LanguageSwitcher from '../../components/LanguageSwitcher';

export default function AddPrivateRideScreen() {
    const { t } = useTranslation();
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
    // const [fuelEfficiency, setFuelEfficiency] = useState('7.0');
    // const [pricePerLiter, setPricePerLiter] = useState('1700');
    const [price, setPrice] = useState('');
    const [wheelchairAccessible, setWheelchairAccessible] = useState(false);
    const [startLocationValid, setStartLocationValid] = useState(false);
    const [endLocationValid, setEndLocationValid] = useState(false);
    // const [systemSettings, setSystemSettings] = useState(null);
    // const [fuelEfficiencyError, setFuelEfficiencyError] = useState('');

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

    // Validate fuel efficiency in real-time
    // const validateFuelEfficiency = (value) => {
    //     const numValue = parseFloat(value);

    //     if (!value || value.trim() === '') {
    //         setFuelEfficiencyError(t('validation.fuelEfficiencyRequired'));
    //         return false;
    //     }

    //     if (isNaN(numValue)) {
    //         setFuelEfficiencyError(t('validation.invalidNumber'));
    //         return false;
    //     }

    //     if (systemSettings) {
    //         if (numValue < systemSettings.fuelEfficiencyMin || numValue > systemSettings.fuelEfficiencyMax) {
    //             setFuelEfficiencyError(t('validation.mustBeBetween', {
    //                 min: systemSettings.fuelEfficiencyMin,
    //                 max: systemSettings.fuelEfficiencyMax
    //             }));
    //             return false;
    //         }
    //     } else {
    //         if (numValue < 1 || numValue > 20) {
    //             setFuelEfficiencyError(t('validation.mustBeBetween', { min: 1, max: 20 }));
    //             return false;
    //         }
    //     }

    //     setFuelEfficiencyError('');
    //     return true;
    // };

    // const handleFuelEfficiencyChange = (value) => {
    //     setFuelEfficiency(value);
    //     validateFuelEfficiency(value);
    // };

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

    // Fetch system settings
    // const { execute: fetchSystemSettings } = useApi(async () => {
    //     const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/system/settings`);
    //     return response.data.settings;
    // });

    // useEffect(() => {
    //     if (user?.token) {
    //         fetchSystemSettings().then(settings => {
    //             setSystemSettings(settings);
    //             setPricePerLiter(settings.fuelPricePerLiter.toString());
    //             // Validate current fuel efficiency value
    //             validateFuelEfficiency(fuelEfficiency);
    //         }).catch(error => {
    //             console.error('Failed to fetch system settings:', error);
    //             // Use default values if fetch fails
    //             setSystemSettings({
    //                 fuelPricePerLiter: 1700,
    //                 fuelEfficiencyMin: 6.0,
    //                 fuelEfficiencyMax: 10.0
    //             });
    //             // Validate current fuel efficiency value with defaults
    //             validateFuelEfficiency(fuelEfficiency);
    //         });
    //     }
    // }, [user?.token]);

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
        // Check if user has a profile picture
        if (!user?.photoUrl) {
            showAlert(
                t('alerts.profilePictureRequired'),
                t('alerts.profilePictureMessage'),
                'warning',
                [
                    {
                        text: t('alerts.addProfilePicture'),
                        onPress: () => router.push('/(profile)'),
                    },
                    {
                        text: t('common.cancel'),
                        onPress: () => setAlertVisible(false),
                    }
                ]
            );
            return;
        }

        if (!startLocationValid || !endLocationValid) {
            showAlert(t('validation.invalidLocations'), t('validation.invalidLocations'), 'warning');
            return;
        }

        if (!startLocation?.latitude || !endLocation?.latitude || !description || !eta || !licensePlate || !seats || !price) {
            showAlert(t('validation.missingInformation'), t('validation.missingInformation'), 'warning');
            return;
        }

        // Validate numeric fields
        const numSeats = parseInt(seats);
        const numEta = parseInt(eta);
        const numPrice = parseFloat(price);

        if (isNaN(numSeats) || numSeats < 1) {
            showAlert(t('alerts.invalidSeats'), t('alerts.invalidSeatsMessage'), 'warning');
            return;
        }

        if (isNaN(numEta) || numEta < 1) {
            showAlert(t('alerts.invalidETA'), t('alerts.invalidETAMessage'), 'warning');
            return;
        }

        if (isNaN(numPrice) || numPrice <= 0) {
            showAlert('Invalid Price', 'Please enter a valid price greater than 0.', 'warning');
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
                price: numPrice,
                wheelchairAccessible
            };

            await addPrivateRide(rideData);
            showAlert(
                t('alerts.success'),
                t('alerts.rideCreatedMessage', { action: isEditing ? t('rides.rideUpdated') : t('rides.rideCreated') }),
                'success',
                [
                    {
                        text: t('alerts.viewMyRides'),
                        onPress: () => router.push('/(private)'),
                    },
                    {
                        text: t('common.ok'),
                        onPress: () => router.back(),
                    }
                ]
            );
        } catch (error) {
            console.error('Error submitting ride:', error);
            let userMessage = t('alerts.unexpectedError');

            if (error?.response?.data?.error) {
                userMessage = error.response.data.error;
            } else if (error?.userMessage) {
                userMessage = error.userMessage;
            } else if (error?.message) {
                userMessage = error.message;
            }

            showAlert(t('common.error'), userMessage, 'error');
        }
    };

    const handlePriceCalculated = (pricingData) => {
        // setCalculatedPrice(pricingData); // This state variable is no longer used
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
                colors={['#0a2472', '#1E90FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
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
                        {isEditing ? t('rideForm.updatePrivateRide') : t('rideForm.createPrivateRide')}
                    </Text>
                    <View style={styles.headerPlaceholder}>
                        <LanguageSwitcher style={styles.languageSwitcher} compact={true} />
                    </View>
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
                                <FontAwesome5 name="map-marker-alt" size={20} color="#0a2472" />
                                <Text style={styles.sectionTitle}>{t('rideForm.locationDetails')}</Text>
                            </View>

                            <LocationPicker
                                value={startLocation}
                                onLocationSelect={setStartLocation}
                                placeholder={t('rideForm.enterPickupLocation')}
                                label={t('rideForm.pickupLocation')}
                                required={true}
                                onValidityChange={setStartLocationValid}
                            />

                            <LocationPicker
                                value={endLocation}
                                onLocationSelect={setEndLocation}
                                placeholder={t('rideForm.enterDestination')}
                                label={t('rideForm.destination')}
                                required={true}
                                onValidityChange={setEndLocationValid}
                            />
                        </View>

                        {/* Trip Details Section */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <FontAwesome5 name="calendar-alt" size={20} color="#0a2472" />
                                <Text style={styles.sectionTitle}>{t('rideForm.tripDetails')}</Text>
                            </View>

                            {/* Date and Time */}
                            <View style={styles.row}>
                                <TouchableOpacity
                                    style={styles.dateTimeButton}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <FontAwesome5 name="calendar" size={16} color="#0a2472" />
                                    <Text style={styles.dateTimeText}>{formatDate(date)}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.dateTimeButton}
                                    onPress={() => setShowTimePicker(true)}
                                >
                                    <FontAwesome5 name="clock" size={16} color="#0a2472" />
                                    <Text style={styles.dateTimeText}>{formatTime(time)}</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Description */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>
                                    {t('rideForm.description')} <Text style={styles.required}>*</Text>
                                </Text>
                                <TextInput
                                    style={styles.textArea}
                                    value={description}
                                    onChangeText={setDescription}
                                    placeholder={t('rideForm.descriptionPlaceholder')}
                                    placeholderTextColor="#64748b"
                                    multiline
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                />
                            </View>

                            {/* ETA */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>
                                    {t('rideForm.estimatedTravelTime')} <Text style={styles.required}>*</Text>
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
                                <FontAwesome5 name="car" size={20} color="#0a2472" />
                                <Text style={styles.sectionTitle}>{t('rideForm.vehicleDetails')}</Text>
                            </View>

                            {/* License Plate */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>
                                    {t('rideForm.licensePlate')} <Text style={styles.required}>*</Text>
                                </Text>
                                <TextInput
                                    style={styles.input}
                                    value={licensePlate}
                                    onChangeText={setLicensePlate}
                                    placeholder={t('rideForm.licensePlatePlaceholder')}
                                    placeholderTextColor="#64748b"
                                    autoCapitalize="characters"
                                />
                            </View>

                            {/* Seats */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>
                                    {t('rideForm.availableSeats')} <Text style={styles.required}>*</Text>
                                </Text>
                                <TextInput
                                    style={styles.input}
                                    value={seats}
                                    onChangeText={setSeats}
                                    placeholder={t('rideForm.seatsPlaceholder')}
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
                                    <Text style={styles.checkboxLabel}>{t('rideForm.wheelchairAccessible')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Price Section */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <FontAwesome5 name="money-bill-wave" size={20} color="#0a2472" />
                                <Text style={styles.sectionTitle}>{t('rideForm.pricePerSeat')}</Text>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>
                                    {t('rideForm.priceLabel')} <Text style={styles.required}>*</Text>
                                </Text>
                                <TextInput
                                    style={styles.input}
                                    value={price}
                                    onChangeText={setPrice}
                                    placeholder={t('rideForm.pricePlaceholder')}
                                    placeholderTextColor="#64748b"
                                    keyboardType="numeric"
                                />
                                <View style={styles.tipContainer}>
                                    <FontAwesome5 name="lightbulb" size={16} color="#f59e0b" />
                                    <Text style={styles.tipText}>
                                        {t('rideForm.priceTip')}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Fuel Details Section - Commented Out */}
                        {/* <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <FontAwesome5 name="gas-pump" size={20} color="#0a2472" />
                                <Text style={styles.sectionTitle}>{t('rideForm.fuelDetails')}</Text>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>
                                    {t('rideForm.fuelEfficiency')}
                                    {systemSettings && (
                                        <Text style={styles.validationText}>
                                            {' '}({systemSettings.fuelEfficiencyMin}-{systemSettings.fuelEfficiencyMax})
                                        </Text>
                                    )}
                                </Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        fuelEfficiencyError && styles.inputError
                                    ]}
                                    value={fuelEfficiency}
                                    onChangeText={handleFuelEfficiencyChange}
                                    placeholder={t('rideForm.fuelEfficiencyPlaceholder')}
                                    placeholderTextColor="#64748b"
                                    keyboardType="numeric"
                                />
                                {fuelEfficiencyError && (
                                    <Text style={styles.errorText}>{fuelEfficiencyError}</Text>
                                )}
                                {!fuelEfficiencyError && systemSettings && (
                                    <Text style={styles.helperText}>
                                        {t('rideForm.validRange', {
                                            min: systemSettings.fuelEfficiencyMin,
                                            max: systemSettings.fuelEfficiencyMax
                                        })}
                                    </Text>
                                )}
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>{t('rideForm.fuelPrice')}</Text>
                                <TextInput
                                    style={[styles.input, styles.disabledInput]}
                                    value={pricePerLiter}
                                    editable={false}
                                    placeholder="Set by admin"
                                    placeholderTextColor="#64748b"
                                />
                                <Text style={styles.disabledText}>{t('rideForm.setByAdmin')}</Text>
                            </View>
                        </View> */}

                        {/* Pricing Preview - Commented Out */}
                        {/* {startLocation && endLocation && seats && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <FontAwesome5 name="calculator" size={20} color="#0a2472" />
                                    <Text style={styles.sectionTitle}>{t('rideForm.pricingPreview')}</Text>
                                </View>
                                <PricingPreview
                                    startLocation={startLocation}
                                    endLocation={endLocation}
                                    seats={seats}
                                    price={price}
                                    onPriceCalculated={handlePriceCalculated}
                                // pricing={calculatedPrice} // This state variable is no longer used
                                />
                            </View>
                        )} */}

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                (isLoading || !price) && styles.submitButtonDisabled
                            ]}
                            onPress={handleSubmit}
                            disabled={isLoading || !price}
                        >
                            <Text style={styles.submitButtonText}>
                                {isLoading ? (isEditing ? t('rideForm.updating') : t('rideForm.creating')) : (isEditing ? t('rideForm.updateRide') : t('rideForm.createRide'))}
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
    headerPlaceholder: {
        width: 32,
        height: 32,
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
    inputError: {
        borderColor: '#ef4444',
        borderWidth: 2,
    },
    errorText: {
        fontSize: 14,
        color: '#ef4444',
        marginTop: 8,
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
        backgroundColor: '#0a2472',
        borderColor: '#0a2472',
    },
    checkboxLabel: {
        fontSize: 16,
        color: '#374151',
        flex: 1,
    },
    submitButton: {
        backgroundColor: '#0a2472',
        paddingVertical: 18,
        paddingHorizontal: 32,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 20,
        shadowColor: '#0a2472',
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
    disabledInput: {
        backgroundColor: '#f3f4f6', // A light gray background for disabled inputs
        color: '#9ca3af', // A muted color for disabled text
        opacity: 0.7, // Slightly transparent for disabled effect
    },
    disabledText: {
        fontSize: 14,
        color: '#9ca3af',
        marginTop: 8,
        textAlign: 'center',
    },
    validationText: {
        fontSize: 14,
        color: '#ef4444',
        marginLeft: 8,
    },
    helperText: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 8,
    },
    tipContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 12,
        backgroundColor: '#fef3c7',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#fde68a',
    },
    tipText: {
        fontSize: 14,
        color: '#d97706',
        marginLeft: 8,
        flex: 1,
        lineHeight: 20,
    },
}); 