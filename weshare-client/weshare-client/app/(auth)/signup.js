import { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, Alert, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Link, useRouter } from 'expo-router';
import { Button, Input, Text, Layout, Select, SelectItem } from '@ui-kitten/components';
import axios from 'axios';


export default function Signup() {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [role, setRole] = useState('user');
    const [agencyId, setAgencyId] = useState('');
    const [destinationCategoryId, setDestinationCategoryId] = useState('');
    const [agencies, setAgencies] = useState([]);
    const [categories, setCategories] = useState([]);
    const { signup, signupError } = useAuth();
    const router = useRouter();


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
                    const res = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/auth/agencies/${agencyId}/categories`);
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


    useEffect(() => {
        if (signupError) {
            const userMessage =
                signupError?.userMessage ||
                signupError?.response?.data?.error ||
                "We couldn't sign you up at this time. Check your credentials and try again.";

            Alert.alert('Signup Failed', userMessage, [
                { text: 'Try Again', onPress: () => router.push('/(auth)/signup') },
                { text: 'Cancel', style: 'cancel' }
            ]);
        }
    }, [signupError]);




    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <Layout style={styles.container}>
                    <View style={styles.formContainer}>
                        <Text category="h1" style={styles.title}>Create Account</Text>
                        <Text category="s1" style={styles.subtitle}>Sign up to get started</Text>

                        <Input
                            style={styles.input}
                            placeholder="Name"
                            value={name}
                            onChangeText={setName}
                            size="large"
                        />
                        <View style={styles.phoneInputContainer}>
                            <Text style={styles.phonePrefix}>+250</Text>
                            <TextInput
                                style={styles.phoneInput}
                                placeholder="Phone Number"
                                value={contactNumber}
                                onChangeText={setContactNumber}
                                keyboardType="phone-pad"
                                maxLength={9}
                            />
                        </View>
                        <Text style={styles.phoneHint}>Format: 7XXXXXXXX (e.g. 785123456)</Text>

                        <Input
                            style={styles.input}
                            placeholder="Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            size="large"
                        />

                        <Select
                            style={styles.input}
                            placeholder="Select Role"
                            value={roleDisplay}
                            onSelect={index => {
                                const newRole = index.row === 0 ? 'user' : 'agency_employee';
                                setTimeout(() => {
                                    setRole(newRole);
                                }, 1000);
                            }}
                            size="large"
                        >
                            <SelectItem title="Normal User" />
                            <SelectItem title="Agency Employee" />
                        </Select>
                        {role === 'agency_employee' && (
                            <>
                                <Select
                                    style={styles.input}
                                    placeholder="Select Agency"
                                    value={agencyDisplay}
                                    onSelect={index => {
                                        const newAgencyId = agencies[index.row]?._id || '';
                                        setTimeout(() => {
                                            setAgencyId(newAgencyId);
                                        }, 1000);
                                    }}
                                    disabled={agencies.length === 0}
                                    size="large"
                                >
                                    {agencies.map(agency => (
                                        <SelectItem key={agency._id} title={agency.name} />
                                    ))}
                                </Select>
                                <Select
                                    style={styles.input}
                                    placeholder="Select Destination Category"
                                    value={categoryDisplay}
                                    onSelect={index => {
                                        const newCategoryId = categories[index.row]?._id || '';
                                        setTimeout(() => {
                                            setDestinationCategoryId(newCategoryId);
                                        }, 1000);
                                    }}
                                    disabled={!agencyId || categories.length === 0}
                                    size="large"
                                >
                                    {categories.map(category => (
                                        <SelectItem key={category._id} title={`${category.from} to ${category.to}`} />
                                    ))}
                                </Select>
                            </>
                        )}

                        <Button
                            style={styles.button}
                            onPress={handleSignup}
                            disabled={
                                !name ||
                                !contactNumber ||
                                !password ||
                                (role === 'agency_employee' && (!agencyId || !destinationCategoryId || !contactNumber))
                            }
                            size="large"
                        >
                            SIGN UP
                        </Button>

                        <Link href="/(auth)/login" style={styles.link}>
                            <Text category="s1" status="info">Already have an account? Login</Text>
                        </Link>
                    </View>
                </Layout>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        flexGrow: 1,
    },
    formContainer: {
        flex: 1,
        padding: 20,
        width: '100%',
        maxWidth: 500,
        alignSelf: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    title: {
        textAlign: 'center',
        marginBottom: 10,
        fontSize: 32,
        fontWeight: 'bold',
        color: '#222B45',
    },
    subtitle: {
        textAlign: 'center',
        marginBottom: 30,
        color: '#8F9BB3',
        fontSize: 16,
    },
    input: {
        marginBottom: 15,
        backgroundColor: '#F7F9FC',
        borderColor: '#E4E9F2',
    },
    button: {
        marginTop: 20,
        marginBottom: 30,
        backgroundColor: '#3366FF',
        borderRadius: 8,
        height: 50,
    },
    link: {
        alignSelf: 'center',
        marginBottom: 20,
    },
    phoneInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E4E9F2',
        borderRadius: 8,
        marginBottom: 15,
        paddingHorizontal: 10,
        height: 50,
        backgroundColor: '#F7F9FC',
    },
    phonePrefix: {
        fontSize: 16,
        color: '#222B45',
        marginRight: 8,
        fontWeight: '500',
    },
    phoneInput: {
        flex: 1,
        fontSize: 16,
        color: '#222B45',
        height: '100%',
    },
    phoneHint: {
        fontSize: 12,
        color: '#8F9BB3',
        marginBottom: 10,
        marginLeft: 5,
    }
});