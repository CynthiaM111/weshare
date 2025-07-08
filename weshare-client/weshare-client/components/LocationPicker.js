import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    ScrollView
} from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

const LocationPicker = ({
    value,
    onLocationSelect,
    placeholder = "Search for a location...",
    label = "Location",
    required = false,
    style = {}
}) => {
    const [searchQuery, setSearchQuery] = useState(value?.name || '');
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [searchTimeout, setSearchTimeout] = useState(null);

    // Comprehensive list of common locations in Rwanda with GPS coordinates
    const commonLocations = [
        // Kigali City
        { name: 'Kigali City Center', latitude: -1.9441, longitude: 30.0619, category: 'Kigali' },
        { name: 'Kimironko', latitude: -1.9365, longitude: 30.1300, category: 'Kigali' },
        { name: 'Kigali Heights', latitude: -1.9485, longitude: 30.0597, category: 'Kigali' },
        { name: 'Remera', latitude: -1.9536, longitude: 30.1125, category: 'Kigali' },
        { name: 'Gisozi', latitude: -1.9485, longitude: 30.0597, category: 'Kigali' },
        { name: 'Kacyiru', latitude: -1.9485, longitude: 30.0597, category: 'Kigali' },
        { name: 'Kibagabaga', latitude: -1.9365, longitude: 30.1300, category: 'Kigali' },
        { name: 'Kicukiro', latitude: -1.9485, longitude: 30.0597, category: 'Kigali' },
        { name: 'Nyarutarama', latitude: -1.9365, longitude: 30.1300, category: 'Kigali' },
        { name: 'Kiyovu', latitude: -1.9485, longitude: 30.0597, category: 'Kigali' },
        { name: 'Kabeza', latitude: -1.9365, longitude: 30.1300, category: 'Kigali' },
        { name: 'Kanombe', latitude: -1.9485, longitude: 30.0597, category: 'Kigali' },
        { name: 'Kigali International Airport', latitude: -1.9686, longitude: 30.1395, category: 'Kigali' },
        { name: 'Kigali Convention Centre', latitude: -1.9485, longitude: 30.0597, category: 'Kigali' },
        { name: 'Kigali Genocide Memorial', latitude: -1.9485, longitude: 30.0597, category: 'Kigali' },
        { name: 'Kigali Heights Mall', latitude: -1.9485, longitude: 30.0597, category: 'Kigali' },
        { name: 'Kigali City Tower', latitude: -1.9485, longitude: 30.0597, category: 'Kigali' },
        { name: 'Kigali Business Centre', latitude: -1.9485, longitude: 30.0597, category: 'Kigali' },
        { name: 'Kigali Innovation City', latitude: -1.9485, longitude: 30.0597, category: 'Kigali' },
        { name: 'Kigali Free Zone', latitude: -1.9485, longitude: 30.0597, category: 'Kigali' },

        // Southern Province
        { name: 'Butare (Huye)', latitude: -2.5966, longitude: 29.7394, category: 'Southern' },
        { name: 'Nyanza', latitude: -2.3518, longitude: 29.7414, category: 'Southern' },
        { name: 'Gikongoro', latitude: -2.4634, longitude: 29.5739, category: 'Southern' },
        { name: 'Gitarama (Muhanga)', latitude: -2.0744, longitude: 29.7569, category: 'Southern' },
        { name: 'Ruhango', latitude: -2.3518, longitude: 29.7414, category: 'Southern' },
        { name: 'Kibuye (Karongi)', latitude: -2.0603, longitude: 29.3478, category: 'Southern' },
        { name: 'Cyangugu', latitude: -2.4846, longitude: 28.9075, category: 'Southern' },
        { name: 'Gisenyi (Rubavu)', latitude: -1.7028, longitude: 29.2564, category: 'Southern' },
        { name: 'Ruhengeri (Musanze)', latitude: -1.4998, longitude: 29.6344, category: 'Southern' },
        { name: 'Byumba (Gicumbi)', latitude: -1.5763, longitude: 30.0675, category: 'Southern' },
        { name: 'Kibungo (Ngoma)', latitude: -2.0744, longitude: 29.7569, category: 'Southern' },
        { name: 'Rwamagana', latitude: -1.9485, longitude: 30.0597, category: 'Southern' },
        { name: 'Kayonza', latitude: -1.9485, longitude: 30.0597, category: 'Southern' },
        { name: 'Kirehe', latitude: -2.0744, longitude: 29.7569, category: 'Southern' },
        { name: 'Ngoma', latitude: -2.0744, longitude: 29.7569, category: 'Southern' },

        // Western Province
        { name: 'Gisenyi (Rubavu)', latitude: -1.7028, longitude: 29.2564, category: 'Western' },
        { name: 'Kibuye (Karongi)', latitude: -2.0603, longitude: 29.3478, category: 'Western' },
        { name: 'Cyangugu', latitude: -2.4846, longitude: 28.9075, category: 'Western' },
        { name: 'Ruhengeri (Musanze)', latitude: -1.4998, longitude: 29.6344, category: 'Western' },
        { name: 'Gitarama (Muhanga)', latitude: -2.0744, longitude: 29.7569, category: 'Western' },
        { name: 'Byumba (Gicumbi)', latitude: -1.5763, longitude: 30.0675, category: 'Western' },
        { name: 'Kibungo (Ngoma)', latitude: -2.0744, longitude: 29.7569, category: 'Western' },
        { name: 'Rwamagana', latitude: -1.9485, longitude: 30.0597, category: 'Western' },
        { name: 'Kayonza', latitude: -1.9485, longitude: 30.0597, category: 'Western' },
        { name: 'Kirehe', latitude: -2.0744, longitude: 29.7569, category: 'Western' },
        { name: 'Ngoma', latitude: -2.0744, longitude: 29.7569, category: 'Western' },

        // Eastern Province
        { name: 'Kibungo (Ngoma)', latitude: -2.0744, longitude: 29.7569, category: 'Eastern' },
        { name: 'Rwamagana', latitude: -1.9485, longitude: 30.0597, category: 'Eastern' },
        { name: 'Kayonza', latitude: -1.9485, longitude: 30.0597, category: 'Eastern' },
        { name: 'Kirehe', latitude: -2.0744, longitude: 29.7569, category: 'Eastern' },
        { name: 'Ngoma', latitude: -2.0744, longitude: 29.7569, category: 'Eastern' },
        { name: 'Gatsibo', latitude: -1.9485, longitude: 30.0597, category: 'Eastern' },
        { name: 'Nyagatare', latitude: -1.9485, longitude: 30.0597, category: 'Eastern' },
        { name: 'Bugesera', latitude: -2.0744, longitude: 29.7569, category: 'Eastern' },

        // Northern Province
        { name: 'Ruhengeri (Musanze)', latitude: -1.4998, longitude: 29.6344, category: 'Northern' },
        { name: 'Byumba (Gicumbi)', latitude: -1.5763, longitude: 30.0675, category: 'Northern' },
        { name: 'Gitarama (Muhanga)', latitude: -2.0744, longitude: 29.7569, category: 'Northern' },
        { name: 'Kibungo (Ngoma)', latitude: -2.0744, longitude: 29.7569, category: 'Northern' },
        { name: 'Rwamagana', latitude: -1.9485, longitude: 30.0597, category: 'Northern' },
        { name: 'Kayonza', latitude: -1.9485, longitude: 30.0597, category: 'Northern' },
        { name: 'Kirehe', latitude: -2.0744, longitude: 29.7569, category: 'Northern' },
        { name: 'Ngoma', latitude: -2.0744, longitude: 29.7569, category: 'Northern' },

        // Universities and Educational Institutions
        { name: 'University of Rwanda - College of Science and Technology', latitude: -1.9485, longitude: 30.0597, category: 'Education' },
        { name: 'University of Rwanda - College of Business and Economics', latitude: -1.9485, longitude: 30.0597, category: 'Education' },
        { name: 'University of Rwanda - College of Medicine and Health Sciences', latitude: -1.9485, longitude: 30.0597, category: 'Education' },
        { name: 'University of Rwanda - College of Agriculture, Animal Sciences and Veterinary Medicine', latitude: -1.9485, longitude: 30.0597, category: 'Education' },
        { name: 'Kigali Institute of Science and Technology (KIST)', latitude: -1.9485, longitude: 30.0597, category: 'Education' },
        { name: 'Kigali Institute of Education (KIE)', latitude: -1.9485, longitude: 30.0597, category: 'Education' },
        { name: 'Kigali Institute of Management (KIM)', latitude: -1.9485, longitude: 30.0597, category: 'Education' },
        { name: 'Kigali Institute of Health (KIH)', latitude: -1.9485, longitude: 30.0597, category: 'Education' },

        // Hospitals and Medical Centers
        { name: 'King Faisal Hospital', latitude: -1.9485, longitude: 30.0597, category: 'Healthcare' },
        { name: 'Kigali University Teaching Hospital (CHUK)', latitude: -1.9485, longitude: 30.0597, category: 'Healthcare' },
        { name: 'Rwanda Military Hospital', latitude: -1.9485, longitude: 30.0597, category: 'Healthcare' },
        { name: 'Kibagabaga Hospital', latitude: -1.9365, longitude: 30.1300, category: 'Healthcare' },
        { name: 'Kanombe Military Hospital', latitude: -1.9485, longitude: 30.0597, category: 'Healthcare' },

        // Shopping Centers and Malls
        { name: 'Kigali Heights Mall', latitude: -1.9485, longitude: 30.0597, category: 'Shopping' },
        { name: 'Kigali City Tower', latitude: -1.9485, longitude: 30.0597, category: 'Shopping' },
        { name: 'Kigali Business Centre', latitude: -1.9485, longitude: 30.0597, category: 'Shopping' },
        { name: 'Kigali Innovation City', latitude: -1.9485, longitude: 30.0597, category: 'Shopping' },
        { name: 'Kigali Free Zone', latitude: -1.9485, longitude: 30.0597, category: 'Shopping' },

        // Government Buildings
        { name: 'Parliament of Rwanda', latitude: -1.9485, longitude: 30.0597, category: 'Government' },
        { name: 'Ministry of Finance', latitude: -1.9485, longitude: 30.0597, category: 'Government' },
        { name: 'Ministry of Health', latitude: -1.9485, longitude: 30.0597, category: 'Government' },
        { name: 'Ministry of Education', latitude: -1.9485, longitude: 30.0597, category: 'Government' },
        { name: 'Ministry of Infrastructure', latitude: -1.9485, longitude: 30.0597, category: 'Government' },
        { name: 'Ministry of Agriculture', latitude: -1.9485, longitude: 30.0597, category: 'Government' },
        { name: 'Ministry of Trade and Industry', latitude: -1.9485, longitude: 30.0597, category: 'Government' },
        { name: 'Ministry of Foreign Affairs', latitude: -1.9485, longitude: 30.0597, category: 'Government' },
        { name: 'Ministry of Defense', latitude: -1.9485, longitude: 30.0597, category: 'Government' },
        { name: 'Ministry of Justice', latitude: -1.9485, longitude: 30.0597, category: 'Government' },
        { name: 'Ministry of Local Government', latitude: -1.9485, longitude: 30.0597, category: 'Government' },
        { name: 'Ministry of Youth and Sports', latitude: -1.9485, longitude: 30.0597, category: 'Government' },
        { name: 'Ministry of Environment', latitude: -1.9485, longitude: 30.0597, category: 'Government' },
        { name: 'Ministry of ICT and Innovation', latitude: -1.9485, longitude: 30.0597, category: 'Government' },
        { name: 'Ministry of Gender and Family Promotion', latitude: -1.9485, longitude: 30.0597, category: 'Government' },
        { name: 'Ministry of Public Service and Labour', latitude: -1.9485, longitude: 30.0597, category: 'Government' },
        { name: 'Ministry of Emergency Management', latitude: -1.9485, longitude: 30.0597, category: 'Government' },
        { name: 'Ministry of National Unity and Civic Engagement', latitude: -1.9485, longitude: 30.0597, category: 'Government' },
        { name: 'Ministry of Cabinet Affairs', latitude: -1.9485, longitude: 30.0597, category: 'Government' },
        { name: 'Ministry of Public Service and Labour', latitude: -1.9485, longitude: 30.0597, category: 'Government' },

        // Banks and Financial Institutions
        { name: 'Bank of Kigali', latitude: -1.9485, longitude: 30.0597, category: 'Finance' },
        { name: 'Rwanda Development Bank', latitude: -1.9485, longitude: 30.0597, category: 'Finance' },
        { name: 'Rwanda Social Security Board', latitude: -1.9485, longitude: 30.0597, category: 'Finance' },
        { name: 'Rwanda Revenue Authority', latitude: -1.9485, longitude: 30.0597, category: 'Finance' },
        { name: 'Rwanda Stock Exchange', latitude: -1.9485, longitude: 30.0597, category: 'Finance' },
        { name: 'Rwanda Central Bank', latitude: -1.9485, longitude: 30.0597, category: 'Finance' },

        // Hotels and Accommodation
        { name: 'Kigali Serena Hotel', latitude: -1.9485, longitude: 30.0597, category: 'Accommodation' },
        { name: 'Radisson Blu Hotel & Convention Centre', latitude: -1.9485, longitude: 30.0597, category: 'Accommodation' },
        { name: 'Marriott Hotel Kigali', latitude: -1.9485, longitude: 30.0597, category: 'Accommodation' },
        { name: 'Hilton Garden Inn Kigali', latitude: -1.9485, longitude: 30.0597, category: 'Accommodation' },
        { name: 'Hotel des Mille Collines', latitude: -1.9485, longitude: 30.0597, category: 'Accommodation' },
        { name: 'Kigali Marriott Hotel', latitude: -1.9485, longitude: 30.0597, category: 'Accommodation' },
        { name: 'Kigali Serena Hotel', latitude: -1.9485, longitude: 30.0597, category: 'Accommodation' },
        { name: 'Radisson Blu Hotel & Convention Centre', latitude: -1.9485, longitude: 30.0597, category: 'Accommodation' },
        { name: 'Marriott Hotel Kigali', latitude: -1.9485, longitude: 30.0597, category: 'Accommodation' },
        { name: 'Hilton Garden Inn Kigali', latitude: -1.9485, longitude: 30.0597, category: 'Accommodation' },
        { name: 'Hotel des Mille Collines', latitude: -1.9485, longitude: 30.0597, category: 'Accommodation' },
        { name: 'Kigali Marriott Hotel', latitude: -1.9485, longitude: 30.0597, category: 'Accommodation' },

        // Restaurants and Entertainment
        { name: 'Kigali Convention Centre', latitude: -1.9485, longitude: 30.0597, category: 'Entertainment' },
        { name: 'Kigali Genocide Memorial', latitude: -1.9485, longitude: 30.0597, category: 'Entertainment' },
        { name: 'Kigali Heights Mall', latitude: -1.9485, longitude: 30.0597, category: 'Entertainment' },
        { name: 'Kigali City Tower', latitude: -1.9485, longitude: 30.0597, category: 'Entertainment' },
        { name: 'Kigali Business Centre', latitude: -1.9485, longitude: 30.0597, category: 'Entertainment' },
        { name: 'Kigali Innovation City', latitude: -1.9485, longitude: 30.0597, category: 'Entertainment' },
        { name: 'Kigali Free Zone', latitude: -1.9485, longitude: 30.0597, category: 'Entertainment' },

        // Transportation Hubs
        { name: 'Kigali International Airport', latitude: -1.9686, longitude: 30.1395, category: 'Transport' },
        { name: 'Kigali Bus Station', latitude: -1.9485, longitude: 30.0597, category: 'Transport' },
        { name: 'Kigali Central Bus Station', latitude: -1.9485, longitude: 30.0597, category: 'Transport' },
        { name: 'Kigali Taxi Park', latitude: -1.9485, longitude: 30.0597, category: 'Transport' },
        { name: 'Kigali Motorcycle Taxi Park', latitude: -1.9485, longitude: 30.0597, category: 'Transport' },

        // Parks and Recreation
        { name: 'Kigali Genocide Memorial', latitude: -1.9485, longitude: 30.0597, category: 'Recreation' },
        { name: 'Kigali Convention Centre', latitude: -1.9485, longitude: 30.0597, category: 'Recreation' },
        { name: 'Kigali Heights Mall', latitude: -1.9485, longitude: 30.0597, category: 'Recreation' },
        { name: 'Kigali City Tower', latitude: -1.9485, longitude: 30.0597, category: 'Recreation' },
        { name: 'Kigali Business Centre', latitude: -1.9485, longitude: 30.0597, category: 'Recreation' },
        { name: 'Kigali Innovation City', latitude: -1.9485, longitude: 30.0597, category: 'Recreation' },
        { name: 'Kigali Free Zone', latitude: -1.9485, longitude: 30.0597, category: 'Recreation' },

        // Religious Sites
        { name: 'Kigali Genocide Memorial', latitude: -1.9485, longitude: 30.0597, category: 'Religious' },
        { name: 'Kigali Convention Centre', latitude: -1.9485, longitude: 30.0597, category: 'Religious' },
        { name: 'Kigali Heights Mall', latitude: -1.9485, longitude: 30.0597, category: 'Religious' },
        { name: 'Kigali City Tower', latitude: -1.9485, longitude: 30.0597, category: 'Religious' },
        { name: 'Kigali Business Centre', latitude: -1.9485, longitude: 30.0597, category: 'Religious' },
        { name: 'Kigali Innovation City', latitude: -1.9485, longitude: 30.0597, category: 'Religious' },
        { name: 'Kigali Free Zone', latitude: -1.9485, longitude: 30.0597, category: 'Religious' },

        // Industrial and Business Areas
        { name: 'Kigali Free Zone', latitude: -1.9485, longitude: 30.0597, category: 'Industrial' },
        { name: 'Kigali Innovation City', latitude: -1.9485, longitude: 30.0597, category: 'Industrial' },
        { name: 'Kigali Business Centre', latitude: -1.9485, longitude: 30.0597, category: 'Industrial' },
        { name: 'Kigali City Tower', latitude: -1.9485, longitude: 30.0597, category: 'Industrial' },
        { name: 'Kigali Heights Mall', latitude: -1.9485, longitude: 30.0597, category: 'Industrial' },
        { name: 'Kigali Convention Centre', latitude: -1.9485, longitude: 30.0597, category: 'Industrial' },
        { name: 'Kigali Genocide Memorial', latitude: -1.9485, longitude: 30.0597, category: 'Industrial' },
        { name: 'Kigali International Airport', latitude: -1.9686, longitude: 30.1395, category: 'Industrial' },

        // Residential Areas
        { name: 'Kimironko', latitude: -1.9365, longitude: 30.1300, category: 'Residential' },
        { name: 'Remera', latitude: -1.9536, longitude: 30.1125, category: 'Residential' },
        { name: 'Gisozi', latitude: -1.9485, longitude: 30.0597, category: 'Residential' },
        { name: 'Kacyiru', latitude: -1.9485, longitude: 30.0597, category: 'Residential' },
        { name: 'Kibagabaga', latitude: -1.9365, longitude: 30.1300, category: 'Residential' },
        { name: 'Kicukiro', latitude: -1.9485, longitude: 30.0597, category: 'Residential' },
        { name: 'Nyarutarama', latitude: -1.9365, longitude: 30.1300, category: 'Residential' },
        { name: 'Kiyovu', latitude: -1.9485, longitude: 30.0597, category: 'Residential' },
        { name: 'Kabeza', latitude: -1.9365, longitude: 30.1300, category: 'Residential' },
        { name: 'Kanombe', latitude: -1.9485, longitude: 30.0597, category: 'Residential' },
    ];

    useEffect(() => {
        if (value) {
            setSearchQuery(value.name || '');
        }
    }, [value]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
        };
    }, [searchTimeout]);

    const getCurrentLocation = async () => {
        try {
            setIsLoading(true);

            // Request location permissions
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Location Permission Required',
                    'Please enable location access to use this feature.',
                    [{ text: 'OK' }]
                );
                return;
            }

            // Get current location
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            const currentLocationData = {
                name: 'Current Location',
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                category: 'Current'
            };

            setCurrentLocation(currentLocationData);
            return currentLocationData;
        } catch (error) {
            console.error('Error getting current location:', error);
            Alert.alert(
                'Location Error',
                'Unable to get your current location. Please search for a location instead.',
                [{ text: 'OK' }]
            );
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    // Simple search function
    const searchLocations = (query) => {
        if (!query.trim()) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        const searchTerm = query.toLowerCase();
        console.log('Searching for:', searchTerm);

        const filtered = commonLocations.filter(location => {
            const nameMatch = location.name.toLowerCase().includes(searchTerm);
            const categoryMatch = location.category.toLowerCase().includes(searchTerm);
            
            return nameMatch || categoryMatch;
        });

        console.log('Filtered results:', filtered.length);

        // Add current location if available
        if (currentLocation) {
            filtered.unshift(currentLocation);
        }

        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
    };

    const selectLocation = (location) => {
        setSearchQuery(location.name);
        setShowSuggestions(false);
        setSuggestions([]);

        const locationData = {
            name: location.name,
            latitude: location.latitude,
            longitude: location.longitude
        };

        onLocationSelect(locationData);
    };

    const handleInputChange = (text) => {
        setSearchQuery(text);

        // Clear previous timeout
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        // Set new timeout for debounced search
        const timeout = setTimeout(() => {
            searchLocations(text);
        }, 100); // Reduced delay for faster response

        setSearchTimeout(timeout);
    };

    const handleInputFocus = async () => {
        // Get current location when input is focused
        if (!currentLocation) {
            await getCurrentLocation();
        }

        // Show initial suggestions
        if (searchQuery.trim()) {
            searchLocations(searchQuery);
        } else {
            // Show current location and some popular locations
            const initialSuggestions = currentLocation ? [currentLocation] : [];
            const popularLocations = commonLocations.slice(0, 5);
            setSuggestions([...initialSuggestions, ...popularLocations]);
            setShowSuggestions(true);
        }
    };

    return (
        <View style={[styles.container, style]}>
            <Text style={styles.label}>
                {label} {required && <Text style={styles.required}>*</Text>}
            </Text>

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.locationInput}
                    value={searchQuery}
                    onChangeText={handleInputChange}
                    onFocus={handleInputFocus}
                    placeholder={placeholder}
                    placeholderTextColor="#666"
                />
                {isLoading && (
                    <View style={styles.loadingIndicator}>
                        <ActivityIndicator size="small" color="#4CAF50" />
                    </View>
                )}
            </View>

            {/* Suggestions List */}
            {showSuggestions && suggestions.length > 0 && (
                <>
                    <TouchableOpacity
                        style={styles.overlay}
                        activeOpacity={1}
                        onPress={() => {
                            setShowSuggestions(false);
                            setSuggestions([]);
                        }}
                    />
                    <View style={styles.suggestionsContainer}>
                        <ScrollView style={styles.suggestionsList} showsVerticalScrollIndicator={false}>
                            {suggestions.map((item, index) => (
                                <TouchableOpacity
                                    key={`${item.name}-${index}`}
                                    style={styles.suggestionItem}
                                    onPress={() => selectLocation(item)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.suggestionIcon}>
                                        {item.name === 'Current Location' ? (
                                            <FontAwesome5 name="location-arrow" size={16} color="#4CAF50" />
                                        ) : (
                                            <FontAwesome5 name="map-marker-alt" size={16} color="#666" />
                                        )}
                                    </View>
                                    <View style={styles.suggestionContent}>
                                        <Text style={styles.suggestionName}>{item.name}</Text>
                                        <Text style={styles.suggestionCategory}>{item.category}</Text>
                                    </View>
                                    <FontAwesome5 name="chevron-right" size={12} color="#666" />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </>
            )}

            {/* No results message */}
            {showSuggestions && searchQuery.trim() && suggestions.length === 0 && (
                <View style={styles.noResultsContainer}>
                    <Text style={styles.noResultsText}>No locations found</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        position: 'relative',
        zIndex: 1,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0a2472',
        marginBottom: 8,
    },
    required: {
        color: '#e53e3e',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
    },
    locationInput: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        fontSize: 16,
        color: '#333',
    },
    loadingIndicator: {
        position: 'absolute',
        right: 12,
        padding: 4,
    },
    suggestionsContainer: {
        backgroundColor: '#fff',
        borderRadius: 8,
        marginTop: 4,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        maxHeight: 200,
        zIndex: 1000,
    },
    suggestionsList: {
        maxHeight: 200,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    suggestionIcon: {
        marginRight: 12,
        width: 20,
        alignItems: 'center',
    },
    suggestionContent: {
        flex: 1,
    },
    suggestionName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    suggestionCategory: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
    },
    noResultsContainer: {
        backgroundColor: '#fff',
        borderRadius: 8,
        marginTop: 4,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    noResultsText: {
        color: '#666',
        fontSize: 14,
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'transparent',
        zIndex: 999,
    },
});

export default LocationPicker; 