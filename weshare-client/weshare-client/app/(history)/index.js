'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import axios from 'axios';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, SafeAreaView, TouchableOpacity, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ErrorDisplay from '../../components/ErrorDisplay';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const fetchRideHistory = async ({ pageParam = 1 }) => {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/rides/history?page=${pageParam}&limit=10`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response.data;
};

export default function RideHistory() {
    const [rides, setRides] = useState([]);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();
    const limit = 10;

    // Fetch initial data and subsequent pages
    const loadRides = async (pageToFetch, isRefresh = false) => {
        if (!hasMore || isLoading) return;

        if (isRefresh) {
            setRefreshing(true);
            setRides([]);
            setPage(1);
            setHasMore(true);
        } else {
            setIsLoading(true);
        }

        try {
            const data = await fetchRideHistory({ pageParam: pageToFetch });
            if (isRefresh) {
                setRides(data.history);
            } else {
                setRides((prev) => [...prev, ...data.history]);
            }
            setHasMore(data.pagination.currentPage < data.pagination.totalPages);
            setPage(pageToFetch);
            setError(null);
        } catch (err) {
            console.log(err);
            setError(err.message);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    // Load first page on mount
    useEffect(() => {
        loadRides(1);
    }, []);

    // Handle infinite scroll
    const handleLoadMore = () => {
        if (hasMore && !isLoading) {
            loadRides(page + 1);
        }
    };

    // Handle refresh
    const handleRefresh = () => {
        loadRides(1, true);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return '#805ad5'; // Purple
            case 'checked-in':
                return '#3182ce'; // Blue
            case 'pending':
                return '#ff8c00'; // Orange
            default:
                return '#38a169'; // Green
        }
    };

    const renderItem = ({ item, index }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.routeContainer}>
                    <FontAwesome5 name="route" size={16} color="#0a2472" />
                    <Text style={styles.routeText}>{item.from} → {item.to}</Text>
                </View>
                {item.isPrivate && (
                    <View style={styles.privateTag}>
                        <FontAwesome5 name="lock" size={10} color="#fff" />
                        <Text style={styles.privateTagText}>Private</Text>
                    </View>
                )}
            </View>

            <View style={styles.cardContent}>
                <View style={styles.detailRow}>
                    <FontAwesome5 name="calendar" size={14} color="#666" />
                    <Text style={styles.detailText}>
                        {format(new Date(item.departure_time), 'PPP')}
                    </Text>
                </View>

                <View style={styles.detailRow}>
                    <FontAwesome5 name="clock" size={14} color="#666" />
                    <Text style={styles.detailText}>
                        {format(new Date(item.departure_time), 'p')}
                        {item.estimatedArrivalTime && ` - ${format(new Date(item.estimatedArrivalTime), 'p')}`}
                    </Text>
                </View>

                {item.licensePlate && (
                    <View style={styles.detailRow}>
                        <FontAwesome5 name="car" size={14} color="#666" />
                        <Text style={styles.detailText}>{item.licensePlate}</Text>
                    </View>
                )}
            </View>

            <View style={styles.cardFooter}>
                <View style={styles.priceContainer}>
                    <FontAwesome5 name="money-bill-wave" size={14} color="#4CAF50" />
                    <Text style={styles.price}>{item.price} RWF</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.statusText}>
                        {item.status === 'completed' ? 'Completed' :
                            item.status === 'checked-in' ? 'Checked In' :
                                item.status === 'pending' ? 'Pending' : item.status}
                    </Text>
                </View>
            </View>
        </View>
    );

    if (error) {
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
                        <Text style={styles.headerTitle}>Ride History</Text>
                        <View style={styles.headerPlaceholder} />
                    </View>
                    <ErrorDisplay
                        error={error}
                        onRetry={handleRefresh}
                        title="Error Loading Ride History"
                        message="We encountered an error while loading your ride history."
                        retryText="Retry"
                    />
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
                    <Text style={styles.headerTitle}>Ride History</Text>
                    <View style={styles.headerPlaceholder} />
                </View>

                <FlatList
                    data={rides}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => `${item._id || item.departure_time}-${index}`}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={['#4CAF50']}
                            tintColor='#4CAF50'
                        />
                    }
                    ListFooterComponent={() =>
                        isLoading ? (
                            <View style={styles.footer}>
                                <ActivityIndicator size="small" color="#fff" />
                                <Text style={styles.footerText}>Loading more...</Text>
                            </View>
                        ) : !hasMore && rides.length > 0 ? (
                            <View style={styles.footer}>
                                <FontAwesome5 name="check-circle" size={24} color="rgba(255, 255, 255, 0.6)" />
                                <Text style={styles.footerText}>You've reached the end</Text>
                            </View>
                        ) : null
                    }
                    ListEmptyComponent={() =>
                        !isLoading && !refreshing ? (
                            <View style={styles.emptyContainer}>
                                <FontAwesome5 name="history" size={64} color="rgba(255, 255, 255, 0.6)" />
                                <Text style={styles.emptyText}>No ride history found</Text>
                                <Text style={styles.emptySubText}>Your completed rides will appear here</Text>
                            </View>
                        ) : null
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
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 3,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    routeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    routeText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0a2472',
        marginLeft: 8,
    },
    privateTag: {
        backgroundColor: '#d65108',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        flexDirection: 'row',
        alignItems: 'center',
    },
    privateTagText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#fff',
        marginLeft: 4,
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
        fontSize: 14,
        color: '#333',
        marginLeft: 8,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    price: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginLeft: 8,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#fff',
    },
    footer: {
        paddingVertical: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        marginTop: 8,
        textAlign: 'center',
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
