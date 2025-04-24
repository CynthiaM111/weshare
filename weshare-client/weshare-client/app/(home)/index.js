import { View, Text, StatusBar, TextInput, TouchableOpacity, ScrollView, Platform, Button } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { styles } from '../../styles/HomeScreenStyles';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { format } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function HomeScreen() {
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [date, setDate] = useState(new Date());
    const [mode, setMode] = useState('date');
    const [showPicker, setShowPicker] = useState(false);
    const router = useRouter();

    // Combined onChange handler for both date and time
    const onChange = (event, selectedDate) => {
        
        setShowPicker(false);
        if(event.type === 'set') {
            const currentDate = selectedDate || date;
            setDate(currentDate);
        }
    };

    const showPickerMode = (currentMode) => {
        setShowPicker(true);
        setMode(currentMode);
    };

    const handleSearch = async () => {
        try {
            // Combine date and time into a single ISO string
            const dateStr = format(date, 'yyyy-MM-dd');
            console.log(dateStr);
            const timeStr = format(date, 'HH:mm:ss');
            console.log(timeStr);
            // Create proper ISO string (with timezone offset)
            const departureDateTime = new Date(`${dateStr}T${timeStr}`);
            console.log(departureDateTime);
            const timezoneOffset = -departureDateTime.getTimezoneOffset() / 60;

           console.log("departureDateTime.toISOString()", departureDateTime.toISOString());

            
            const response = await axios.get(`http://10.48.21.202:5002/api/rides/search`, {
                params: {
                    from,
                    to,
                    departure_time: departureDateTime.toISOString() // Send as ISO-8601
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
                        searchParams: JSON.stringify({ from, to, date: dateStr })
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

                <TouchableOpacity
                    style={[styles.input, styles.dateTimeInput]}
                    onPress={() => showPickerMode('date')}
                >
                    <Text style={styles.dateTimeText}>
                        {format(date, 'MMM dd, yyyy')}
                    </Text>
                    <Ionicons name="calendar-outline" size={24} color="#808080" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.input, styles.dateTimeInput]}
                    onPress={() => showPickerMode('time')}
                >
                    <Text style={styles.dateTimeText}>
                        {format(date, 'hh:mm a')}
                    </Text>
                    <Ionicons name="time-outline" size={24} color="#808080" />
                </TouchableOpacity>
                {/* DateTime Picker */}
                {showPicker && (
                    <View style={styles.pickerContainer}>
                    <DateTimePicker
                        testID="dateTimePicker"
                        value={date}
                        mode={mode}
                        is24Hour={true}
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={onChange}
                        themeVariant="dark"
    
                        />
                    </View>
                )}

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