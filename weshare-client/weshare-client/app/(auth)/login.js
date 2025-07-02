import { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Link, useRouter } from 'expo-router';
import { Button, Input, Text, Layout } from '@ui-kitten/components';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';

export default function Login() {
    const [password, setPassword] = useState('');
    const [contact_number, setContact_number] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    const { login, loginError, logout, response } = useAuth();
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

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
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
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.formContainer}>
                            {/* Logo/Icon */}
                            <View style={styles.logoContainer}>
                                <View style={styles.logoCircle}>
                                    <FontAwesome5 name="car" size={40} color="#0a2472" />
                                </View>
                            </View>

                            <Text style={styles.title}>Welcome Back</Text>
                            <Text style={styles.subtitle}>Sign in to your account</Text>

                            {/* Phone Number Input */}
                            <View style={styles.inputContainer}>
                                <View style={styles.phoneInputWrapper}>
                                    <Text style={styles.phonePrefix}>+250</Text>
                                    <Input
                                        style={styles.phoneInput}
                                        placeholder="Phone Number"
                                        value={contact_number}
                                        onChangeText={setContact_number}
                                        autoCapitalize="none"
                                        keyboardType="phone-pad"
                                        maxLength={9}
                                        textContentType="telephoneNumber"
                                        autoComplete="tel"
                                        textStyle={styles.inputText}
                                    />
                                </View>
                                <Text style={styles.phoneHint}>Format: 7XXXXXXXX (e.g. 785123456)</Text>
                            </View>

                            {/* Password Input with Toggle */}
                            <View style={styles.inputContainer}>
                                <View style={styles.passwordInputWrapper}>
                                    <Input
                                        style={styles.passwordInput}
                                        placeholder="Password"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                        textContentType="password"
                                        autoComplete="password"
                                        textStyle={styles.inputText}
                                    />
                                    <TouchableOpacity
                                        style={styles.eyeButton}
                                        onPress={togglePasswordVisibility}
                                    >
                                        <Ionicons
                                            name={showPassword ? "eye-off" : "eye"}
                                            size={20}
                                            color="#8F9BB3"
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Login Button */}
                            <TouchableOpacity
                                style={[
                                    styles.loginButton,
                                    (!contact_number || !password) && styles.loginButtonDisabled
                                ]}
                                onPress={handleLogin}
                                disabled={!contact_number || !password}
                                activeOpacity={0.8}
                            >
                                <FontAwesome5 name="sign-in-alt" size={16} color="#fff" />
                                <Text style={styles.loginButtonText}>LOGIN</Text>
                            </TouchableOpacity>

                            {/* Sign Up Link */}
                            <Link href="/(auth)/signup" style={styles.link}>
                                <Text style={styles.linkText}>Don't have an account? Sign up</Text>
                            </Link>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
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
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    formContainer: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        marginBottom: 32,
        alignItems: 'center',
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        marginBottom: 40,
    },
    inputContainer: {
        width: '100%',
        marginBottom: 20,
    },
    phoneInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    phonePrefix: {
        fontSize: 16,
        color: '#0a2472',
        fontWeight: '600',
        marginRight: 8,
    },
    phoneInput: {
        flex: 1,
        backgroundColor: 'transparent',
        borderWidth: 0,
    },
    passwordInputWrapper: {
        position: 'relative',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    passwordInput: {
        backgroundColor: 'transparent',
        borderWidth: 0,
        paddingRight: 50,
    },
    eyeButton: {
        position: 'absolute',
        right: 16,
        top: 12,
        padding: 4,
    },
    inputText: {
        fontSize: 16,
        color: '#0a2472',
    },
    phoneHint: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
        marginTop: 8,
        marginLeft: 4,
    },
    loginButton: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        marginTop: 20,
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
        gap: 8,
    },
    loginButtonDisabled: {
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        shadowOpacity: 0.05,
        elevation: 2,
    },
    loginButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0a2472',
    },
    link: {
        alignSelf: 'center',
    },
    linkText: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        textDecorationLine: 'underline',
    },
});