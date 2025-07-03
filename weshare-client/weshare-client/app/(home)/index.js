import { View, Text, StatusBar, TextInput, TouchableOpacity, ScrollView, FlatList, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback, useRef } from 'react';
// import { styles } from '../../styles/HomeScreenStyles';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, useFocusEffect } from 'expo-router';
import axios from 'axios';
import { useApi } from '../../hooks/useApi';
// import ErrorDisplay from '../../components/ErrorDisplay';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';

const rwandaDistricts = [
    "Burera",
    "Gakenke",
    "Gicumbi",
    "Musanze",
    "Rulindo",
    "Gisagara",
    "Huye",
    "Kamonyi",
    "Muhanga",
    "Nyamagabe",
    "Nyanza",
    "Nyaruguru",
    "Ruhango",
    "Bugesera",
    "Gatsibo",
    "Kayonza",
    "Kirehe",
    "Ngoma",
    "Nyagatare",
    "Rwamagana",
    "Karongi",
    "Ngororero",
    "Nyabihu",
    "Nyamasheke",
    "Rubavu",
    "Rusizi",
    "Rutsiro",
    "Gasabo",
    "Kicukiro",
    "Nyarugenge",
    "Kigali"
];

export default function HomeScreen() {
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [frequentSearches, setFrequentSearches] = useState([]);
    const [fromSuggestions, setFromSuggestions] = useState([]);
    const [toSuggestions, setToSuggestions] = useState([]);
    const [showFromSuggestions, setShowFromSuggestions] = useState(false);
    const [showToSuggestions, setShowToSuggestions] = useState(false);
    const [isSelectingSuggestion, setIsSelectingSuggestion] = useState(false);
    const router = useRouter();
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    // Add refs for the inputs and animations
    const fromInputRef = useRef(null);
    const toInputRef = useRef(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Use focus effect to refresh unread count when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            if (user) {
                loadUnreadCount();
            }
        }, [user])
    );

    useEffect(() => {
        loadFrequentSearches();
        if (user) {
            loadUnreadCount();
        }
        // Pulse animation for notification badge
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    // Load frequent searches when user changes (login/logout)
    useEffect(() => {
        if (user) {
            loadFrequentSearches();
        } else {
            // Clear frequent searches when user logs out
            setFrequentSearches([]);
        }
    }, [user, loadFrequentSearches]);

    const filterDestinations = useCallback((query) => {
        if (!query) return [];
        const lowerQuery = query.toLowerCase();
        return rwandaDistricts
            .filter(dest => dest.toLowerCase().includes(lowerQuery))
            .sort((a, b) => {
                // Prioritize matches that start with the query
                const aStartsWith = a.toLowerCase().startsWith(lowerQuery);
                const bStartsWith = b.toLowerCase().startsWith(lowerQuery);
                if (aStartsWith && !bStartsWith) return -1;
                if (!aStartsWith && bStartsWith) return 1;
                return 0;
            })
            .slice(0, 5); // Limit to 5 suggestions
    }, []);

    const handleFromChange = (text) => {
        setFrom(text);
        setFromSuggestions(filterDestinations(text));
        setShowFromSuggestions(true);
    };

    const handleToChange = (text) => {
        setTo(text);
        setToSuggestions(filterDestinations(text));
        setShowToSuggestions(true);
    };

    const handleFromSelect = (selected) => {
        setIsSelectingSuggestion(true);
        setFrom(selected);
        setShowFromSuggestions(false);
        setTimeout(() => {
            if (toInputRef.current) {
                toInputRef.current.focus();
            }
            setIsSelectingSuggestion(false);
        }, 100);
    };

    const handleToSelect = (selected) => {
        setIsSelectingSuggestion(true);
        setTo(selected);
        setShowToSuggestions(false);
        setTimeout(() => {
            setIsSelectingSuggestion(false);
        }, 100);
    };

    const handleFromBlur = () => {
        if (!isSelectingSuggestion) {
            setTimeout(() => {
                setShowFromSuggestions(false);
            }, 150);
        }
    };

    const handleToBlur = () => {
        if (!isSelectingSuggestion) {
            setTimeout(() => {
                setShowToSuggestions(false);
            }, 150);
        }
    };

    const loadFrequentSearches = useCallback(async () => {
        try {
            const userId = user?.id;
            if (!userId) {
                setFrequentSearches([]);
                return;
            }

            const searches = await AsyncStorage.getItem(`frequentSearches_${userId}`);
            if (searches) {
                const parsedSearches = JSON.parse(searches);
                // Sort by frequency and get top 4
                const sortedSearches = Object.entries(parsedSearches)
                    .sort(([, a], [, b]) => b.count - a.count)
                    .slice(0, 4)
                    .map(([key, value]) => ({
                        from: value.from,
                        to: value.to,
                        count: value.count
                    }));
                setFrequentSearches(sortedSearches);
            } else {
                setFrequentSearches([]);
            }
        } catch (error) {
            console.error('Error loading frequent searches:', error);
            setFrequentSearches([]);
        }
    }, [user?.id]);

    const updateFrequentSearches = async (from, to) => {
        try {
            const userId = user?.id;
            if (!userId) return;

            const searches = await AsyncStorage.getItem(`frequentSearches_${userId}`);
            const parsedSearches = searches ? JSON.parse(searches) : {};
            const key = `${from}-${to}`;

            if (parsedSearches[key]) {
                parsedSearches[key].count += 1;
            } else {
                parsedSearches[key] = { from, to, count: 1 };
            }

            await AsyncStorage.setItem(`frequentSearches_${userId}`, JSON.stringify(parsedSearches));
            loadFrequentSearches();
        } catch (error) {
            console.error('Error updating frequent searches:', error);
        }
    };

    const { execute: searchRides, error: searchError, isLoading: isSearching } = useApi(async (searchParams) => {
        const response = await axios.get(
            `${process.env.EXPO_PUBLIC_API_URL}/rides/search`,
            {
                params: {
                    from: searchParams.from.trim(),
                    to: searchParams.to.trim(),
                    exact_match: 'true',
                    isPrivate: 'false'
                },
                paramsSerializer: params => {
                    return Object.entries(params)
                        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
                        .join('&');
                }
            }
        );
        return response.data;
    });

    const handleSearch = async (prefilledFrom = from, prefilledTo = to) => {
        if (!prefilledFrom || !prefilledTo) {
            return;
        }

        try {
            const rides = await searchRides({ from: prefilledFrom, to: prefilledTo });
            await updateFrequentSearches(prefilledFrom, prefilledTo);

            router.push({
                pathname: '/(rides)',
                params: {
                    rides: JSON.stringify(rides),
                    searchParams: JSON.stringify({ from: prefilledFrom, to: prefilledTo })
                }
            });
        } catch (_) {
            // Handle error silently
        };
    }

    const handleAddPrivateRide = () => {
        router.push('/(private)/add-private-ride');
    };

    const handleBookPrivateRide = () => {
        router.push('/(private)');
    };

    const renderSuggestionItem = ({ item, onSelect }) => (
        <TouchableOpacity
            style={styles.suggestionItem}
            onPress={() => onSelect(item)}
        >
            <Text style={styles.suggestionEmoji}>📍</Text>
            <Text style={styles.suggestionText}>{item}</Text>
        </TouchableOpacity>
    );

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning! ☀️";
        if (hour < 17) return "Good afternoon! 🌤️";
        return "Good evening! 🌙";
    };

    useEffect(() => {
        if (searchError) {
            Alert.alert(
                'Search Error',
                searchError.userMessage || 'We encountered an error while searching for rides. Please try again.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Retry', onPress: retrySearch }
                ]
            );
        }
    }, [searchError]);

    const {
        error: unreadError,
        execute: fetchUnreadCount,
        retry: retryUnreadCount
    } = useApi(async () => {
        const response = await axios.get(
            `${process.env.EXPO_PUBLIC_API_URL}/messages/unread-count`,
            {
                headers: { Authorization: `Bearer ${user.token}` },
            }
        );
        return response.data;
    });

    const loadUnreadCount = async () => {
        try {
            const result = await fetchUnreadCount();
            setUnreadCount(result.count || 0);
        } catch (error) {
            console.error('Error loading unread count:', error);
        }
    };

    const handleNotificationPress = () => {
        router.push('/(messages)');
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0a2472" />

            {/* Header with Gradient */}
            <LinearGradient
                colors={['#0a2472', '#1E90FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerGradient}
            >
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <View>
                            <Text style={styles.greeting}>{getGreeting()},</Text>
                            <Text style={styles.userName}>{user?.name || 'Traveler'}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.notificationButton}
                            onPress={handleNotificationPress}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="notifications-outline" size={24} color="#ffffff" />
                            {unreadCount > 0 && (
                                <Animated.View
                                    style={[
                                        styles.notificationBadge,
                                        { transform: [{ scale: pulseAnim }] }
                                    ]}
                                >
                                    <Text style={styles.badgeText}>
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </Text>
                                </Animated.View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Search Section with Gradient Card */}
                <View style={styles.searchSection}>
                    <Text style={styles.sectionTitle}>Find Your Ride</Text>
                    <Text style={styles.sectionSubtitle}>Where would you like to go today?</Text>

                    <LinearGradient
                        colors={['rgba(10, 36, 114, 0.05)', 'rgba(30, 144, 255, 0.05)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.searchCardGradient}
                    >
                        <View style={styles.searchCard}>
                            <View style={styles.inputGroup}>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="location" size={20} color="#3b82f6" />
                                    <TextInput
                                        ref={fromInputRef}
                                        style={styles.input}
                                        placeholder="From"
                                        value={from}
                                        onChangeText={handleFromChange}
                                        placeholderTextColor="#94a3b8"
                                        onFocus={() => setShowFromSuggestions(true)}
                                        onBlur={handleFromBlur}
                                        autoCapitalize="words"
                                        autoCorrect={false}
                                    />
                                </View>

                                {showFromSuggestions && fromSuggestions.length > 0 && (
                                    <View style={styles.suggestionsContainer}>
                                        {fromSuggestions.map((item) => (
                                            <TouchableOpacity
                                                key={item}
                                                style={styles.suggestionItem}
                                                onPress={() => handleFromSelect(item)}
                                                activeOpacity={0.7}
                                            >
                                                <Ionicons name="location-outline" size={16} color="#64748b" />
                                                <Text style={styles.suggestionText}>{item}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}

                                <View style={styles.inputDivider}>
                                    <View style={styles.dividerLine} />
                                    <Ionicons name="arrow-down" size={16} color="#94a3b8" />
                                    <View style={styles.dividerLine} />
                                </View>

                                <View style={styles.inputContainer}>
                                    <Ionicons name="location" size={20} color="#ef4444" />
                                    <TextInput
                                        ref={toInputRef}
                                        style={styles.input}
                                        placeholder="To"
                                        value={to}
                                        onChangeText={handleToChange}
                                        placeholderTextColor="#94a3b8"
                                        onFocus={() => setShowToSuggestions(true)}
                                        onBlur={handleToBlur}
                                        autoCapitalize="words"
                                        autoCorrect={false}
                                    />
                                </View>

                                {showToSuggestions && toSuggestions.length > 0 && (
                                    <View style={styles.suggestionsContainer}>
                                        {toSuggestions.map((item) => (
                                            <TouchableOpacity
                                                key={item}
                                                style={styles.suggestionItem}
                                                onPress={() => handleToSelect(item)}
                                                activeOpacity={0.7}
                                            >
                                                <Ionicons name="location-outline" size={16} color="#64748b" />
                                                <Text style={styles.suggestionText}>{item}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>

                            <LinearGradient
                                colors={['#0a2472', '#1E90FF']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.searchButtonGradient}
                            >
                                <TouchableOpacity
                                    style={[
                                        styles.searchButton,
                                        (!from || !to || isSearching) && styles.searchButtonDisabled
                                    ]}
                                    onPress={() => handleSearch()}
                                    disabled={!from || !to || isSearching}
                                    activeOpacity={0.8}
                                >
                                    {isSearching ? (
                                        <View style={styles.loadingContainer}>
                                            <View style={styles.loadingSpinner} />
                                            <Text style={styles.searchButtonText}>Searching...</Text>
                                        </View>
                                    ) : (
                                        <>
                                            <Ionicons name="search" size={20} color="#fff" />
                                            <Text style={styles.searchButtonText}>Search Rides</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </LinearGradient>
                        </View>
                    </LinearGradient>
                </View>

                {/* Quick Actions */}
                <View style={styles.quickActionsSection}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.quickActionsGrid}>
                        <LinearGradient
                            colors={['rgba(217, 119, 6, 0.1)', 'rgba(245, 158, 11, 0.1)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.quickActionGradient}
                        >
                            <TouchableOpacity
                                style={styles.quickActionCard}
                                onPress={handleBookPrivateRide}
                                activeOpacity={0.8}
                            >
                                <View style={[styles.actionIcon, { backgroundColor: '#fef3c7' }]}>
                                    <Ionicons name="car-sport" size={24} color="#d97706" />
                                </View>
                                <Text style={styles.actionTitle}>Book Private</Text>
                                <Text style={styles.actionSubtitle}>VIP experience</Text>
                            </TouchableOpacity>
                        </LinearGradient>

                        <LinearGradient
                            colors={['rgba(37, 99, 235, 0.1)', 'rgba(59, 130, 246, 0.1)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.quickActionGradient}
                        >
                            <TouchableOpacity
                                style={styles.quickActionCard}
                                onPress={handleAddPrivateRide}
                                activeOpacity={0.8}
                            >
                                <View style={[styles.actionIcon, { backgroundColor: '#dbeafe' }]}>
                                    <Ionicons name="add-circle" size={24} color="#2563eb" />
                                </View>
                                <Text style={styles.actionTitle}>Offer Ride</Text>
                                <Text style={styles.actionSubtitle}>Share your car</Text>
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>
                </View>

                {/* Recent Searches */}
                {frequentSearches.length > 0 && (
                    <View style={styles.recentSearchesSection}>
                        <Text style={styles.sectionTitle}>Recent Searches</Text>
                        <View style={styles.recentSearchesList}>
                            {frequentSearches.map((search, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.recentSearchItem}
                                    onPress={() => handleSearch(search.from, search.to)}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.recentSearchContent}>
                                        <View style={styles.routeInfo}>
                                            <Text style={styles.routeFrom}>{search.from}</Text>
                                            <Ionicons name="arrow-forward" size={16} color="#94a3b8" />
                                            <Text style={styles.routeTo}>{search.to}</Text>
                                        </View>
                                        <View style={styles.searchCount}>
                                            <Ionicons name="time-outline" size={14} color="#64748b" />
                                            <Text style={styles.countText}>{search.count} times</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* Tips Section */}
                <View style={styles.tipsSection}>
                    <Text style={styles.sectionTitle}>Travel Tips</Text>
                    <View style={styles.tipsList}>
                        <View style={styles.tipItem}>
                            <View style={[styles.tipIcon, { backgroundColor: '#f0f9ff' }]}>
                                <Ionicons name="time" size={16} color="#0284c7" />
                            </View>
                            <Text style={styles.tipText}>Book early for better prices</Text>
                        </View>
                        <View style={styles.tipItem}>
                            <View style={[styles.tipIcon, { backgroundColor: '#f0fdf4' }]}>
                                <Ionicons name="people" size={16} color="#16a34a" />
                            </View>
                            <Text style={styles.tipText}>Share rides to meet new people</Text>
                        </View>
                        <View style={styles.tipItem}>
                            <View style={[styles.tipIcon, { backgroundColor: '#fef7ff' }]}>
                                <Ionicons name="star" size={16} color="#9333ea" />
                            </View>
                            <Text style={styles.tipText}>Rate your driver to help others</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    headerGradient: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    greeting: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: 4,
    },
    userName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#ffffff',
    },
    notificationButton: {
        padding: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 12,
        position: 'relative',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    notificationBadge: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#ef4444',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: '#ffffff',
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#ffffff',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    searchSection: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 8,
    },
    sectionSubtitle: {
        fontSize: 16,
        color: '#64748b',
        marginBottom: 20,
        lineHeight: 22,
    },
    searchCardGradient: {
        borderRadius: 16,
        padding: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    searchCard: {
        backgroundColor: '#ffffff',
        borderRadius: 14,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(10, 36, 114, 0.1)',
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#1e293b',
        marginLeft: 12,
        fontWeight: '500',
    },
    inputDivider: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#e2e8f0',
    },
    suggestionsContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        marginTop: 4,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    suggestionEmoji: {
        fontSize: 16,
        marginRight: 12,
    },
    suggestionText: {
        fontSize: 16,
        color: '#1e293b',
        marginLeft: 12,
        fontWeight: '500',
    },
    searchButtonGradient: {
        borderRadius: 12,
        padding: 2,
        shadowColor: '#0a2472',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    searchButton: {
        backgroundColor: 'transparent',
        paddingVertical: 16,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchButtonDisabled: {
        backgroundColor: 'rgba(148, 163, 184, 0.3)',
        shadowOpacity: 0,
        elevation: 0,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingSpinner: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        marginRight: 8,
    },
    searchButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    quickActionsSection: {
        marginBottom: 30,
    },
    quickActionsGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    quickActionGradient: {
        flex: 1,
        borderRadius: 16,
        padding: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    quickActionCard: {
        backgroundColor: '#ffffff',
        padding: 20,
        borderRadius: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)',
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
        textAlign: 'center',
    },
    actionSubtitle: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
    },
    recentSearchesSection: {
        marginBottom: 30,
    },
    recentSearchesList: {
        gap: 12,
    },
    recentSearchItem: {
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 1,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    recentSearchContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    routeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    routeFrom: {
        fontSize: 16,
        color: '#1e293b',
        fontWeight: '600',
    },
    routeTo: {
        fontSize: 16,
        color: '#1e293b',
        fontWeight: '600',
        marginLeft: 8,
    },
    searchCount: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    countText: {
        fontSize: 12,
        color: '#64748b',
        marginLeft: 4,
        fontWeight: '500',
    },
    tipsSection: {
        marginBottom: 30,
    },
    tipsList: {
        gap: 12,
    },
    tipItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 1,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    tipIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    tipText: {
        fontSize: 15,
        color: '#1e293b',
        fontWeight: '500',
        flex: 1,
        lineHeight: 20,
    },
});