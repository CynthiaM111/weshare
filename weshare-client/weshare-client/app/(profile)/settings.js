import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import LanguageSwitcher from '../../components/LanguageSwitcher';

export default function SettingsScreen() {
    const { t, i18n } = useTranslation();
    const router = useRouter();
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
            router.replace('/(auth)/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const settingsItems = [
        {
            id: 'language',
            title: t('language.language'),
            subtitle: t('language.selectLanguage'),
            icon: 'language',
            color: '#667eea',
            onPress: () => { }, // Language switcher is handled by the component
            customComponent: <LanguageSwitcher />
        },
        {
            id: 'notifications',
            title: t('settings.notifications'),
            subtitle: 'Manage your notification preferences',
            icon: 'bell',
            color: '#4CAF50',
            onPress: () => { }
        },
        {
            id: 'privacy',
            title: t('settings.privacy'),
            subtitle: 'Control your privacy settings',
            icon: 'shield-alt',
            color: '#FF9800',
            onPress: () => { }
        },
        {
            id: 'security',
            title: t('settings.security'),
            subtitle: 'Manage your account security',
            icon: 'lock',
            color: '#F44336',
            onPress: () => { }
        },
        {
            id: 'help',
            title: t('settings.help'),
            subtitle: 'Get help and support',
            icon: 'question-circle',
            color: '#9C27B0',
            onPress: () => { }
        },
        {
            id: 'about',
            title: t('settings.about'),
            subtitle: 'Learn more about WeShare',
            icon: 'info-circle',
            color: '#607D8B',
            onPress: () => { }
        }
    ];

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.gradient}
            >
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                    >
                        <Ionicons name="arrow-back" size={24} color="#ffffff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('settings.general')}</Text>
                    <View style={styles.headerPlaceholder}>
                        <LanguageSwitcher style={styles.languageSwitcher} compact={true} />
                    </View>
                </View>
            </LinearGradient>

            <ScrollView style={styles.content}>
                {settingsItems.map((item) => (
                    <View key={item.id} style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <FontAwesome5 name={item.icon} size={20} color={item.color} />
                            <Text style={styles.sectionTitle}>{item.title}</Text>
                        </View>

                        {item.customComponent ? (
                            item.customComponent
                        ) : (
                            <TouchableOpacity
                                style={styles.settingItem}
                                onPress={item.onPress}
                            >
                                <View style={styles.settingContent}>
                                    <Text style={styles.settingTitle}>{item.title}</Text>
                                    <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                                </View>
                                <FontAwesome5 name="chevron-right" size={14} color="#9ca3af" />
                            </TouchableOpacity>
                        )}
                    </View>
                ))}

                {/* Logout Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <FontAwesome5 name="sign-out-alt" size={20} color="#F44336" />
                        <Text style={styles.sectionTitle}>Account</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.settingItem, styles.logoutItem]}
                        onPress={handleLogout}
                    >
                        <View style={styles.settingContent}>
                            <Text style={[styles.settingTitle, styles.logoutText]}>{t('auth.logout')}</Text>
                            <Text style={styles.settingSubtitle}>Sign out of your account</Text>
                        </View>
                        <FontAwesome5 name="chevron-right" size={14} color="#F44336" />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    gradient: {
        paddingTop: 20,
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
        flex: 1,
    },
    headerSpacer: {
        width: 40,
    },
    headerPlaceholder: {
        width: 32,
        height: 32,
    },
    languageSwitcher: {
        // Add any specific styles for the LanguageSwitcher if needed
    },
    content: {
        flex: 1,
        padding: 20,
    },
    section: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginLeft: 12,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 12,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    settingContent: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
    },
    settingSubtitle: {
        fontSize: 14,
        color: '#64748b',
    },
    logoutItem: {
        backgroundColor: '#fef2f2',
        borderColor: '#fecaca',
    },
    logoutText: {
        color: '#dc2626',
    },
}); 