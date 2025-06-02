
'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import axios from 'axios';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ErrorDisplay from '../../components/ErrorDisplay';


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
    const limit = 10;

    // Fetch initial data and subsequent pages
    const loadRides = async (pageToFetch) => {
        if (!hasMore || isLoading) return;

        setIsLoading(true);
        try {
            const data = await fetchRideHistory(pageToFetch, limit);
            setRides((prev) => [...prev, ...data.history]);
            setHasMore(data.pagination.currentPage < data.pagination.totalPages);
            setPage(pageToFetch);
        } catch (err) {
            console.log(err);
            setError(err.message);
        } finally {
            setIsLoading(false);
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

    const renderItem = ({ item, index }) => (

        <View style={styles.card}>
            <View style={styles.row}>
                <View>
                    <Text style={styles.title}>{item.from} → {item.to}</Text>
                    <Text style={styles.subtitle}>
                        {format(new Date(item.departure_time), 'PPP p')}
                    </Text>
                </View>
                <View style={styles.priceContainer}>
                    <Text style={styles.price}>Rwf {item.price.toFixed(2)}</Text>
                    <Text style={styles.status}>
                        {item.status}
                    </Text>
                </View>
            </View>
        </View>
    );


    if (error) {
        return (
            <View style={styles.container}>
                <ErrorDisplay
                    error={error}
                    onRetry={() => loadRides(1)}
                    title="Error Loading Ride History"
                    message="We encountered an error while loading your ride history."
                    retryText="Retry"
                />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Ride History</Text>
            <FlatList
                data={rides}
                renderItem={renderItem}
                keyExtractor={(item, index) => `${item.departure_time}-${index}`}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={() =>
                    isLoading ? (
                        <View style={styles.footer}>
                            <ActivityIndicator size="small" color="#0000ff" />
                            <Text style={styles.footerText}>Loading more...</Text>
                        </View>
                    ) : !hasMore ? (
                        <Text style={styles.footerText}>No more rides to load</Text>
                    ) : null
                }
                ListEmptyComponent={() =>
                    !isLoading ? (
                        <Text style={styles.emptyText}>No ride history found</Text>
                    ) : null
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f5f5f5',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        padding: 16,
        marginBottom: 16,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
    },
    priceContainer: {
        alignItems: 'flex-end',
    },
    price: {
        fontSize: 18,
        fontWeight: '600',
    },
    status: {
        fontSize: 12,
        color: '#666',
        textTransform: 'capitalize',
    },
    error: {
        color: 'red',
        fontSize: 16,
        textAlign: 'center',
    },
    footer: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 20,
    },
});