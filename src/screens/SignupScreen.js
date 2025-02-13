import React, { useState, useCallback } from 'react';
import { ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { signup } from '../services/authService';
import { useNavigation } from '@react-navigation/native';
import { Layout, Text, Input, Button, Icon } from '@ui-kitten/components';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from '../styles/AuthStyles';
import { Ionicons } from '@expo/vector-icons';

const SignupScreen = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const navigation = useNavigation();

    const handleSignup = async () => {
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setSuccess(null);
            return;
        }

        try {
            const userData = { name, phone, email, password, passwordConfirm: confirmPassword };
            const response = await signup(userData);

            if (!response || !response.success) {
                throw new Error(response.message || 'Signup failed');
            }
            await AsyncStorage.setItem('token', response.token);

            setSuccess('Signup successful. Logging you in...');
            setError(null);

            setRefreshing(true);
            setTimeout(() => {
                setRefreshing(false);
                navigation.navigate('Home');
                navigation.goBack();
            }, 2000);
        } catch (err) {
            console.log('Error during signup', err.message);
            setError(err.message || 'Error during signup. Please try again.');
            setSuccess(null);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 10000);
    }, []);

    return (
        <Layout style={styles.container}>
            <Ionicons
                name="arrow-back"
                size={24}
                color="black"
                onPress={() => navigation.goBack()}
                style={{ marginBottom: 10 }}
            />

            <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
                <Text category="h4" style={{ textAlign: 'center', marginBottom: 20 }}>Sign Up</Text>

                {/* Error and Success Messages */}
                {error && <Text status="danger" style={{ textAlign: 'center', marginBottom: 15 }}>{error}</Text>}
                {success && <Text status="success" style={{ textAlign: 'center', marginBottom: 15 }}>{success}</Text>}

                <Input placeholder="Enter your full name" value={name} onChangeText={setName} style={styles.input} />
                <Input placeholder="Enter your phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={styles.input} />
                <Input placeholder="Enter your email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" style={styles.input} />
                <Input placeholder="Enter password" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
                <Input placeholder="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry style={styles.input} />

                <Button
                    onPress={handleSignup}
                    style={styles.button}
                    appearance="filled"
                    status="basic"
                    textStyle={styles.buttonText}>
                    Sign Up
                </Button>
            </ScrollView>
        </Layout>
    );
};

export default SignupScreen;
