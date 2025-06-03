import { StyleSheet, View } from 'react-native';
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
                                <View style={styles.infoRow}>
                                    <Ionicons name="business-outline" size={20} color="#3B82F6" style={styles.infoIcon} />
                                    <View style={styles.infoContent}>
                                        <Text category='s2' style={styles.infoLabel}>Agency</Text>
                                        <Text category='s1' style={styles.infoValue}>
                                            {isLoadingAgency ? 'Loading...' : agencyName || 'Not set'}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.infoRow}>
                                    <Ionicons name="map-outline" size={20} color="#3B82F6" style={styles.infoIcon} />
                                    <View style={styles.infoContent}>
                                        <Text category='s2' style={styles.infoLabel}>Destination Category</Text>
                                        <View style={styles.destinationContainer}>
                                            <Text category='s1' style={styles.infoValue}>
                                                {isLoadingAgency ? 'Loading...' : destinationCategory?.split(' to ')[0] || 'Not set'}
                                            </Text>
                                            <Ionicons name="arrow-forward" size={16} color="#6B7280" style={styles.arrowIcon} />
                                            <Text category='s1' style={styles.infoValue}>
                                                {isLoadingAgency ? 'Loading...' : destinationCategory?.split(' to ')[1] || 'Not set'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
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
        backgroundColor: '#F9FAFB',
        padding: 16,
        justifyContent: 'center',
    },
    card: {
        padding: 24,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    title: {
        textAlign: 'center',
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 8,
        color: '#1F2937',
    },
    subtitle: {
        textAlign: 'center',
        fontSize: 15,
        color: '#6B7280',
        marginBottom: 20,
    },
    button: {
        marginTop: 16,
        backgroundColor: '#2563EB',
        borderRadius: 8,
    },
    profileCard: {
        padding: 24,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    headerSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    avatar: {
        marginRight: 16,
        backgroundColor: '#3B82F6',
    },
    userInfo: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    roleText: {
        marginTop: 8,
        fontWeight: '600',
        fontSize: 14,
        color: '#374151',
    },
    divider: {
        marginVertical: 20,
        backgroundColor: '#E5E7EB',
    },
    menuSection: {
        backgroundColor: 'transparent',
    },
    menuItem: {
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
        marginBottom: 8,
    },
    logoutButton: {
        marginTop: 12,
        borderRadius: 8,
        borderColor: '#DC2626',
        borderWidth: 1,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        backgroundColor: '#F3F4F6',
        padding: 12,
        borderRadius: 8,
    },
    infoIcon: {
        marginRight: 12,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        color: '#6B7280',
        marginBottom: 2,
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoValue: {
        color: '#1F2937',
        fontSize: 15,
        fontWeight: '500',
    },
    destinationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    arrowIcon: {
        marginHorizontal: 4,
    },
});
