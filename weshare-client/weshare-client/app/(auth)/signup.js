import { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Link } from 'expo-router';
import { Button, Input, Text, Layout } from '@ui-kitten/components';

export default function Signup() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const { signup } = useAuth();

    const handleSignup = async () => {
        try {
            const userData = {
                name,
                email,
                password,
                contact_number: contactNumber,
            };
            await signup(userData, 'user');
        } catch (error) {
            Alert.alert('Signup Failed', error.message);
        }
    };

    return (
        <Layout style={styles.container}>
            <View style={styles.formContainer}>
                <Text category='h1' style={styles.title}>Create Account</Text>
                <Text category='s1' style={styles.subtitle}>Sign up to get started</Text>

                <Input
                    style={styles.input}
                    placeholder="Name"
                    value={name}
                    onChangeText={setName}
                />
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
                <Input
                    style={styles.input}
                    placeholder="Contact Number"
                    value={contactNumber}
                    onChangeText={setContactNumber}
                    keyboardType="numeric"
                />

                <Button
                    style={styles.button}
                    onPress={handleSignup}
                >
                    SIGN UP
                </Button>

                <Link href="/(auth)/login" style={styles.link}>
                    <Text category='s1' status='info'>Already have an account? Login</Text>
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
