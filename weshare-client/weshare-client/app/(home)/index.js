import { View, Text, StatusBar, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { styles } from '../../styles/HomeScreenStyles';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import axios from 'axios';

export default function HomeScreen() {
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const router = useRouter();

    const handleSearch = async () => {
        try {
            if (!from || !to) {
                alert('Please enter both origin and destination');
                return;
            }


            const response = await axios.get(`http://10.48.21.202:5002/api/rides/search`, {
                params: {
                    from: from.trim(),  // Trim whitespace
                    to: to.trim(),      // Trim whitespace
                    exact_match: 'true'   // Add flag for exact match
                },
                paramsSerializer: params => {
                    return Object.entries(params)
                        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
                        .join('&');
                }
            });

            if (response.data.length > 0) {
                router.push({
                    pathname: '/(rides)',
                    params: {
                        rides: JSON.stringify(response.data),
                        searchParams: JSON.stringify({ from, to })
                    }
                });
            } else {
                alert('No rides found for your search criteria');
            }
        } catch (err) {
            console.error('Search error:', err.response?.data || err.message);
            alert(`Search failed: ${err.response?.data?.error || err.message}`);
        }
    };

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
                    style={styles.findButton}
                    onPress={async () => {
                        await handleSearch();
                    }}
                >
                    <Text style={styles.findButtonText}>Find matching rides</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}