import { View, Text, StatusBar, TextInput, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { styles } from '../../styles/HomeScreenStyles';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { useApi } from '../../hooks/useApi';
import ErrorDisplay from '../../components/ErrorDisplay';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

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
    const router = useRouter();

    useEffect(() => {
        loadFrequentSearches();
    }, []);

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
        setFrom(selected);
        setShowFromSuggestions(false);
    };

    const handleToSelect = (selected) => {
        setTo(selected);
        setShowToSuggestions(false);
    };

    const loadFrequentSearches = async () => {
        try {
            const searches = await AsyncStorage.getItem('frequentSearches');
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
            }
        } catch (error) {
            console.error('Error loading frequent searches:', error);
        }
    };

    const updateFrequentSearches = async (from, to) => {
        try {
            const searches = await AsyncStorage.getItem('frequentSearches');
            const parsedSearches = searches ? JSON.parse(searches) : {};
            const key = `${from}-${to}`;

            if (parsedSearches[key]) {
                parsedSearches[key].count += 1;
            } else {
                parsedSearches[key] = { from, to, count: 1 };
            }

            await AsyncStorage.setItem('frequentSearches', JSON.stringify(parsedSearches));
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
                <View style={styles.searchContainer}>
                    <View style={styles.inputContainer}>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="location" size={24} color="#0a2472" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="From "
                                value={from}
                                onChangeText={handleFromChange}
                                placeholderTextColor="#666"
                                onFocus={() => setShowFromSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowFromSuggestions(false), 200)}
                            />
                        </View>
                        {showFromSuggestions && fromSuggestions.length > 0 && (
                            <View style={styles.suggestionsContainer}>
                                <FlatList
                                    data={fromSuggestions}
                                    renderItem={({ item }) => renderSuggestionItem({ item, onSelect: handleFromSelect })}
                                    keyExtractor={(item) => item}
                                    keyboardShouldPersistTaps="handled"
                                />
                            </View>
                        )}
                        <View style={styles.inputDivider} />
                        <View style={styles.inputWrapper}>
                            <Ionicons name="location" size={24} color="#0a2472" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="To "
                                value={to}
                                onChangeText={handleToChange}
                                placeholderTextColor="#666"
                                onFocus={() => setShowToSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowToSuggestions(false), 200)}
                            />
                        </View>
                        {showToSuggestions && toSuggestions.length > 0 && (
                            <View style={styles.suggestionsContainer}>
                                <FlatList
                                    data={toSuggestions}
                                    renderItem={({ item }) => renderSuggestionItem({ item, onSelect: handleToSelect })}
                                    keyExtractor={(item) => item}
                                    keyboardShouldPersistTaps="handled"
                                />
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
                            <Text style={styles.frequentSearchesTitle}>Frequent Searches</Text>
                            <View style={styles.frequentSearchesGrid}>
                                {frequentSearches.map((search, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.frequentSearchItem}
                                        onPress={() => handleSearch(search.from, search.to)}
                                    >
                                        <View style={styles.frequentSearchContent}>
                                            <Text style={styles.frequentSearchFrom}>{search.from}</Text>
                                            <Ionicons name="arrow-forward" size={16} color="#0a2472" />
                                            <Text style={styles.frequentSearchTo}>{search.to}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
}