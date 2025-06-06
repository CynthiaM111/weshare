import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import ErrorDisplay from '../../components/ErrorDisplay';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import axios from 'axios';

export default function PrivateHistoryScreen() {
    const router = useRouter();
    const { user } = useAuth();

    const {
        data: historyData,
        error: historyError,
        isLoading: isLoadingHistory,
        execute: fetchPrivateHistory,
        retry: retryFetchHistory
    } = useApi(async () => {
        if (!user?.id || !user?.token) {
            throw new Error('User ID or token missing');
        }

        const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/rides/private/history`, {
            headers: { Authorization: `Bearer ${user.token}` },
        });

        return response.data;
    });

    useEffect(() => {
        if (user) {
            fetchPrivateHistory();
        }
    }, [user]);

    const onRefresh = useCallback(async () => {
        fetchPrivateHistory();
    }, []);

    if (historyError) {
        return (
            <LinearGradient
                colors={['#0a2472', '#1E90FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.backgroundGradient}
            >
                <SafeAreaView style={styles.container}>
                    <ErrorDisplay
                        error={historyError}
                        onRetry={retryFetchHistory}
                        title="Error Loading History"
                        message="We couldn't load your private ride history at this time."
                    />
                </SafeAreaView>
            </LinearGradient>
        );
    }

    const history = historyData?.history || [];

    const renderHistoryItem = ({ item }) => {
        const getStatusColor = (status) => {
            if (item.allPassengersCompleted) return '#805ad5'; // Purple for completed
            if (item.somePassengersCompleted) return '#ff8c00'; // Orange for partial
            return '#718096'; // Gray for no completion
        };

        return (
            <View style={styles.historyCard}>
                <View style={styles.cardHeader}>
                    <Text style={styles.routeText}>{item.from} → {item.to}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                        <Text style={styles.statusText}>
                            {item.allPassengersCompleted ? 'Completed' :
                                item.somePassengersCompleted ? `${item.completedPassengers}/${item.totalPassengers} Done` :
                                    'No Completion'}
                        </Text>
                    </View>
                </View>

                <View style={styles.cardContent}>
                    <View style={styles.detailRow}>
                        <FontAwesome5 name="calendar" size={14} color="#666" />
                        <Text style={styles.detailText}>
                            {format(new Date(item.departure_time), 'PPP p')}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <FontAwesome5 name="car" size={14} color="#666" />
                        <Text style={styles.detailText}>{item.licensePlate}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <FontAwesome5 name="users" size={14} color="#666" />
                        <Text style={styles.detailText}>
                            {item.totalPassengers} passenger{item.totalPassengers !== 1 ? 's' : ''}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <FontAwesome5 name="money-bill-wave" size={14} color="#666" />
                        <Text style={styles.detailText}>{item.price} RWF</Text>
                    </View>
                </View>

                {item.bookedBy && item.bookedBy.length > 0 && (
                    <View style={styles.passengersSection}>
                        <Text style={styles.passengersSectionTitle}>Passengers</Text>
                        {item.bookedBy.map((booking, index) => {
                            const passenger = booking.userId || booking;
                            const passengerName = passenger.name || passenger.email || `Passenger ${index + 1}`;

                            return (
                                <View key={booking.bookingId || index} style={styles.passengerRow}>
                                    <FontAwesome5 name="user" size={12} color="#666" />
                                    <Text style={styles.passengerName}>{passengerName}</Text>
                                    <View style={[
                                        styles.passengerStatusBadge,
                                        booking.checkInStatus === 'completed' ? styles.completedPassenger :
                                            booking.checkInStatus === 'checked-in' ? styles.checkedInPassenger :
                                                styles.pendingPassenger
                                    ]}>
                                        <Text style={styles.passengerStatusText}>
                                            {booking.checkInStatus === 'completed' ? 'Completed' :
                                                booking.checkInStatus === 'checked-in' ? 'Checked In' :
                                                    'Pending'}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}
            </View>
        );
    };

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
                    <Text style={styles.headerTitle}>Private Ride History</Text>
                    <View style={styles.headerPlaceholder} />
                </View>

                <FlatList
                    data={history}
                    renderItem={renderHistoryItem}
                    keyExtractor={(item) => item._id}
                    refreshControl={
                        <RefreshControl
                            refreshing={isLoadingHistory}
                            onRefresh={onRefresh}
                            colors={['#4CAF50']}
                            tintColor='#4CAF50'
                        />
                    }
                    contentContainerStyle={styles.scrollContent}
                    ListEmptyComponent={
                        !isLoadingHistory && (
                            <View style={styles.emptyContainer}>
                                <FontAwesome5 name="history" size={64} color="rgba(255, 255, 255, 0.6)" />
                                <Text style={styles.emptyText}>No ride history found</Text>
                                <Text style={styles.emptySubText}>Completed private rides will appear here</Text>
                            </View>
                        )
                    }
                />
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
    historyCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    routeText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0a2472',
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    cardContent: {
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    detailText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#333',
    },
    passengersSection: {
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#0a2472',
    },
    passengersSectionTitle: {
        fontWeight: 'bold',
        color: '#0a2472',
        marginBottom: 8,
        fontSize: 14,
    },
    passengerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        marginBottom: 4,
    },
    passengerName: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        color: '#333',
    },
    passengerStatusBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    passengerStatusText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#fff',
    },
    completedPassenger: {
        backgroundColor: '#805ad5', // Purple
    },
    checkedInPassenger: {
        backgroundColor: '#3182ce', // Blue
    },
    pendingPassenger: {
        backgroundColor: '#ff8c00', // Orange
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        marginTop: 60,
    },
    emptyText: {
        fontSize: 18,
        color: '#fff',
        textAlign: 'center',
        marginTop: 16,
        fontWeight: '600',
    },
    emptySubText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
        marginTop: 8,
    },
}); 