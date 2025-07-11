import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    Alert,
    ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function DriverVerification() {
    const router = useRouter();
    const { user } = useAuth();
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        dateOfBirth: new Date(),
        nationalId: '',
        vehicleLicensePlate: ''
    });

    const {
        error: verificationError,
        isLoading: isSubmitting,
        execute: submitVerification
    } = useApi(async () => {
        const isUpdate = user?.driverProfile?.verifiedDriver;
        const url = isUpdate
            ? `${process.env.EXPO_PUBLIC_API_URL}/driver-verification/profile`
            : `${process.env.EXPO_PUBLIC_API_URL}/driver-verification/verify`;

        const method = isUpdate ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user?.token}`
            },
            body: JSON.stringify({
                ...formData,
                dateOfBirth: formData.dateOfBirth.toISOString().split('T')[0]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Verification failed');
        }

        return response.json();
    });

    // Add this effect to pre-fill the form if user is already verified
    useEffect(() => {
        const fetchExistingProfile = async () => {
            try {
                const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/driver-verification/profile`, {
                    headers: {
                        'Authorization': `Bearer ${user?.token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.verifiedDriver && data.driverProfile) {
                        setFormData({
                            fullName: data.driverProfile.fullName || '',
                            dateOfBirth: new Date(data.driverProfile.dateOfBirth),
                            nationalId: data.driverProfile.nationalId || '',
                            vehicleLicensePlate: data.driverProfile.vehicleLicensePlate || ''
                        });
                    }
                }
            } catch (error) {
                console.error('Error fetching existing profile:', error);
            }
        };

        if (user) {
            fetchExistingProfile();
        }
    }, [user]);

    const handleSubmit = async () => {
        if (!formData.fullName.trim() || !formData.nationalId.trim() || !formData.vehicleLicensePlate.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (formData.nationalId.length !== 16) {
            Alert.alert('Error', 'National ID must be exactly 16 digits');
            return;
        }

        try {
            await submitVerification();
            const isUpdate = user?.driverProfile?.verifiedDriver;
            Alert.alert(
                'Success',
                isUpdate
                    ? 'Driver profile updated successfully!'
                    : 'Driver verification submitted successfully! You can now post private rides.',
                [
                    {
                        text: 'OK',
                        onPress: () => router.back()
                    }
                ]
            );
        } catch (error) {
            // Error is handled by useApi
        }
    };

    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setFormData(prev => ({ ...prev, dateOfBirth: selectedDate }));
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
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <FontAwesome5 name="arrow-left" size={20} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Driver Verification</Text>
                    <View style={styles.headerPlaceholder} />
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.card}>
                        <View style={styles.iconContainer}>
                            <FontAwesome5 name="user-check" size={48} color="#0a2472" />
                        </View>

                        <Text style={styles.title}>Become a Verified Driver</Text>
                        <Text style={styles.subtitle}>
                            Complete this form to verify your identity and start posting private rides
                        </Text>

                        <View style={styles.form}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Full Name</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.fullName}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, fullName: text }))}
                                    placeholder="Enter your full name"
                                    placeholderTextColor="#999"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Date of Birth</Text>
                                <TouchableOpacity
                                    style={styles.dateInput}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Text style={styles.dateText}>
                                        {formData.dateOfBirth.toLocaleDateString()}
                                    </Text>
                                    <FontAwesome5 name="calendar" size={16} color="#666" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>National ID Number</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.nationalId}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, nationalId: text }))}
                                    placeholder="Enter 16-digit national ID"
                                    placeholderTextColor="#999"
                                    keyboardType="numeric"
                                    maxLength={16}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Vehicle License Plate</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.vehicleLicensePlate}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, vehicleLicensePlate: text.toUpperCase() }))}
                                    placeholder="Enter license plate"
                                    placeholderTextColor="#999"
                                    autoCapitalize="characters"
                                    maxLength={7}
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={isSubmitting}
                        >
                            <FontAwesome5
                                name={isSubmitting ? "spinner" : "check-circle"}
                                size={16}
                                color="#fff"
                                style={styles.buttonIcon}
                            />
                            <Text style={styles.submitButtonText}>
                                {isSubmitting ? 'Submitting...' : 'Submit Verification'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                {showDatePicker && (
                    <DateTimePicker
                        value={formData.dateOfBirth}
                        mode="date"
                        display="default"
                        onChange={handleDateChange}
                        maximumDate={new Date()}
                    />
                )}
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
    content: {
        flex: 1,
        padding: 16,
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: 24,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0a2472',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22,
    },
    form: {
        marginBottom: 32,
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
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 16,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    dateInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 16,
        backgroundColor: '#fff',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateText: {
        fontSize: 16,
        color: '#333',
    },
    submitButton: {
        flexDirection: 'row',
        backgroundColor: '#2196F3',
        padding: 16,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    submitButtonDisabled: {
        backgroundColor: '#ccc',
        opacity: 0.7,
    },
    submitButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    buttonIcon: {
        marginRight: 8,
    },
    notVerifiedTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FF9800',
        textAlign: 'center',
        marginBottom: 12,
    },
    notVerifiedText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 22,
    },
    editButton: {
        flexDirection: 'row',
        backgroundColor: '#4CAF50',
        padding: 16,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    editButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    verificationCard: {
        backgroundColor: '#f9f9f9',
        padding: 20,
        borderRadius: 12,
        marginBottom: 20,
        alignItems: 'center',
    },
    verificationItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 10,
    },
    verificationLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0a2472',
    },
    verificationValue: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
}); 