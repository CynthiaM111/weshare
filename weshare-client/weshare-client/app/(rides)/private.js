import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, SafeAreaView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import RideCard from '../../components/RideCard';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import ErrorDisplay from '../../components/ErrorDisplay';
import { LinearGradient } from 'expo-linear-gradient';

export default function PrivateRidesScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [expandedSections, setExpandedSections] = useState({
        active: true,
        past: true,
    });


    const {
        data: privateRides,
        error: privateRidesError,
        isLoading: isLoadingPrivateRides,
        execute: fetchPrivateRides,
        retry: retryFetchPrivateRides
    } = useApi(async () => {
        if (!user?.id || !user?.token) {
            throw new Error('User ID or token missing');
        }

        const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/rides/private`, {
            headers: { Authorization: `Bearer ${user.token}` },
        });

        return response.data.rides || [];
    });

    useEffect(() => {
        if (user) {

            fetchPrivateRides();
        }
    }, [user]);

    const onRefresh = useCallback(async () => {
        try {
            await fetchPrivateRides();
        } catch (error) {
            console.error('Error refreshing:', error);
        }
    }, []);

    const groupRidesByDate = (ridesToGroup) => {
        const grouped = ridesToGroup.reduce((acc, ride) => {
            const date = new Date(ride.departure_time).toLocaleDateString();
            if (!acc[date]) {
                acc[date] = {
                    date,
                    rides: [],
                    timeRange: '',
                };
            }
            acc[date].rides.push(ride);
            return acc;
        }, {});

        Object.values(grouped).forEach((group) => {
            group.rides.sort((a, b) => new Date(a.departure_time) - new Date(b.departure_time));
            const times = group.rides.map((r) =>
                new Date(r.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            );
            group.timeRange = `${times[0]} - ${times[times.length - 1]}`;
        });

        return Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));
    };

    const toggleExpand = (section) => {
        setExpandedSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    const handleDeleteRide = async (rideId) => {
        Alert.alert(
            "Delete Ride",
            "Are you sure you want to delete this ride?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {

                            await axios.delete(`${process.env.EXPO_PUBLIC_API_URL}/rides/${rideId}`, {
                                headers: { Authorization: `Bearer ${user.token}` },
                            });
                            // Refresh the rides list
                            fetchPrivateRides();
                        } catch (error) {

                            Alert.alert("Error", "Failed to delete ride. Please try again.");
                        }
                    }
                }
            ]
        );
    };

    const handleEditRide = (ride) => {
        router.push({
            pathname: '/(rides)/add-private-ride',
            params: {
                ride: JSON.stringify(ride)
            }
        });
    };

    if (privateRidesError) {
        return (
            <SafeAreaView style={styles.container}>
                <ErrorDisplay
                    error={privateRidesError}
                    onRetry={retryFetchPrivateRides}
                    title="Error Loading Private Rides"
                    message="We couldn't load your private rides at this time."
                    retryText="Retry"
                />
            </SafeAreaView>
        );
    }

    const rides = Array.isArray(privateRides) ? privateRides : [];


    const currentDate = new Date();

    const activeRides = rides.filter(ride => new Date(ride.departure_time) >= currentDate);
    const pastRides = rides.filter(ride => new Date(ride.departure_time) < currentDate);


    const groupedActiveRides = groupRidesByDate(activeRides);
    const groupedPastRides = groupRidesByDate(pastRides);



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
                    <Text style={styles.headerTitle}>Your Private Rides</Text>
                </View>

                {isLoadingPrivateRides ? (
                    <View style={styles.loadingContainer}>
                        <Text style={styles.loadingText}>Loading your private rides...</Text>
                    </View>
                ) : (
                    <>
                        <FlatList
                            data={[]}
                            renderItem={null}
                            refreshControl={
                                <RefreshControl
                                    refreshing={isLoadingPrivateRides}
                                    onRefresh={onRefresh}
                                    colors={['#fff']}
                                    tintColor='#fff'
                                />
                            }
                            contentContainerStyle={styles.contentContainer}
                            ListHeaderComponent={
                                <>
                                    {groupedActiveRides.length > 0 && (
                                        <View style={styles.section}>
                                            <TouchableOpacity onPress={() => toggleExpand('active')}>
                                                <View style={styles.sectionHeader}>
                                                    <Text style={styles.sectionTitle}>Active Rides ({activeRides.length})</Text>
                                                    <FontAwesome5
                                                        name={expandedSections.active ? 'chevron-up' : 'chevron-down'}
                                                        size={16}
                                                        color="#fff"
                                                    />
                                                </View>
                                            </TouchableOpacity>

                                            {expandedSections.active && (
                                                <View style={styles.sectionContent}>
                                                    {groupedActiveRides.map((group) => (
                                                        <View key={`active-${group.date}`} style={styles.dateGroup}>
                                                            <View style={styles.dateHeader}>
                                                                <FontAwesome5
                                                                    name="calendar-alt"
                                                                    size={16}
                                                                    color="#fff"
                                                                    style={styles.dateIcon}
                                                                />
                                                                <Text style={styles.dateText}>{group.date}</Text>
                                                                <Text style={styles.timeRangeText}>{group.timeRange}</Text>
                                                            </View>
                                                            {group.rides.map((ride) => (
                                                                <View key={ride._id} style={styles.rideCardContainer}>
                                                                    <RideCard
                                                                        ride={ride}
                                                                        onPress={() => router.push(`/(rides)/${ride._id}`)}
                                                                        isPrivate={true}
                                                                    />
                                                                    <View style={styles.rideActions}>
                                                                        <TouchableOpacity
                                                                            style={[styles.actionButton, styles.editButton]}
                                                                            onPress={() => handleEditRide(ride)}
                                                                        >
                                                                            <FontAwesome5 name="edit" size={16} color="#fff" />
                                                                        </TouchableOpacity>
                                                                        <TouchableOpacity
                                                                            style={[styles.actionButton, styles.deleteButton]}
                                                                            onPress={() => handleDeleteRide(ride._id)}
                                                                        >
                                                                            <FontAwesome5 name="trash" size={16} color="#fff" />
                                                                        </TouchableOpacity>
                                                                    </View>
                                                                </View>
                                                            ))}
                                                        </View>
                                                    ))}
                                                </View>
                                            )}
                                        </View>
                                    )}

                                    {groupedPastRides.length > 0 && (
                                        <View style={styles.section}>
                                            <TouchableOpacity onPress={() => toggleExpand('past')}>
                                                <View style={styles.sectionHeader}>
                                                    <Text style={styles.sectionTitle}>Past Rides ({pastRides.length})</Text>
                                                    <FontAwesome5
                                                        name={expandedSections.past ? 'chevron-up' : 'chevron-down'}
                                                        size={16}
                                                        color="#fff"
                                                    />
                                                </View>
                                            </TouchableOpacity>

                                            {expandedSections.past && (
                                                <View style={styles.sectionContent}>
                                                    {groupedPastRides.map((group) => (
                                                        <View key={`past-${group.date}`} style={styles.dateGroup}>
                                                            <View style={styles.dateHeader}>
                                                                <FontAwesome5
                                                                    name="calendar-alt"
                                                                    size={16}
                                                                    color="#fff"
                                                                    style={styles.dateIcon}
                                                                />
                                                                <Text style={styles.dateText}>{group.date}</Text>
                                                                <Text style={styles.timeRangeText}>{group.timeRange}</Text>
                                                            </View>
                                                            {group.rides.map((ride) => (
                                                                <View key={ride._id} style={styles.rideCardContainer}>
                                                                    <RideCard
                                                                        ride={ride}
                                                                        onPress={() => router.push(`/(rides)/${ride._id}`)}
                                                                        isPrivate={true}
                                                                    />
                                                                    <View style={styles.rideActions}>
                                                                        <TouchableOpacity
                                                                            style={[styles.actionButton, styles.editButton]}
                                                                            onPress={() => handleEditRide(ride)}
                                                                        >
                                                                            <FontAwesome5 name="edit" size={16} color="#fff" />
                                                                        </TouchableOpacity>
                                                                        <TouchableOpacity
                                                                            style={[styles.actionButton, styles.deleteButton]}
                                                                            onPress={() => handleDeleteRide(ride._id)}
                                                                        >
                                                                            <FontAwesome5 name="trash" size={16} color="#fff" />
                                                                        </TouchableOpacity>
                                                                    </View>
                                                                </View>
                                                            ))}
                                                        </View>
                                                    ))}
                                                </View>
                                            )}
                                        </View>
                                    )}

                                    {!groupedActiveRides.length && !groupedPastRides.length && (
                                        <View style={styles.emptyContainer}>
                                            <Text style={styles.emptyText}>No private rides found</Text>
                                            <TouchableOpacity
                                                style={styles.addButton}
                                                onPress={() => router.push('/(rides)/add-private-ride')}
                                            >
                                                <FontAwesome5 name="plus" size={16} color="#fff" style={styles.addIcon} />
                                                <Text style={styles.addButtonText}>Add Private Ride</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </>
                            }
                        />
                        <TouchableOpacity
                            style={styles.fab}
                            onPress={() => router.push('/(rides)/add-private-ride')}
                        >
                            <FontAwesome5 name="plus" size={24} color="#fff" />
                        </TouchableOpacity>
                    </>
                )}
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
        alignItems: 'center',
        padding: 16,
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    contentContainer: {
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    sectionContent: {
        paddingHorizontal: 8,
    },
    dateGroup: {
        marginBottom: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: 16,
        borderRadius: 12,
    },
    dateHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    dateIcon: {
        marginRight: 8,
    },
    dateText: {
        fontWeight: 'bold',
        color: '#fff',
        marginRight: 12,
    },
    timeRangeText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 14,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 16,
        color: '#fff',
        marginBottom: 20,
        textAlign: 'center',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
    },
    addIcon: {
        marginRight: 8,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#fff',
        fontSize: 16,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        backgroundColor: '#0a2472',
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    rideCardContainer: {
        position: 'relative',
        marginBottom: 8,
    },
    rideActions: {
        position: 'absolute',
        right: 8,
        top: 8,
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
    editButton: {
        backgroundColor: '#0a2472',
    },
    deleteButton: {
        backgroundColor: '#dc3545',
    },
}); 