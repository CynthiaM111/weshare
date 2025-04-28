// app/(rides)/index.js
import { View, Text, FlatList, ScrollView, TouchableOpacity, LayoutAnimation, Platform, UIManager, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import RideCard from '../../components/RideCard';
import { useLocalSearchParams } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { Layout, Button } from '@ui-kitten/components';
import { StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function RidesScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [bookedRides, setBookedRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchBookedRides = async () => {
        try {
            if (!user) {
                setLoading(false);
                return;
            }

            const response = await axios.get(
                'http://10.48.21.202:5002/api/rides/booked',
                {
                    headers: {
                        Authorization: `Bearer ${user.token}`
                    }
                }
            );
            setBookedRides(response.data);
        } catch (error) {
            console.error('Error fetching booked rides:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await fetchBookedRides();
        } finally {
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchBookedRides();
    }, [user]);

    const EmptyRidesView = () => (
        <Layout style={styles.emptyContainer}>
            <FontAwesome5 
                name="car-side" 
                size={64} 
                color="#8F9BB3" 
                style={styles.icon}
            />
            <Text category='h6' style={styles.emptyTitle}>
                No Rides Yet
            </Text>
            <Text category='s1' style={styles.emptySubtitle}>
                Start your journey by finding available rides
            </Text>
            <Button
                style={styles.findRidesButton}
                onPress={() => router.push('/(home)')}
            >
                <Text style={styles.buttonText}>Find Rides</Text>
            </Button>
        </Layout>
    );

    if (loading) {
        return (
            <Layout style={styles.loadingContainer}>
                <Text category='s1'>Loading your rides...</Text>
            </Layout>
        );
    }

    return (
        <Layout style={styles.container}>
            <FlatList
                data={bookedRides}
                keyExtractor={item => item._id}
                renderItem={({ item }) => (
                    <RideCard
                        ride={item}
                        onPress={() => router.push(`/(rides)/${item._id}`)}
                    />
                )}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
                }
                ListEmptyComponent={EmptyRidesView}
                contentContainerStyle={!bookedRides.length ? styles.emptyList : null}
            />
        </Layout>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'transparent',
    },
    emptyList: {
        flex: 1,
    },
    icon: {
        marginBottom: 20,
    },
    emptyTitle: {
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtitle: {
        textAlign: 'center',
        color: '#8F9BB3',
        marginBottom: 24,
    },
    findRidesButton: {
        marginTop: 16,
        minWidth: 200,
    },
    buttonText: {
        color: 'white',
        fontWeight: '600',
    },
});
