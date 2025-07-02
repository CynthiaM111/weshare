import { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, Alert, TextInput, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Link, useRouter } from 'expo-router';
import { Button, Input, Text, Layout, Select, SelectItem } from '@ui-kitten/components';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';

export default function Signup() {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [role, setRole] = useState('user');
    const [agencyId, setAgencyId] = useState('');
    const [destinationCategoryId, setDestinationCategoryId] = useState('');
    const [agencies, setAgencies] = useState([]);
    const [categories, setCategories] = useState([]);
    const [showPassword, setShowPassword] = useState(false);
    const { signup, signupError } = useAuth();
    const router = useRouter();
    const hasShownAlert = useRef(false);

    const fetchAgencies = async () => {
        try {
            const res = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/auth/agencies`);

            setAgencies(res.data);
        } catch (error) {
            console.error('Error fetching agencies:', error);

        }
    };

    // Fetch agencies on mount
    useEffect(() => {
        fetchAgencies();
    }, []);

    // Fetch categories when agency is selected
    useEffect(() => {
        if (agencyId) {
            const fetchCategories = async () => {
                try {
                    const res = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/destinations/agency/${agencyId}`);
                    setCategories(res.data);

                } catch (error) {
                    console.error('Error fetching categories:', error);
                    setError('Failed to load categories');
                }
            };
            fetchCategories();
        } else {
            setCategories([]);
            setDestinationCategoryId('');
        }
    }, [agencyId]);

    // Memoize Select values
    const roleDisplay = useMemo(() => (role === 'user' ? 'Normal User' : 'Agency Employee'), [role]);
    const agencyDisplay = useMemo(() => {
        const agency = agencies.find(a => a._id === agencyId);
        return agency ? agency.name : 'Select Agency';
    }, [agencyId, agencies]);
    const categoryDisplay = useMemo(() => {
        const category = categories.find(c => c._id === destinationCategoryId);
        return category ? `${category.from} to ${category.to}` : 'Select Category';
    }, [destinationCategoryId, categories]);

    const handleSignup = async () => {
        try {
            // Format phone number to match server validation
            const formattedPhoneNumber = `+250${contactNumber}`;

            const userData = {
                name,
                password,
                contact_number: formattedPhoneNumber,
                agencyId: role === 'agency_employee' ? agencyId : undefined,
                destinationCategoryId: role === 'agency_employee' ? destinationCategoryId : undefined,
            };

            await signup(userData, role);
        } catch (_) {
            // console.error('Signup error:', error.message);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    useFocusEffect(
        useCallback(() => {
            if (signupError && !hasShownAlert.current) {
                hasShownAlert.current = true;
                const userMessage =
                    signupError?.userMessage ||
                    signupError?.response?.data?.error ||
                    "We couldn't sign you up at this time. Check your credentials and try again.";

                Alert.alert('Signup Failed', userMessage, [
                    { text: 'Try Again', onPress: () => router.push('/(auth)/signup') },
                    { text: 'Cancel', style: 'cancel' },
                ]);
            }
            return () => {
                hasShownAlert.current = false; // Reset on focus change or unmount
            };
        }, [signupError, router])
    );

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
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.formContainer}>
                            {/* Logo/Icon */}
                            <View style={styles.logoContainer}>
                                <View style={styles.logoCircle}>
                                    <FontAwesome5 name="user-plus" size={40} color="#0a2472" />
                                </View>
                            </View>

                            <Text style={styles.title}>Create Account</Text>
                            <Text style={styles.subtitle}>Sign up to get started</Text>

                            {/* Name Input */}
                            <View style={styles.inputContainer}>
                                <Input
                                    style={styles.input}
                                    placeholder="Name"
                                    value={name}
                                    onChangeText={setName}
                                    textStyle={styles.inputText}
                                />
                            </View>

                            {/* Phone Number Input */}
                            <View style={styles.inputContainer}>
                                <View style={styles.phoneInputWrapper}>
                                    <Text style={styles.phonePrefix}>+250</Text>
                                    <TextInput
                                        style={styles.phoneInput}
                                        placeholder="Phone Number"
                                        value={contactNumber}
                                        onChangeText={setContactNumber}
                                        keyboardType="phone-pad"
                                        maxLength={9}
                                        placeholderTextColor="#8F9BB3"
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

                            {/* Role Selection */}
                            <View style={styles.inputContainer}>
                                <Select
                                    style={styles.selectInput}
                                    placeholder="Select Role"
                                    value={roleDisplay}
                                    onSelect={index => {
                                        const newRole = index.row === 0 ? 'user' : 'agency_employee';
                                        setRole(newRole);
                                    }}
                                    textStyle={styles.inputText}
                                >
                                    <SelectItem title="Normal User" />
                                    <SelectItem title="Agency Employee" />
                                </Select>
                            </View>

                            {/* Agency Employee Fields */}
                            {role === 'agency_employee' && (
                                <>
                                    <View style={styles.inputContainer}>
                                        <Select
                                            style={styles.selectInput}
                                            placeholder="Select Agency"
                                            value={agencyDisplay}
                                            onSelect={index => {
                                                const newAgencyId = agencies[index.row]?._id || '';
                                                setAgencyId(newAgencyId);
                                            }}
                                            disabled={agencies.length === 0}
                                            textStyle={styles.inputText}
                                        >
                                            {agencies.map(agency => (
                                                <SelectItem key={agency._id} title={agency.name} />
                                            ))}
                                        </Select>
                                    </View>
                                    <View style={styles.inputContainer}>
                                        <Select
                                            style={styles.selectInput}
                                            placeholder="Select Destination Category"
                                            value={categoryDisplay}
                                            onSelect={index => {
                                                const newCategoryId = categories[index.row]?._id || '';
                                                setDestinationCategoryId(newCategoryId);
                                            }}
                                            disabled={!agencyId || categories.length === 0}
                                            textStyle={styles.inputText}
                                        >
                                            {categories.map(category => (
                                                <SelectItem key={category._id} title={`${category.from} to ${category.to}`} />
                                            ))}
                                        </Select>
                                    </View>
                                </>
                            )}

                            {/* Sign Up Button */}
                            <TouchableOpacity
                                style={[
                                    styles.signupButton,
                                    (!name || !contactNumber || !password || (role === 'agency_employee' && (!agencyId || !destinationCategoryId))) && styles.signupButtonDisabled
                                ]}
                                onPress={handleSignup}
                                disabled={!name || !contactNumber || !password || (role === 'agency_employee' && (!agencyId || !destinationCategoryId))}
                                activeOpacity={0.8}
                            >
                                <FontAwesome5 name="user-plus" size={16} color="#fff" />
                                <Text style={styles.signupButtonText}>SIGN UP</Text>
                            </TouchableOpacity>

                            {/* Login Link */}
                            <Link href="/(auth)/login" style={styles.link}>
                                <Text style={styles.linkText}>Already have an account? Login</Text>
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
        paddingVertical: 40,
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
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 12,
        borderWidth: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
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
        fontSize: 16,
        color: '#0a2472',
        height: 50,
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
    selectInput: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 12,
        borderWidth: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
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
    signupButton: {
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
    signupButtonDisabled: {
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        shadowOpacity: 0.05,
        elevation: 2,
    },
    signupButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0a2472',
    },
    link: {
        alignSelf: 'center',
        marginBottom: 20,
    },
    linkText: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        textDecorationLine: 'underline',
    },
});