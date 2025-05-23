import { View, FlatList, Alert, RefreshControl, StyleSheet, TouchableOpacity } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Text } from '@ui-kitten/components';
import { FontAwesome5 } from '@expo/vector-icons';
import axios from 'axios';
import RideCard from '../../components/RideCard';
import { config } from '../../config';
import { useRouter } from 'expo-router';

export default function BookedRidesScreen() {
    const [bookedRides, setBookedRides] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [expandedSections, setExpandedSections] = useState({ booked: true });
    const { user } = useAuth();
    const router = useRouter();

    const fetchBookedRides = async () => {
        try {
            const response = await axios.get(
                `${config.API_URL}/rides/booked`,
                {
                    headers: {
                        Authorization: `Bearer ${user.token}`
                    }
                }
            );
            setBookedRides(response.data);
        } catch (error) {
            console.error('Error fetching booked rides:', error.response || error);
            Alert.alert('Error', 'Failed to fetch booked rides');
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
        if (user) {
            fetchBookedRides();
        }
    }, [user]);

    const groupRidesByDate = (rides) => {
        const grouped = rides.reduce((acc, ride) => {
            const date = new Date(ride.departure_time).toLocaleDateString();
            if (!acc[date]) {
                acc[date] = {
                    date,
                    rides: [],
                    timeRange: ''
                };
            }
            acc[date].rides.push(ride);
            return acc;
        }, {});

        Object.values(grouped).forEach(group => {
            group.rides.sort((a, b) => new Date(a.departure_time) - new Date(b.departure_time));
            const times = group.rides.map(r => new Date(r.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            group.timeRange = `${times[0]} - ${times[times.length - 1]}`;
        });

        return Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));
    };

    const toggleExpand = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const groupedBookedRides = groupRidesByDate(bookedRides);

    const handleCancelBooking = async (rideId) => {
        try {
            await axios.delete(
                `${config.API_URL}/rides/${rideId}/cancel`,
                {
                    headers: {
                        Authorization: `Bearer ${user.token}`
                    }
                }
            );
            Alert.alert('Success', 'Booking cancelled successfully');
            await fetchBookedRides();
        } catch (error) {
            Alert.alert('Error', error.response?.data?.error || 'Failed to cancel booking');
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.searchButton}
                onPress={() => router.push('/(home)')}
            >
                <FontAwesome5 name="search" size={16} color="black" style={styles.searchIcon} />
                <Text style={styles.searchButtonText}>Back to Search</Text>
            </TouchableOpacity>

            <FlatList
                data={[]}
                renderItem={null}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={["#4CAF50"]}
                        tintColor="#4CAF50"
                    />
                }
                ListHeaderComponent={
                    <View style={{ marginBottom: 24 }}>
                        <TouchableOpacity onPress={() => toggleExpand('booked')}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Your Booked Rides</Text>
                                <FontAwesome5
                                    name={expandedSections.booked ? "chevron-up" : "chevron-down"}
                                    size={16}
                                    color="black"
                                />
                            </View>
                        </TouchableOpacity>

                        {expandedSections.booked && (
                            <View style={styles.sectionContent}>
                                {groupedBookedRides.map(group => (
                                    <View key={`booked-${group.date}`} style={styles.dateGroup}>
                                        <View style={styles.dateHeader}>
                                            <FontAwesome5 name="calendar-alt" size={16} color="black" style={{ marginRight: 8 }} />
                                            <Text style={styles.dateText}>{group.date}</Text>
                                            <Text style={styles.timeRangeText}>{group.timeRange}</Text>
                                        </View>
                                        {group.rides.map(ride => (
                                            <RideCard
                                                key={ride._id}
                                                ride={ride}
                                                isBooked={true}
                                                availableSeats={ride.available_seats}
                                                statusDisplay={ride.statusDisplay}
                                                showCancelButton={true}
                                                onCancelBooking={() => handleCancelBooking(ride._id)}
                                            />
                                        ))}
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                }
                ListEmptyComponent={
                    !bookedRides.length && (
                        <View style={styles.emptyContainer}>
                            <Text category='s1' style={styles.emptyText}>
                                No booked rides
                            </Text>
                        </View>
                    )
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
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        textAlign: 'center',
        color: '#8F9BB3',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#e9e9e9',
        borderRadius: 8,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    sectionContent: {
        paddingHorizontal: 8,
    },
    dateGroup: {
        marginBottom: 16,
        backgroundColor: '#f2f2f2',
        padding: 16,
        borderRadius: 12,
    },
    dateHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    dateText: {
        fontWeight: 'bold',
        marginRight: 12,
    },
    timeRangeText: {
        color: 'gray',
        fontSize: 14,
    },
    searchButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'black',
        padding: 10,
        borderRadius: 10,
        marginBottom: 16,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'black',
    },
});