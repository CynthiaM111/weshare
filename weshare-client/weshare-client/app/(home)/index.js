import { View, Text, StatusBar, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { styles } from '../../styles/HomeScreenStyles';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { useApi } from '../../hooks/useApi';
import ErrorDisplay from '../../components/ErrorDisplay';

export default function HomeScreen() {
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const router = useRouter();

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

    const handleSearch = async () => {
        if (!from || !to) {
            return;
        }

        try {
            const rides = await searchRides({ from, to });
            if (rides.length > 0) {
                router.push({
                    pathname: '/(rides)',
                    params: {
                        rides: JSON.stringify(rides),
                        searchParams: JSON.stringify({ from, to })
                    }
                });
            } else {
                router.push({
                    pathname: '/(rides)',
                    params: {
                        rides: JSON.stringify([]),
                        searchParams: JSON.stringify({ from, to })
                    }
                });
            }
        } catch (error) {
            // Error is already handled by useApi
            console.error('Search error:', error);
        }
    };

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
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />

            {/* Header Section */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Where to?</Text>
                <TouchableOpacity style={styles.notificationIcon}>
                    <Ionicons name="notifications-outline" size={24} color="#000" />
                </TouchableOpacity>
            </View>

            {/* Scrollable Content */}
            <ScrollView
                contentContainerStyle={styles.searchContainer}
                keyboardShouldPersistTaps="handled"
            >
                <TextInput
                    style={styles.input}
                    placeholder="From"
                    value={from}
                    onChangeText={setFrom}
                    textColor="#000"
                    placeholderTextColor="#D3D3D3"
                />
                <TextInput
                    style={styles.input}
                    placeholder="To"
                    value={to}
                    onChangeText={setTo}
                    textColor="#000"
                    placeholderTextColor="#D3D3D3"
                />

                {/* Find Button */}
                <TouchableOpacity
                    style={[styles.findButton, isSearching && styles.findButtonDisabled]}
                    onPress={handleSearch}
                    disabled={isSearching}
                >
                    <Text style={styles.findButtonText}>
                        {isSearching ? 'Searching...' : 'Find matching rides'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}