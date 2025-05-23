import { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Link } from 'expo-router';
import { Button, Input, Text, Layout, Select, SelectItem } from '@ui-kitten/components';
import axios from 'axios';

export default function Signup() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [role, setRole] = useState('user');
    const [agencyId, setAgencyId] = useState('');
    const [destinationCategoryId, setDestinationCategoryId] = useState('');
    const [agencies, setAgencies] = useState([]);
    const [categories, setCategories] = useState([]);
    const { signup } = useAuth();

    // Fetch agencies
    useEffect(() => {
        const fetchAgencies = async () => {
            try {
                const res = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/auth/agencies`);
                setAgencies(res.data);
            } catch (error) {
                console.error('Error fetching agencies:', error);
                Alert.alert('Error', 'Failed to load agencies');
            }
        };
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
                    Alert.alert('Error', 'Failed to load categories');
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
            const userData = {
                name,
                email,
                password,
                contact_number: contactNumber,
                agencyId: role === 'agency_employee' ? agencyId : undefined,
                destinationCategoryId: role === 'agency_employee' ? destinationCategoryId : undefined,
            };
            console.log('Signup data:', { userData, role }); // Debug log
            await signup(userData, role);
        } catch (error) {
            console.error('Signup error:', error.message);
            Alert.alert('Signup Failed', error.message);
        }
    };

    return (
        <Layout style={styles.container}>
            <View style={styles.formContainer}>
                <Text category="h1" style={styles.title}>Create Account</Text>
                <Text category="s1" style={styles.subtitle}>Sign up to get started</Text>

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
                <Select
                    style={styles.input}
                    placeholder="Select Role"
                    value={roleDisplay}
                    onSelect={index => {
                        const newRole = index.row === 0 ? 'user' : 'agency_employee';
                        console.log('Role selected:', newRole); // Debug log
                        setRole(newRole);
                    }}
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
                                console.log('Agency selected:', newAgencyId); // Debug log
                                setAgencyId(newAgencyId);
                            }}
                            disabled={agencies.length === 0}
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
                                console.log('Category selected:', newCategoryId); // Debug log
                                setDestinationCategoryId(newCategoryId);
                            }}
                            disabled={!agencyId || categories.length === 0}
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
                        !email ||
                        !password ||
                        (role === 'agency_employee' && (!agencyId || !destinationCategoryId || !contactNumber))
                    }
                >
                    SIGN UP
                </Button>

                <Link href="/(auth)/login" style={styles.link}>
                    <Text category="s1" status="info">Already have an account? Login</Text>
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