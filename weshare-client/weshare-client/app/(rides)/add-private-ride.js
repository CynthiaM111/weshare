import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

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

    const { execute: addPrivateRide, isLoading } = useApi(async (rideData) => {
        const response = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/rides`, rideData, {
            headers: {
                'Authorization': `Bearer ${user.token}`
            }
        });

        if (response.status !== 201) {
            throw new Error('Failed to add private ride');
        }

        return response.data;
    });

    const handleSubmit = async () => {
        if (!from || !to || !description || !eta || !licensePlate) {
            Alert.alert('Error', 'Please fill in all required fields');
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
                estimatedArrivalTime: parseInt(eta),
                licensePlate,
                isPrivate: true
            };

            await addPrivateRide(rideData);
            Alert.alert(
                'Success',
                'Private ride added successfully',
                [
                    {
                        text: 'View My Rides',
                        onPress: () => router.push({
                            pathname: '/(rides)',
                            params: { showPrivateRides: true }
                        }),
                    },
                    {
                        text: 'OK',
                        onPress: () => router.back(),
                    }
                ]
            );
        } catch (error) {
            console.error('Error submitting ride:', error);
            Alert.alert('Error', 'Failed to add private ride. Please try again.');
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
                            <Text style={styles.headerTitle}>Add Private Ride</Text>
                        </View>

                        <View style={styles.formContainer}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>From</Text>
                                <TextInput
                                    style={styles.input}
                                    value={from}
                                    onChangeText={setFrom}
                                    placeholder="Enter departure location"
                                    placeholderTextColor="#666"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>To</Text>
                                <TextInput
                                    style={styles.input}
                                    value={to}
                                    onChangeText={setTo}
                                    placeholder="Enter destination"
                                    placeholderTextColor="#666"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Date</Text>
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
                                <Text style={styles.label}>Time</Text>
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
                                <Text style={styles.label}>Description</Text>
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
                                <Text style={styles.label}>Estimated Time of Arrival</Text>
                                <TextInput
                                    style={styles.input}
                                    value={eta}
                                    onChangeText={setEta}
                                    placeholder="e.g., 2 hours"
                                    placeholderTextColor="#666"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>License Plate</Text>
                                <TextInput
                                    style={styles.input}
                                    value={licensePlate}
                                    onChangeText={setLicensePlate}
                                    placeholder="Enter your car's license plate"
                                    placeholderTextColor="#666"
                                    returnKeyType="done"
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                                onPress={handleSubmit}
                                disabled={isLoading}
                            >
                                <Text style={styles.submitButtonText}>
                                    {isLoading ? 'Adding Ride...' : 'Add Private Ride'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
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
}); 