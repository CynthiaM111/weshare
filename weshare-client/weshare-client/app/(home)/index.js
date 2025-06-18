import { View, Text, StatusBar, TextInput, TouchableOpacity, ScrollView, FlatList, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback, useRef } from 'react';
// import { styles } from '../../styles/HomeScreenStyles';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
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
    const bounceAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        loadFrequentSearches();
        loadUnreadCount();
        // Add subtle bounce animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(bounceAnim, {
                    toValue: 1.05,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(bounceAnim, {
                    toValue: 1,
                    duration: 2000,
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
        // Focus the "To" input after selection
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

        };
    }

    const handleAddPrivateRide = () => {
        router.push('/(rides)/add-private-ride');
    };

    const handleBookPrivateRide = () => {
        router.push('/(rides)/private');
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
        <LinearGradient
            colors={['#0a2472', '#1E90FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.backgroundGradient}
        >
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#0a2472" />

                {/* Header Section */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greetingText}>{getGreeting()}</Text>
                        <Text style={styles.headerTitle}>Where are you heading? 🚗</Text>
                    </View>
                    <TouchableOpacity style={styles.notificationIcon} onPress={handleNotificationPress}>
                        <Text style={styles.notificationEmoji}>🔔</Text>
                        {unreadCount > 0 && (
                            <View style={styles.notificationBadge}>
                                <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Scrollable Content */}
                <ScrollView
                    style={styles.searchContainer}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Fun Search Card */}
                    <Animated.View style={[styles.inputContainer, { transform: [{ scale: bounceAnim }] }]}>
                        <Text style={styles.searchCardTitle}>Let's find your perfect ride! 🎯</Text>

                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputEmoji}>🏠</Text>
                            <TextInput
                                ref={fromInputRef}
                                style={styles.input}
                                placeholder="Where are you now?"
                                value={from}
                                onChangeText={handleFromChange}
                                placeholderTextColor="#999"
                                onFocus={() => setShowFromSuggestions(true)}
                                onBlur={handleFromBlur}
                            />
                        </View>
                        {showFromSuggestions && fromSuggestions.length > 0 && (
                            <View style={styles.suggestionsContainer}>
                                {fromSuggestions.map((item) => (
                                    <TouchableOpacity
                                        key={item}
                                        style={styles.suggestionItem}
                                        onPressIn={() => setIsSelectingSuggestion(true)}
                                        onPress={() => handleFromSelect(item)}
                                        onPressOut={() => setTimeout(() => setIsSelectingSuggestion(false), 200)}
                                        activeOpacity={0.7}
                                        delayPressIn={0}
                                    >
                                        <Text style={styles.suggestionEmoji}>📍</Text>
                                        <Text style={styles.suggestionText}>{item}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        <View style={styles.inputDivider}>
                            <Text style={styles.dividerEmoji}>⬇️</Text>
                        </View>

                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputEmoji}>🎯</Text>
                            <TextInput
                                ref={toInputRef}
                                style={styles.input}
                                placeholder="Where do you want to go?"
                                value={to}
                                onChangeText={handleToChange}
                                placeholderTextColor="#999"
                                onFocus={() => setShowToSuggestions(true)}
                                onBlur={handleToBlur}
                            />
                        </View>
                        {showToSuggestions && toSuggestions.length > 0 && (
                            <View style={styles.suggestionsContainer}>
                                {toSuggestions.map((item) => (
                                    <TouchableOpacity
                                        key={item}
                                        style={styles.suggestionItem}
                                        onPressIn={() => setIsSelectingSuggestion(true)}
                                        onPress={() => handleToSelect(item)}
                                        onPressOut={() => setTimeout(() => setIsSelectingSuggestion(false), 200)}
                                        activeOpacity={0.7}
                                        delayPressIn={0}
                                    >
                                        <Text style={styles.suggestionEmoji}>📍</Text>
                                        <Text style={styles.suggestionText}>{item}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </Animated.View>

                    {/* Fun Find Button */}
                    <TouchableOpacity
                        style={[styles.findButton, isSearching && styles.findButtonDisabled]}
                        onPress={() => handleSearch()}
                        disabled={isSearching}
                    >
                        <Text style={styles.findButtonText}>
                            {isSearching ? '🔍 Searching for awesome rides...' : '🚀 Find My Ride!'}
                        </Text>
                    </TouchableOpacity>

                    {/* Fun Frequent Searches */}
                    {frequentSearches.length > 0 && (
                        <View style={styles.frequentSearchesContainer}>
                            <View style={styles.frequentSearchesTitleContainer}>
                                <Text style={styles.frequentSearchesEmoji}>⭐</Text>
                                <Text style={styles.frequentSearchesTitle}>Your favorite routes!</Text>
                            </View>
                            <View style={styles.frequentSearchesGrid}>
                                {frequentSearches.map((search, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.frequentSearchItem}
                                        onPress={() => handleSearch(search.from, search.to)}
                                    >
                                        <View style={styles.frequentSearchContent}>
                                            <View style={styles.frequentSearchLocation}>
                                                <Text style={styles.frequentSearchEmoji}>📍</Text>
                                                <Text style={styles.frequentSearchFrom}>{search.from}</Text>
                                            </View>
                                            <Text style={styles.arrowEmoji}>➡️</Text>
                                            <Text style={styles.frequentSearchTo}>{search.to}</Text>
                                        </View>
                                        <Text style={styles.frequentSearchBadge}>Used {search.count} times</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Fun Private Rides Section */}
                    <View style={styles.privateRidesContainer}>
                        <View style={styles.privateRidesHeader}>
                            <Text style={styles.privateRidesEmoji}>✨</Text>
                            <Text style={styles.privateRidesTitle}>Want VIP treatment?</Text>
                        </View>
                        <Text style={styles.privateRidesDescription}>
                            Get your own private ride! More comfort, more privacy, more awesome! 🎉
                        </Text>
                        <View style={styles.privateRidesButtonsContainer}>
                            <TouchableOpacity
                                style={[styles.privateRidesButton, styles.privateRidesButtonPrimary]}
                                onPress={handleBookPrivateRide}
                            >
                                <Text style={[styles.privateRidesButtonText, styles.privateRidesButtonTextPrimary]}>🔥 Book VIP Ride</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.privateRidesButton, styles.privateRidesButtonSecondary]}
                                onPress={handleAddPrivateRide}
                            >
                                <Text style={[styles.privateRidesButtonText, styles.privateRidesButtonTextSecondary]}>🚗 Offer a Ride</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Fun Tips Section */}
                    <View style={styles.tipsContainer}>
                        <Text style={styles.tipsTitle}>💡 Pro Tips</Text>
                        <View style={styles.tipItem}>
                            <Text style={styles.tipEmoji}>🕐</Text>
                            <Text style={styles.tipText}>Book early for better prices!</Text>
                        </View>
                        <View style={styles.tipItem}>
                            <Text style={styles.tipEmoji}>👥</Text>
                            <Text style={styles.tipText}>Share rides to meet new friends!</Text>
                        </View>
                        <View style={styles.tipItem}>
                            <Text style={styles.tipEmoji}>🌟</Text>
                            <Text style={styles.tipText}>Rate your driver to help the community!</Text>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
}

export const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backgroundGradient: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: 'rgba(10, 36, 114, 0.8)',
    },
    greetingText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 2,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
    },
    notificationIcon: {
        padding: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 20,
    },
    notificationEmoji: {
        fontSize: 24,
    },
    notificationBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#FF0000',
        borderRadius: 12,
        padding: 2,
    },
    notificationBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#fff',
    },
    searchContainer: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    inputContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderRadius: 20,
        padding: 20,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 8,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    searchCardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0a2472',
        marginBottom: 15,
        textAlign: 'center',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        backgroundColor: '#f8f9ff',
        borderRadius: 15,
        marginVertical: 5,
    },
    inputEmoji: {
        fontSize: 20,
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        paddingVertical: 5,
    },
    inputDivider: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    dividerEmoji: {
        fontSize: 16,
        color: '#1E90FF',
    },
    suggestionsContainer: {
        backgroundColor: 'white',
        borderRadius: 15,
        marginTop: 8,
        maxHeight: 200,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    suggestionEmoji: {
        fontSize: 16,
        marginRight: 10,
    },
    suggestionText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    findButton: {
        backgroundColor: '#0a2472',
        paddingVertical: 18,
        borderRadius: 25,
        alignItems: 'center',
        shadowColor: '#0a2472',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        marginBottom: 20,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    findButtonDisabled: {
        backgroundColor: 'rgba(10, 36, 114, 0.7)',
    },
    findButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    frequentSearchesContainer: {
        marginTop: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        marginBottom: 20,
        borderWidth: 2,
        borderColor: 'rgba(30, 144, 255, 0.3)',
    },
    frequentSearchesTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    frequentSearchesEmoji: {
        fontSize: 20,
        marginRight: 8,
    },
    frequentSearchesTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E90FF',
    },
    frequentSearchesGrid: {
        flexDirection: 'column',
        gap: 12,
    },
    frequentSearchItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 15,
        width: '100%',
        shadowColor: '#1E90FF',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
        borderWidth: 2,
        borderColor: 'rgba(30, 144, 255, 0.2)',
    },
    frequentSearchContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    frequentSearchLocation: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    frequentSearchEmoji: {
        fontSize: 16,
        marginRight: 6,
    },
    frequentSearchFrom: {
        fontSize: 15,
        color: '#0a2472',
        flex: 1,
        fontWeight: '600',
    },
    frequentSearchTo: {
        fontSize: 15,
        color: '#0a2472',
        flex: 1,
        fontWeight: '600',
    },
    arrowEmoji: {
        fontSize: 16,
        marginHorizontal: 8,
    },
    frequentSearchBadge: {
        fontSize: 11,
        color: '#999',
        fontWeight: 'bold',
        fontStyle: 'italic',
    },
    privateRidesContainer: {
        marginTop: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        marginBottom: 20,
        borderWidth: 2,
        borderColor: 'rgba(10, 36, 114, 0.3)',
    },
    privateRidesHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    privateRidesEmoji: {
        fontSize: 20,
        marginRight: 10,
    },
    privateRidesTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0a2472',
    },
    privateRidesDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 15,
        lineHeight: 20,
        fontWeight: '500',
    },
    privateRidesButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    privateRidesButton: {
        flex: 1,
        paddingVertical: 15,
        paddingHorizontal: 12,
        borderRadius: 15,
        alignItems: 'center',
    },
    privateRidesButtonPrimary: {
        backgroundColor: '#0a2472',
        shadowColor: '#0a2472',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    privateRidesButtonSecondary: {
        backgroundColor: '#ffffff',
        borderWidth: 2,
        borderColor: '#0a2472',
        shadowColor: '#0a2472',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    privateRidesButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    privateRidesButtonTextPrimary: {
        color: '#ffffff',
    },
    privateRidesButtonTextSecondary: {
        color: '#0a2472',
    },
    tipsContainer: {
        marginTop: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        marginBottom: 30,
        borderWidth: 2,
        borderColor: 'rgba(255, 193, 7, 0.3)',
    },
    tipsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFC107',
        marginBottom: 15,
        textAlign: 'center',
    },
    tipItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        backgroundColor: '#fff9e6',
        padding: 12,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#FFC107',
    },
    tipEmoji: {
        fontSize: 18,
        marginRight: 12,
    },
    tipText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
        flex: 1,
    },
    // Legacy styles kept for compatibility
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    navItem: {
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    navText: {
        fontSize: 12,
        marginTop: 4,
    },
    iosButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    iosButton: {
        backgroundColor: '#0a2472',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20,
    },
    pickerContainer: {
        backgroundColor: '#333',
        borderRadius: Platform.OS === 'ios' ? 10 : 0,
        padding: Platform.OS === 'ios' ? 10 : 0,
        margin: 10,
        height: Platform.OS === 'ios' ? 200 : 'auto',
    },
    buttonContainer: {
        margin: 10,
    },
    dateTimeInput: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingRight: 12,
    },
    dateTimeText: {
        fontSize: 16,
        color: '#000',
    },
});