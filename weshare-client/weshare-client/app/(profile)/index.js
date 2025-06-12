import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, ScrollView, Image, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
// import ErrorDisplay from '../../components/ErrorDisplay';
import { LinearGradient } from 'expo-linear-gradient';

export default function Profile() {
    const { user, logout } = useAuth();
    const router = useRouter();
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

    const handleLogout = () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: logout
                }
            ]
        );
    };

    const getInitials = () => {
        if (user?.name) {
            return user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        }
        return user?.email?.[0]?.toUpperCase() || '?';
    };

    useEffect(() => {
        if (agencyError) {
            Alert.alert('Error Loading Profile Details', agencyError.userMessage || 'We encountered an error while loading your profile details. Please try again.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Retry', onPress: retryFetchAgency }
            ]);
        }
    }, [agencyError]);



    if (!user) {
        return (
            <LinearGradient
                colors={['#0a2472', '#1E90FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.backgroundGradient}
            >
                <SafeAreaView style={styles.container}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <FontAwesome5 name="arrow-left" size={20} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Profile</Text>
                        <View style={styles.headerPlaceholder} />
                    </View>

                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <View style={styles.loginCard}>
                            <FontAwesome5 name="user-circle" size={80} color="rgba(255, 255, 255, 0.8)" style={styles.loginIcon} />
                            <Text style={styles.loginTitle}>Sign in to WeShare</Text>
                            <Text style={styles.loginSubtitle}>
                                Access your profile, manage your rides, and more
                            </Text>
                            <TouchableOpacity onPress={handleLogin} style={styles.loginButton}>
                                <FontAwesome5 name="sign-in-alt" size={16} color="#fff" />
                                <Text style={styles.loginButtonText}>LOGIN / SIGN UP</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient
            colors={['#0a2472', '#1E90FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.backgroundGradient}
        >
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <FontAwesome5 name="arrow-left" size={20} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Profile</Text>
                    <View style={styles.headerPlaceholder} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.profileCard}>
                        {/* Profile Header */}
                        <View style={styles.profileHeader}>
                            <View style={styles.avatarContainer}>
                                {user?.photoUrl ? (
                                    <Image source={{ uri: user.photoUrl }} style={styles.avatarImage} />
                                ) : (
                                    <View style={styles.avatarPlaceholder}>
                                        <Text style={styles.avatarText}>{getInitials()}</Text>
                                    </View>
                                )}
                            </View>
                            <View style={styles.userInfo}>
                                <Text style={styles.userName}>{user.name}</Text>
                                <Text style={styles.userEmail}> {user.contact_number}</Text>
                                <View style={styles.roleContainer}>
                                    <FontAwesome5
                                        name={user.role === 'agency_employee' ? 'building' : 'user'}
                                        size={12}
                                        color="#0a2472"
                                    />
                                    <Text style={styles.roleText}>
                                        {user.role === 'user' ? 'Normal User' : 'Agency Employee'}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Agency Information */}
                        {user.role === 'agency_employee' && (
                            <View style={styles.agencySection}>
                                <View style={styles.sectionDivider} />
                                <Text style={styles.sectionTitle}>Agency Information</Text>

                                <View style={styles.infoRow}>
                                    <FontAwesome5 name="building" size={16} color="#0a2472" />
                                    <View style={styles.infoContent}>
                                        <Text style={styles.infoLabel}>Agency</Text>
                                        <Text style={styles.infoValue}>
                                            {isLoadingAgency ? 'Loading...' : agencyName || 'Not set'}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.infoRow}>
                                    <FontAwesome5 name="route" size={16} color="#0a2472" />
                                    <View style={styles.infoContent}>
                                        <Text style={styles.infoLabel}>Destination Route</Text>
                                        <View style={styles.destinationContainer}>
                                            <Text style={styles.infoValue}>
                                                {isLoadingAgency ? 'Loading...' : destinationCategory?.split(' to ')[0] || 'Not set'}
                                            </Text>
                                            <FontAwesome5 name="arrow-right" size={12} color="#666" style={styles.arrowIcon} />
                                            <Text style={styles.infoValue}>
                                                {isLoadingAgency ? 'Loading...' : destinationCategory?.split(' to ')[1] || 'Not set'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Menu Options */}
                        <View style={styles.menuSection}>
                            <View style={styles.sectionDivider} />
                            <Text style={styles.sectionTitle}>Account</Text>

                            <TouchableOpacity style={styles.menuItem}>
                                <FontAwesome5 name="user-edit" size={18} color="#0a2472" />
                                <Text style={styles.menuItemText}>Edit Profile</Text>
                                <FontAwesome5 name="chevron-right" size={16} color="#666" />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.menuItem}>
                                <FontAwesome5 name="bell" size={18} color="#0a2472" />
                                <Text style={styles.menuItemText}>Notifications</Text>
                                <FontAwesome5 name="chevron-right" size={16} color="#666" />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.menuItem}>
                                <FontAwesome5 name="cog" size={18} color="#0a2472" />
                                <Text style={styles.menuItemText}>Settings</Text>
                                <FontAwesome5 name="chevron-right" size={16} color="#666" />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.menuItem}>
                                <FontAwesome5 name="question-circle" size={18} color="#0a2472" />
                                <Text style={styles.menuItemText}>Help & Support</Text>
                                <FontAwesome5 name="chevron-right" size={16} color="#666" />
                            </TouchableOpacity>
                        </View>

                        {/* Logout Button */}
                        <View style={styles.logoutSection}>
                            <View style={styles.sectionDivider} />
                            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                                <FontAwesome5 name="sign-out-alt" size={18} color="#fff" />
                                <Text style={styles.logoutButtonText}>Logout</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: 'rgba(10, 36, 114, 0.8)',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
        textAlign: 'center',
    },
    headerPlaceholder: {
        width: 32,
        height: 32,
    },
    scrollContent: {
        padding: 16,
    },
    // Login Card Styles
    loginCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 16,
        padding: 32,
        alignItems: 'center',
        marginTop: 40,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    loginIcon: {
        marginBottom: 24,
    },
    loginTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
        textAlign: 'center',
    },
    loginSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: 32,
        textAlign: 'center',
        lineHeight: 22,
    },
    loginButton: {
        backgroundColor: '#fff',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 3,
    },
    loginButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0a2472',
    },
    // Profile Card Styles
    profileCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 16,
        padding: 20,
        marginTop: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 3,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    avatarContainer: {
        marginRight: 16,
    },
    avatarImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        borderColor: '#0a2472',
    },
    avatarPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#0a2472',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#1E90FF',
    },
    avatarText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0a2472',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    roleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f4ff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    roleText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#0a2472',
        marginLeft: 4,
    },
    // Agency Section
    agencySection: {
        marginBottom: 20,
    },
    sectionDivider: {
        height: 1,
        backgroundColor: '#e0e0e0',
        marginVertical: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0a2472',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    infoContent: {
        flex: 1,
        marginLeft: 12,
    },
    infoLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    destinationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    arrowIcon: {
        marginHorizontal: 8,
    },
    // Menu Section
    menuSection: {
        marginBottom: 20,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 8,
        marginBottom: 8,
    },
    menuItemText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
        marginLeft: 12,
    },
    // Logout Section
    logoutSection: {
        marginTop: 20,
    },
    logoutButton: {
        backgroundColor: '#dc3545',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 3,
    },
    logoutButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
});
