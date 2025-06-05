import { View, Text, StatusBar, TextInput, TouchableOpacity, ScrollView, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback, useRef } from 'react';
// import { styles } from '../../styles/HomeScreenStyles';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { useApi } from '../../hooks/useApi';
import ErrorDisplay from '../../components/ErrorDisplay';
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
    "Nyarugenge"
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

    // Add refs for the inputs
    const fromInputRef = useRef(null);
    const toInputRef = useRef(null);

    useEffect(() => {
        loadFrequentSearches();
    }, [loadFrequentSearches]);

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
                    exact_match: 'true'
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
        } catch (error) {
            console.error('Search error:', error);
        }
    };

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
            <Ionicons name="location" size={16} color="#0a2472" style={styles.suggestionIcon} />
            <Text style={styles.suggestionText}>{item}</Text>
        </TouchableOpacity>
    );

    if (searchError) {
        return (
            <SafeAreaView style={styles.container}>
                <ErrorDisplay
                    error={searchError}
                    onRetry={() => handleSearch()}
                    title="Search Failed"
                    message="We couldn't search for rides at this time."
                    retryText="Retry"
                />
            </SafeAreaView>
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
                <StatusBar barStyle="light-content" backgroundColor="#0a2472" />

                {/* Header Section */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Where to?</Text>
                    <TouchableOpacity style={styles.notificationIcon}>
                        <Ionicons name="notifications-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Scrollable Content */}
                <ScrollView
                    style={styles.searchContainer}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.inputContainer}>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="location" size={24} color="#0a2472" style={styles.inputIcon} />
                            <TextInput
                                ref={fromInputRef}
                                style={styles.input}
                                placeholder="From "
                                value={from}
                                onChangeText={handleFromChange}
                                placeholderTextColor="#666"
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
                                        <Ionicons name="location" size={16} color="#0a2472" style={styles.suggestionIcon} />
                                        <Text style={styles.suggestionText}>{item}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                        <View style={styles.inputDivider} />
                        <View style={styles.inputWrapper}>
                            <Ionicons name="location" size={24} color="#0a2472" style={styles.inputIcon} />
                            <TextInput
                                ref={toInputRef}
                                style={styles.input}
                                placeholder="To "
                                value={to}
                                onChangeText={handleToChange}
                                placeholderTextColor="#666"
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
                                        <Ionicons name="location" size={16} color="#0a2472" style={styles.suggestionIcon} />
                                        <Text style={styles.suggestionText}>{item}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Find Button */}
                    <TouchableOpacity
                        style={[styles.findButton, isSearching && styles.findButtonDisabled]}
                        onPress={() => handleSearch()}
                        disabled={isSearching}
                    >
                        <Text style={styles.findButtonText}>
                            {isSearching ? 'Searching...' : 'Find matching rides'}
                        </Text>
                    </TouchableOpacity>

                    {/* Frequent Searches */}
                    {frequentSearches.length > 0 && (
                        <View style={styles.frequentSearchesContainer}>
                            <View style={styles.frequentSearchesTitleContainer}>
                                <Ionicons name="star-outline" size={24} color="#0a2472" style={styles.frequentSearchesIcon} />
                                <Text style={styles.frequentSearchesTitle}>Frequent Searches</Text>
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
                                                <Ionicons name="home-outline" size={16} color="#0a2472" style={styles.frequentSearchIcon} />
                                                <Text style={styles.frequentSearchFrom}>{search.from}</Text>
                                            </View>
                                            <Ionicons name="arrow-forward" size={16} color="#0a2472" />
                                            <Text style={styles.frequentSearchTo}>{search.to}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Private Rides Section */}
                    <View style={styles.privateRidesContainer}>
                        <View style={styles.privateRidesHeader}>
                            <Ionicons name="car-sport-outline" size={24} color="#0a2472" style={styles.privateRidesIcon} />
                            <Text style={styles.privateRidesTitle}>Want to go private?</Text>
                        </View>
                        <Text style={styles.privateRidesDescription}>
                            Book a private ride for a more comfortable and exclusive experience
                        </Text>
                        <View style={styles.privateRidesButtonsContainer}>
                            <TouchableOpacity
                                style={[styles.privateRidesButton, styles.privateRidesButtonPrimary]}
                                onPress={handleBookPrivateRide}
                            >
                                <Text style={[styles.privateRidesButtonText, styles.privateRidesButtonTextPrimary]}>Book Private Ride</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.privateRidesButton, styles.privateRidesButtonSecondary]}
                                onPress={handleAddPrivateRide}
                            >
                                <Text style={[styles.privateRidesButtonText, styles.privateRidesButtonTextSecondary]}>Add Private Ride</Text>
                            </TouchableOpacity>
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
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    notificationIcon: {
        padding: 8,
    },
    searchContainer: {
        flex: 1, // Changed from flexGrow to flex for proper ScrollView behavior
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100, // Ensure enough space for bottom navigation
    },
    inputContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        paddingVertical: 8,
    },
    inputDivider: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginVertical: 8,
    },
    suggestionsContainer: {
        backgroundColor: 'white',
        borderRadius: 8,
        marginTop: 4,
        maxHeight: 200,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    suggestionIcon: {
        marginRight: 10,
    },
    suggestionText: {
        fontSize: 16,
        color: '#333',
    },
    findButton: {
        backgroundColor: '#0a2472',
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 20, // Added margin for spacing
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
        marginTop: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 12,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 20, // Added margin for spacing
    },
    frequentSearchesTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    frequentSearchesIcon: {
        marginRight: 8,
    },
    frequentSearchesTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0a2472',
    },
    frequentSearchesGrid: {
        flexDirection: 'column',
        gap: 10,
    },
    frequentSearchItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 12,
        width: '100%',
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(10, 36, 114, 0.2)',
    },
    frequentSearchContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    frequentSearchLocation: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    frequentSearchIcon: {
        marginRight: 6,
    },
    frequentSearchFrom: {
        fontSize: 15,
        color: '#0a2472',
        flex: 1,
        fontWeight: '500',
    },
    frequentSearchTo: {
        fontSize: 15,
        color: '#0a2472',
        flex: 1,
        fontWeight: '500',
    },
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
    privateRidesContainer: {
        marginTop: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 20, // Ensure consistent bottom margin
    },
    privateRidesHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    privateRidesIcon: {
        marginRight: 10,
    },
    privateRidesTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0a2472',
    },
    privateRidesDescription: {
        fontSize: 13,
        color: '#666',
        marginBottom: 12,
        lineHeight: 18,
    },
    privateRidesButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    privateRidesButton: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    privateRidesButtonPrimary: {
        backgroundColor: '#0a2472',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    privateRidesButtonSecondary: {
        backgroundColor: '#ffffff',
        borderWidth: 1.5,
        borderColor: '#0a2472',
    },
    privateRidesButtonText: {
        fontSize: 13,
        fontWeight: '600',
    },
    privateRidesButtonTextPrimary: {
        color: '#ffffff',
    },
    privateRidesButtonTextSecondary: {
        color: '#0a2472',
    },
});