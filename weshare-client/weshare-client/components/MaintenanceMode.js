import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Settings, RefreshCw } from 'lucide-react-native';
import { ERROR_MESSAGES, ERROR_CODES } from '../utils/apiErrorHandler';
import { useRouter } from 'expo-router';

const MaintenanceMode = ({ onRetry, onCheckStatus }) => {
    const [isChecking, setIsChecking] = useState(false);
    const router = useRouter();

    const handleRetry = async () => {
        setIsChecking(true);

        try {
            if (onRetry) {
                await onRetry();
            } else if (onCheckStatus) {
                // Check if maintenance mode is still active
                await onCheckStatus();
            } else {
                // Default: try to check app status by making a simple API call
                await checkAppStatus();
            }
        } catch (error) {
            console.error('Maintenance check failed:', error);
            // If check fails, assume maintenance is still ongoing
        } finally {
            setIsChecking(false);
        }
    };

    const checkAppStatus = async () => {
        try {
            // Make a simple health check request
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/health`, {
                method: 'GET',
                timeout: 5000
            });

            if (response.ok) {
                // If health check passes, try to navigate back to the app
                try {
                    router.replace('/(home)');
                } catch (navError) {
                    console.error('Navigation failed after maintenance check:', navError);
                    // Force app refresh as fallback
                    if (typeof window !== 'undefined' && window.location) {
                        window.location.reload();
                    }
                }
            } else {
                throw new Error('Service still unavailable');
            }
        } catch (error) {
            // Service is still down, stay in maintenance mode
            console.log('Service still in maintenance mode');
            throw error;
        }
    };

    return (
        <LinearGradient
            colors={['#0a2472', '#1E90FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    {isChecking ? (
                        <ActivityIndicator size="large" color="#FFFFFF" />
                    ) : (
                        <Settings size={80} color="#FFFFFF" />
                    )}
                </View>

                <Text style={styles.title}>Under Maintenance</Text>

                <Text style={styles.message}>
                    {ERROR_MESSAGES[ERROR_CODES.MAINTENANCE_MODE]}
                </Text>

                <Text style={styles.subtitle}>
                    We're working hard to improve your experience. Thank you for your patience!
                </Text>

                <TouchableOpacity
                    style={[styles.retryButton, isChecking && styles.retryButtonDisabled]}
                    onPress={handleRetry}
                    disabled={isChecking}
                >
                    {isChecking ? (
                        <>
                            <ActivityIndicator size={20} color="#0a2472" />
                            <Text style={styles.retryButtonText}>Checking...</Text>
                        </>
                    ) : (
                        <>
                            <RefreshCw size={20} color="#0a2472" />
                            <Text style={styles.retryButtonText}>Check Again</Text>
                        </>
                    )}
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Follow us on social media for updates
                    </Text>
                    <Text style={styles.footerSubtext}>
                        Expected resolution: Usually within 30 minutes
                    </Text>
                </View>
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    content: {
        alignItems: 'center',
        maxWidth: 350,
    },
    iconContainer: {
        marginBottom: 32,
        padding: 20,
        borderRadius: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        width: 120,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 16,
        textAlign: 'center',
    },
    message: {
        fontSize: 18,
        color: '#E5E7EB',
        textAlign: 'center',
        marginBottom: 12,
        lineHeight: 26,
    },
    subtitle: {
        fontSize: 16,
        color: '#D1D5DB',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
        gap: 8,
        marginBottom: 40,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    retryButtonDisabled: {
        opacity: 0.7,
    },
    retryButtonText: {
        color: '#0a2472',
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        marginTop: 20,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
        marginBottom: 8,
    },
    footerSubtext: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'center',
        fontStyle: 'italic',
    },
});

export default MaintenanceMode; 