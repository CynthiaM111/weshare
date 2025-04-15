// app/(tabs)/index.js
import { View, Text, StatusBar, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { styles } from '../../styles/HomeScreenStyles';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import BottomNav from '../../components/BottomNav';

export default function HomeScreen() {
    const [activeTab, setActiveTab] = useState('Home');
    const router = useRouter();

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
                {/* From Input */}
                <View style={styles.optionalFields}>
                    <Text style={styles.optionalLabel}>From</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="City, town, address, or place"
                    />
                </View>

                {/* To Input */}
                <View style={styles.optionalFields}>
                    <Text style={styles.optionalLabel}>To</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="City, town, address, or place"
                    />
                </View>

                {/* Date and Time Section */}
                <View style={styles.optionalFields}>
                    <Text style={styles.optionalLabel}>Departure date (optional)</Text>
                    <View style={styles.dateTimeContainer}>
                        <TextInput
                            style={[styles.searchInput, { flex: 1, marginRight: 5 }]}
                            placeholder="MM/DD/YYYY"
                        />
                        <TextInput
                            style={[styles.searchInput, { flex: 1, marginLeft: 5 }]}
                            placeholder="HH:MM"
                        />
                    </View>
                </View>

                {/* Find Button */}
                <TouchableOpacity
                    style={styles.findButton}
                    onPress={() => router.push('/rides')}
                >
                    <Text style={styles.findButtonText}>Find matching rides</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} /> */}
        </SafeAreaView>
    );
}