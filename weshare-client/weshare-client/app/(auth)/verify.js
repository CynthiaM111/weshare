import { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { Button, Input, Text, Layout } from '@ui-kitten/components';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Verify() {
    const [verificationCode, setVerificationCode] = useState('');
    const [verificationData, setVerificationData] = useState(null);
    const { user, logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const loadVerificationData = async () => {
            try {
                const storedData = await AsyncStorage.getItem('verificationData');
                if (storedData) {
                    setVerificationData(JSON.parse(storedData));
                } else if (!user) {
                    router.replace('/(auth)/login');
                }
            } catch (error) {
                console.error('Error loading verification data:', error);
                router.replace('/(auth)/login');
            }
        };

        loadVerificationData();
    }, []);

    const handleVerification = async () => {
        try {
            console.log('Attempting verification with:', {
                contact_number: verificationData?.contact_number || user?.contact_number,
                verificationCode
            });

            const response = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/auth/verify-phone`, {
                contact_number: verificationData?.contact_number || user?.contact_number,
                verificationCode
            });

            if (response.status === 200) {
                console.log('Verification successful');
                await AsyncStorage.removeItem('verificationData');
                Alert.alert('Success', 'Phone number verified successfully');

                // If we have user data, use it for routing
                if (user) {
                    const route = user.role === 'agency' ? '/(agency)' :
                        user.role === 'agency_employee' ? '/(employee)' :
                            '/(home)';
                    router.replace(route);
                } else {
                    // Otherwise, go to login
                    router.replace('/(auth)/login');
                }
            }
        } catch (error) {
            console.error('Verification error:', error.response?.data || error);
            Alert.alert('Error', error.response?.data?.error || 'Verification failed');
        }
    };

    const handleResendCode = async () => {
        try {
            console.log('Attempting to resend code to:', verificationData?.contact_number || user?.contact_number);

            const response = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/auth/resend-verification`, {
                contact_number: verificationData?.contact_number || user?.contact_number
            });

            if (response.status === 200) {
                console.log('Resend successful');
                Alert.alert('Success', 'New verification code sent successfully');
            }
        } catch (error) {
            console.error('Resend error:', error.response?.data || error);
            Alert.alert('Error', error.response?.data?.error || 'Failed to resend verification code');
        }
    };

    // Redirect to login if no verification data and no user
    useEffect(() => {
        if (!verificationData && !user) {
            router.replace('/(auth)/login');
        }
    }, [verificationData, user]);

    return (
        <Layout style={styles.container}>
            <View style={styles.formContainer}>
                <Text category='h1' style={styles.title}>Verify Your Phone</Text>
                <Text category='s1' style={styles.subtitle}>Enter the verification code sent to your messages</Text>

                <Input
                    style={styles.input}
                    placeholder="Verification Code"
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                    keyboardType="number-pad"
                    maxLength={6}
                />

                <Button
                    style={styles.button}
                    onPress={handleVerification}
                    disabled={!verificationCode}
                >
                    VERIFY
                </Button>

                <Button
                    style={styles.resendButton}
                    onPress={handleResendCode}
                    appearance="ghost"
                >
                    Resend Code
                </Button>

                <Button
                    style={styles.logoutButton}
                    onPress={logout}
                    appearance="ghost"
                    status="danger"
                >
                    Logout
                </Button>
            </View>
        </Layout>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    formContainer: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    title: {
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        textAlign: 'center',
        marginBottom: 30,
    },
    input: {
        marginBottom: 20,
    },
    button: {
        marginBottom: 10,
    },
    resendButton: {
        marginBottom: 10,
    },
    logoutButton: {
        marginTop: 20,
    },
}); 