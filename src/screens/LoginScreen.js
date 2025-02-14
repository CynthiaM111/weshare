import { useState } from 'react';
import { login } from '../services/authService';
import { useNavigation } from '@react-navigation/native';
import { ScrollView, RefreshControl } from 'react-native';
import { Layout, Input, Button, Text } from '@ui-kitten/components';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import styles from '../styles/AuthStyles'; // Reuse the same styles

const LoginScreen = () => {
    const [emailOrPhone, setEmailOrPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const navigation = useNavigation();

    const handleLogin = async () => {
        try {
            const response = await login(emailOrPhone, password);
            await AsyncStorage.setItem('token', response.token);
            navigation.navigate('Home');
            navigation.goBack();
        } catch (err) {
            setError('Invalid credentials. Try again.');
        }
    };

    return (
        <Layout style={styles.container}>
            <Ionicons
                name="arrow-back"
                size={24}
                color="black"
                onPress={() => navigation.goBack()}
                style={{ marginBottom: 10 }}
            />

            <ScrollView>
                <Text category="h4" style={{ textAlign: 'center', marginBottom: 20 }}>Login</Text>

                {error && <Text status="danger" style={{ textAlign: 'center', marginBottom: 15 }}>{error}</Text>}

                <Input
                    placeholder="Email or Phone"
                    value={emailOrPhone}
                    onChangeText={setEmailOrPhone}
                    style={styles.input}
                />
                <Input
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    style={styles.input}
                />

                <Button
                    onPress={handleLogin}
                    style={styles.button}
                    appearance="filled"
                    status="basic"
                    textStyle={styles.buttonText}
                >
                    Login
                </Button>
            </ScrollView>
        </Layout>
    );
};

export default LoginScreen;