import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

const LocationPicker = ({
    value,
    onLocationSelect,
    placeholder = "Search for a location...",
    label = "Location",
    required = false,
    style = {},
    onValidityChange
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [searchTimeout, setSearchTimeout] = useState(null);
    const [isValidLocation, setIsValidLocation] = useState(false);

    // Simplified list of Rwanda's 30 districts and popular places
    const commonLocations = [
        // Kigali City Districts
        { name: 'Kigali City Center', latitude: -1.9441, longitude: 30.0619 },
        { name: 'Kimironko', latitude: -1.9365, longitude: 30.1300 },
        { name: 'Remera', latitude: -1.9536, longitude: 30.1125 },
        { name: 'Gisozi', latitude: -1.9485, longitude: 30.0597 },
        { name: 'Kacyiru', latitude: -1.9485, longitude: 30.0597 },
        { name: 'Kibagabaga', latitude: -1.9365, longitude: 30.1300 },
        { name: 'Kicukiro', latitude: -1.9485, longitude: 30.0597 },
        { name: 'Nyarutarama', latitude: -1.9365, longitude: 30.1300 },
        { name: 'Kiyovu', latitude: -1.9485, longitude: 30.0597 },
        { name: 'Kabeza', latitude: -1.9365, longitude: 30.1300 },
        { name: 'Kanombe', latitude: -1.9485, longitude: 30.0597 },

        // Northern Province Districts
        { name: 'Musanze', latitude: -1.4998, longitude: 29.6344 },
        { name: 'Gicumbi', latitude: -1.5763, longitude: 30.0675 },
        { name: 'Burera', latitude: -1.4998, longitude: 29.6344 },
        { name: 'Rulindo', latitude: -1.5763, longitude: 30.0675 },

        // Eastern Province Districts
        { name: 'Rwamagana', latitude: -1.9485, longitude: 30.0597 },
        { name: 'Kayonza', latitude: -1.9485, longitude: 30.0597 },
        { name: 'Kirehe', latitude: -2.0744, longitude: 29.7569 },
        { name: 'Ngoma', latitude: -2.0744, longitude: 29.7569 },
        { name: 'Gatsibo', latitude: -1.9485, longitude: 30.0597 },
        { name: 'Nyagatare', latitude: -1.9485, longitude: 30.0597 },
        { name: 'Bugesera', latitude: -2.0744, longitude: 29.7569 },

        // Southern Province Districts
        { name: 'Huye', latitude: -2.5966, longitude: 29.7394 },
        { name: 'Nyanza', latitude: -2.3518, longitude: 29.7414 },
        { name: 'Gisagara', latitude: -2.4634, longitude: 29.5739 },
        { name: 'Muhanga', latitude: -2.0744, longitude: 29.7569 },
        { name: 'Ruhango', latitude: -2.3518, longitude: 29.7414 },
        { name: 'Karongi', latitude: -2.0603, longitude: 29.3478 },
        { name: 'Rutsiro', latitude: -2.0603, longitude: 29.3478 },
        { name: 'Nyamasheke', latitude: -2.4846, longitude: 28.9075 },

        // Western Province Districts
        { name: 'Rubavu', latitude: -1.7028, longitude: 29.2564 },
        { name: 'Ngororero', latitude: -1.7028, longitude: 29.2564 },
        { name: 'Rusizi', latitude: -2.4846, longitude: 28.9075 },
        { name: 'Nyabihu', latitude: -1.7028, longitude: 29.2564 },

        // Popular Places and Landmarks
        { name: 'Kigali International Airport', latitude: -1.9686, longitude: 30.1395 },
        { name: 'Kigali Convention Centre', latitude: -1.9485, longitude: 30.0597 },
        { name: 'Kigali Genocide Memorial', latitude: -1.9485, longitude: 30.0597 },
        { name: 'Kigali Heights Mall', latitude: -1.9485, longitude: 30.0597 },
        { name: 'Kigali City Tower', latitude: -1.9485, longitude: 30.0597 },
        { name: 'Kigali Business Centre', latitude: -1.9485, longitude: 30.0597 },
        { name: 'Kigali Innovation City', latitude: -1.9485, longitude: 30.0597 },
        { name: 'Kigali Free Zone', latitude: -1.9485, longitude: 30.0597 },
        { name: 'King Faisal Hospital', latitude: -1.9485, longitude: 30.0597 },
        { name: 'Kigali University Teaching Hospital (CHUK)', latitude: -1.9485, longitude: 30.0597 },
        { name: 'Rwanda Military Hospital', latitude: -1.9485, longitude: 30.0597 },
        { name: 'Kibagabaga Hospital', latitude: -1.9365, longitude: 30.1300 },
        { name: 'Kanombe Military Hospital', latitude: -1.9485, longitude: 30.0597 },
        { name: 'University of Rwanda - College of Science and Technology', latitude: -1.9485, longitude: 30.0597 },
        { name: 'University of Rwanda - College of Business and Economics', latitude: -1.9485, longitude: 30.0597 },
        { name: 'University of Rwanda - College of Medicine and Health Sciences', latitude: -1.9485, longitude: 30.0597 },
        { name: 'Kigali Institute of Science and Technology (KIST)', latitude: -1.9485, longitude: 30.0597 },
        { name: 'Kigali Institute of Education (KIE)', latitude: -1.9485, longitude: 30.0597 },
        { name: 'Kigali Institute of Management (KIM)', latitude: -1.9485, longitude: 30.0597 },
        { name: 'Kigali Institute of Health (KIH)', latitude: -1.9485, longitude: 30.0597 },
        { name: 'Parliament of Rwanda', latitude: -1.9485, longitude: 30.0597 },
        { name: 'Bank of Kigali', latitude: -1.9485, longitude: 30.0597 },
        { name: 'Rwanda Development Bank', latitude: -1.9485, longitude: 30.0597 },
        { name: 'Rwanda Social Security Board', latitude: -1.9485, longitude: 30.0597 },
        { name: 'Rwanda Revenue Authority', latitude: -1.9485, longitude: 30.0597 },
        { name: 'Rwanda Stock Exchange', latitude: -1.9485, longitude: 30.0597 },
        { name: 'Rwanda Central Bank', latitude: -1.9485, longitude: 30.0597 },
        { name: 'Kigali Serena Hotel', latitude: -1.9485, longitude: 30.0597 },
        { name: 'Radisson Blu Hotel & Convention Centre', latitude: -1.9485, longitude: 30.0597 },
        { name: 'Marriott Hotel Kigali', latitude: -1.9485, longitude: 30.0597 },
        { name: 'Hilton Garden Inn Kigali', latitude: -1.9485, longitude: 30.0597 },
        { name: 'Hotel des Mille Collines', latitude: -1.9485, longitude: 30.0597 },
        { name: 'Kigali Bus Station', latitude: -1.9485, longitude: 30.0597 },
        { name: 'Kigali Central Bus Station', latitude: -1.9485, longitude: 30.0597 },
        { name: 'Kigali Taxi Park', latitude: -1.9485, longitude: 30.0597 },
        { name: 'Kigali Motorcycle Taxi Park', latitude: -1.9485, longitude: 30.0597 },
    ];

    useEffect(() => {
        if (value && value.name) {
            setSearchQuery(value.name);
            setIsValidLocation(true);
        } else {
            setSearchQuery('');
            setIsValidLocation(false);
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

    // Notify parent of validity changes
    useEffect(() => {
        if (onValidityChange) {
            onValidityChange(isValidLocation);
        }
    }, [isValidLocation, onValidityChange]);

    // Simple search function
    const searchLocations = (query) => {
        if (!query.trim()) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        const searchTerm = query.toLowerCase();
        

        const filtered = commonLocations.filter(location => {
            const nameMatch = location.name.toLowerCase().includes(searchTerm);
            return nameMatch;
        });



        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
    };

    const selectLocation = (location) => {
        setSearchQuery(location.name);
        setShowSuggestions(false);
        setSuggestions([]);
        setIsValidLocation(true);

        const locationData = {
            name: location.name,
            latitude: location.latitude,
            longitude: location.longitude
        };

        onLocationSelect(locationData);
    };

    const handleInputChange = (text) => {
        setSearchQuery(text);
        setIsValidLocation(false); // Mark as invalid when user types

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

    const handleInputFocus = () => {
        // Show initial suggestions
        if (searchQuery.trim()) {
            searchLocations(searchQuery);
        } else {
            // Show popular locations
            const popularLocations = commonLocations.slice(0, 8);
            setSuggestions(popularLocations);
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
                    style={[
                        styles.locationInput,
                        !isValidLocation && searchQuery && styles.invalidInput
                    ]}
                    value={searchQuery}
                    onChangeText={handleInputChange}
                    onFocus={handleInputFocus}
                    placeholder={placeholder}
                    placeholderTextColor="#64748b"
                    editable={true}
                />
                <TouchableOpacity
                    style={styles.searchButton}
                    onPress={handleInputFocus}
                >
                    <FontAwesome5 name="search" size={16} color="#667eea" />
                </TouchableOpacity>
            </View>

            {/* Invalid location warning */}
            {!isValidLocation && searchQuery && (
                <Text style={styles.invalidText}>
                    Please select a location from the suggestions below
                </Text>
            )}

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
                                        <FontAwesome5 name="map-marker-alt" size={16} color="#667eea" />
                                    </View>
                                    <View style={styles.suggestionContent}>
                                        <Text style={styles.suggestionName}>{item.name}</Text>
                                    </View>
                                    <FontAwesome5 name="chevron-right" size={12} color="#94a3b8" />
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
        marginBottom: 20,
        position: 'relative',
        zIndex: 1,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    required: {
        color: '#ef4444',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    locationInput: {
        flex: 1,
        padding: 16,
        fontSize: 16,
        color: '#1f2937',
        backgroundColor: 'transparent',
        borderWidth: 0,
    },
    searchButton: {
        padding: 16,
        borderLeftWidth: 1,
        borderLeftColor: '#e2e8f0',
        backgroundColor: '#f8fafc',
        borderTopRightRadius: 12,
        borderBottomRightRadius: 12,
    },
    suggestionsContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        marginTop: 4,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        maxHeight: 250,
        zIndex: 1000,
    },
    suggestionsList: {
        maxHeight: 250,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
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
        fontSize: 16,
        fontWeight: '500',
        color: '#1f2937',
    },
    noResultsContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        marginTop: 4,
        padding: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    noResultsText: {
        color: '#64748b',
        fontSize: 16,
        fontWeight: '500',
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
    invalidInput: {
        borderColor: '#ef4444',
        borderWidth: 2,
    },
    invalidText: {
        color: '#ef4444',
        fontSize: 14,
        marginTop: 8,
    },
});

export default LocationPicker; 