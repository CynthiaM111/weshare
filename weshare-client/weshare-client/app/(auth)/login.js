import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Link } from 'expo-router';
import { Button, Input, Text, Layout } from '@ui-kitten/components';
import ErrorDisplay from '../../components/ErrorDisplay';


export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, loginError, setLoginError, loginRetry } = useAuth();

    const handleLogin = async () => {
        try {
            await login(email, password);
        } catch (error) {
            // Error is handled by useApi and displayed through ErrorDisplay
            console.error('Login error:', error);
        }
    };

    const handleRetry = () => {
        setEmail('');
        setPassword('');
        setLoginError(null);
        loginRetry();
    };

    if (loginError) {
        return (
            <Layout style={styles.container}>
                <ErrorDisplay
                    error={loginError}
                    onRetry={handleRetry}
                    title="Login Failed"
                    message="We couldn't log you in at this time. Check your credentials and try again."
                    retryText="Try Again"
                />
            </Layout>
        );
    }

    return (
        <Layout style={styles.container}>
            <View style={styles.formContainer}>
                <Text category='h1' style={styles.title}>Welcome Back</Text>
                <Text category='s1' style={styles.subtitle}>Sign in to your account</Text>

                <Input
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
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
});