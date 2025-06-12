import { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Link, useRouter } from 'expo-router';
import { Button, Input, Text, Layout } from '@ui-kitten/components';

export default function Login() {
    const [password, setPassword] = useState('');
    const [contact_number, setContact_number] = useState('');

    const { login, loginError, logout } = useAuth();
    const router = useRouter();

    const handleLogin = async () => {
        try {
            // Format phone number to match server validation
            const formattedPhoneNumber = `+250${contact_number}`;
            await login(formattedPhoneNumber, password);
        } catch (error) {
            console.error('Login error:', error);
        }
    };

    useEffect(() => {
        if (loginError) {
            const userMessage =
                loginError?.userMessage ||
                loginError?.response?.data?.error ||
                "We couldn't log you in at this time. Check your credentials and try again.";

            Alert.alert('Login Failed', userMessage, [
                {
                    text: 'Try Again',
                    onPress: () => {
                        // Clear any stored data on failed login attempt
                        logout();
                        router.push('/(auth)/login');
                    }
                },
                { text: 'Cancel', style: 'cancel' }
            ]);
        }
    }, [loginError]);

    return (
        <Layout style={styles.container}>
            <View style={styles.formContainer}>
                <Text category='h1' style={styles.title}>Welcome Back</Text>
                <Text category='s1' style={styles.subtitle}>Sign in to your account</Text>

                <Input
                    style={styles.input}
                    placeholder="Phone Number"
                    value={contact_number}
                    onChangeText={setContact_number}
                    autoCapitalize="none"
                    keyboardType="phone-pad"
                    maxLength={9}
                />
                <Text style={styles.phoneHint}>Format: 7XXXXXXXX (e.g. 785123456)</Text>

                <Input
                    style={styles.input}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <Button
                    style={styles.button}
                    onPress={handleLogin}
                    disabled={!contact_number || !password}
                >
                    LOGIN
                </Button>

                <Link href="/(auth)/signup" style={styles.link}>
                    <Text category='s1' status='info'>Don't have an account? Sign up</Text>
                </Link>
            </View>
        </Layout>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    formContainer: {
        flex: 1,
        padding: 20,
        width: '100%',
        maxWidth: 500,
        alignSelf: 'center',
        justifyContent: 'center',
    },
    title: {
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        textAlign: 'center',
        marginBottom: 30,
        color: '#8F9BB3',
    },
    input: {
        marginBottom: 15,
    },
    button: {
        marginTop: 20,
        marginBottom: 30,
        backgroundColor: 'royalblue',
    },
    link: {
        alignSelf: 'center',
    },
    phoneHint: {
        fontSize: 12,
        color: '#8F9BB3',
        marginBottom: 10,
        marginLeft: 5,
    }
});