import React, { useCallback, useState } from 'react';
import { View, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { Button, Text, Layout } from '@ui-kitten/components';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { isAuthenticated, logout } from '../services/authService';
import styles from '../styles/AuthStyles';
import { useFocusEffect } from '@react-navigation/native';

export default function AccountScreen({ navigation }) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const checkAuthStatus = async () => {
        try {
            const authStatus = await isAuthenticated();
            setIsLoggedIn(authStatus);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            setSuccess(null);
            checkAuthStatus();
        }, [])
    );

    const handleLogout = async () => {
        try {
            setLoading(true);
            const response = await logout();
            setSuccess(response.message);
            setIsLoggedIn(false);
            await AsyncStorage.removeItem('token');
            setTimeout(() => {
                navigation.navigate('Login');
            }, 1500);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        checkAuthStatus().finally(() => setRefreshing(false));
    }, []);

    if (loading) {
        return (
            <Layout style={[styles.container, { justifyContent: 'center' }]}>
                <ActivityIndicator size="large" />
            </Layout>
        );
    }

    return (
        <Layout style={styles.container}>
            <Ionicons
                name="arrow-back"
                size={24}
                color="black"
                onPress={() => navigation.goBack()}
                style={{ marginBottom: 10 }}
            />

            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {error && (
                    <Text status="danger" style={{ textAlign: 'center', marginBottom: 15 }}>
                        {error}
                    </Text>
                )}

                {success && (
                    <Text status="success" style={{ textAlign: 'center', marginBottom: 15 }}>
                        {success}
                    </Text>
                )}

                {isLoggedIn ? (
                    <Button
                        onPress={handleLogout}
                        style={styles.button}
                        appearance="filled"
                        status="basic"
                        textStyle={styles.buttonText}
                    >
                        Logout
                    </Button>
                ) : (
                    <>
                        <Button
                            onPress={() => navigation.navigate('Login')}
                            style={styles.button}
                            appearance="filled"
                            status="basic"
                            textStyle={styles.buttonText}
                        >
                            Login
                        </Button>
                        <Button
                            onPress={() => navigation.navigate('Signup')}
                            style={[styles.button, { marginTop: 10 }]}
                            appearance="filled"
                            status="basic"
                            textStyle={styles.buttonText}
                        >
                            Sign Up
                        </Button>
                    </>
                )}
            </ScrollView>
        </Layout>
    );
}
