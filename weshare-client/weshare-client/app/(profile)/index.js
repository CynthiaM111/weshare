import { StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Link, router } from 'expo-router';
import { Layout, Text, Button, Card, Avatar, Divider } from '@ui-kitten/components';
import Ionicons from '@expo/vector-icons/Ionicons';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import ErrorDisplay from '../../components/ErrorDisplay';

export default function Profile() {
    const { user, logout } = useAuth();
    const [agencyName, setAgencyName] = useState('');
    const [destinationCategory, setDestinationCategory] = useState('');

    const {
        error: agencyError,
        isLoading: isLoadingAgency,
        execute: fetchAgencyDetails,
        retry: retryFetchAgency
    } = useApi(async () => {
        if (!user?.role === 'agency_employee' || !user?.agencyId || !user?.destinationCategoryId) {
            return null;
        }
        const [agencyRes, categoryRes] = await Promise.all([
            axios.get(`${process.env.EXPO_PUBLIC_API_URL}/auth/agencies/${user.agencyId}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            }),
            axios.get(`${process.env.EXPO_PUBLIC_API_URL}/auth/agencies/${user.agencyId}/categories/${user.destinationCategoryId}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            })
        ]);
        setAgencyName(agencyRes.data.name);
        setDestinationCategory(`${categoryRes.data.from} to ${categoryRes.data.to}`);
        return { agency: agencyRes.data, category: categoryRes.data };
    });

    useEffect(() => {
        if (user?.role === 'agency_employee' && user.agencyId && user.destinationCategoryId) {
            fetchAgencyDetails();
        }
    }, [user]);

    const handleLogin = () => {
        router.push('/(auth)/login');
    };

    // Create a function to get the avatar content
    const getAvatarContent = () => {
        if (user?.photoUrl) {
            return { source: { uri: user.photoUrl } };
        }
        return { text: user?.name?.[0]?.toUpperCase() || '?' };
    };

    if (agencyError) {
        return (
            <Layout style={styles.container}>
                <ErrorDisplay
                    error={agencyError}
                    onRetry={retryFetchAgency}
                    title="Error Loading Profile Details"
                    message="We couldn't load your agency details at this time."
                />
            </Layout>
        );
    }

    if (!user) {
        return (
            <Layout style={styles.container}>
                <Card style={styles.card}>
                    <Text category='h5' style={styles.title}>Sign in to WeShare</Text>
                    <Text category='s1' style={styles.subtitle}>
                        Access your profile, manage your rides, and more
                    </Text>
                    <Button onPress={handleLogin} style={styles.button}>
                        LOGIN / SIGN UP
                    </Button>
                </Card>
            </Layout>
        );
    }

    return (
        <Layout style={styles.container}>
            <Card style={styles.profileCard}>
                <Layout style={styles.headerSection}>
                    <Avatar
                        size='giant'
                        style={styles.avatar}
                        {...getAvatarContent()}
                    />
                    <Layout style={styles.userInfo}>
                        <Text category='h5'>{user.name}</Text>
                        <Text category='s1' appearance='hint'>{user.email}</Text>
                        <Text category='s1' style={styles.roleText}>
                            Role: {user.role === 'user' ? 'Normal User' : 'Agency Employee'}
                        </Text>

                        {user.role === 'agency_employee' && (
                            <>
                                <Text category='s1' appearance='hint'>
                                    Agency: {isLoadingAgency ? 'Loading...' : agencyName || 'Not set'}
                                </Text>
                                <Text category='s1' appearance='hint'>
                                    Destination Category: {isLoadingAgency ? 'Loading...' : destinationCategory || 'Not set'}
                                </Text>
                            </>
                        )}
                    </Layout>
                </Layout>

                <Divider style={styles.divider} />

                <Layout style={styles.menuSection}>
                    <Button
                        appearance='ghost'
                        style={styles.menuItem}
                        accessoryLeft={(props) => <Ionicons name="person-outline" size={24} color={props.style.tintColor} />}
                        accessoryRight={(props) => <Ionicons name="chevron-forward-outline" size={24} color={props.style.tintColor} />}
                    >
                        Edit Profile
                    </Button>

                    <Button
                        appearance='ghost'
                        style={styles.menuItem}
                        accessoryLeft={(props) => <Ionicons name="notifications-outline" size={24} color={props.style.tintColor} />}
                        accessoryRight={(props) => <Ionicons name="chevron-forward-outline" size={24} color={props.style.tintColor} />}
                    >
                        Notifications
                    </Button>

                    <Button
                        appearance='ghost'
                        style={styles.menuItem}
                        accessoryLeft={(props) => <Ionicons name="settings-outline" size={24} color={props.style.tintColor} />}
                        accessoryRight={(props) => <Ionicons name="chevron-forward-outline" size={24} color={props.style.tintColor} />}
                    >
                        Settings
                    </Button>
                </Layout>

                <Divider style={styles.divider} />

                <Button
                    status='danger'
                    appearance='ghost'
                    onPress={logout}
                    style={styles.logoutButton}
                    accessoryLeft={(props) => <Ionicons name="log-out-outline" size={24} color={props.style.tintColor} />}
                >
                    Logout
                </Button>
            </Card>
        </Layout>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 16,
        justifyContent: 'center',
    },
    card: {
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        marginHorizontal: 8,
    },
    title: {
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        textAlign: 'center',
        color: '#8F9BB3',
        marginBottom: 20,
    },
    button: {
        marginTop: 8,
        backgroundColor: 'royalblue',
    },
    profileCard: {
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    headerSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatar: {
        marginRight: 16,
        backgroundColor: '#3e4e50',
    },
    userInfo: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    roleText: {
        marginTop: 8,
        fontWeight: 'bold',
    },
    divider: {
        marginVertical: 16,
    },
    menuSection: {
        backgroundColor: 'transparent',
    },
    menuItem: {
        justifyContent: 'space-between',
        marginVertical: 4,
    },
    logoutButton: {
        marginTop: 8,

    },
});