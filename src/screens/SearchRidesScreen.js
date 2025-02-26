import React, { useState, useEffect } from 'react';
import { View, FlatList, Text, TextInput, Button, Alert } from 'react-native';
import axios from 'axios';
import { useRoute } from '@react-navigation/native';

export default function SearchRidesScreen() {
    const route = useRoute();
    
    const [from, setFrom] = useState(route.params.from || '');
    const [to, setTo] = useState(route.params.to || '');
    const [departureDate, setDepartureDate] = useState(route.params.departureDate || '');
    const [rides, setRides] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const baseUrl = 'http://10.48.29.77:4000';

    const searchRides = async () => {
        try {
            const response = await axios.get(`${baseUrl}/search?from=${from}&to=${to}&departureDate=${departureDate}`);
            if (response.data.length > 0) {
                setRides(response.data);
            } else {
                Alert.alert("No rides found!");
            }
        } catch (error) {
            Alert.alert("No rides found!");
        }
        useEffect(() => {
            if (from && to && departureDate) {
                searchRides();
            }
        }, [from, to, departureDate]);
    };

    // Function to fetch suggestions when the user is typing in 'from' or 'to'
    const fetchSuggestions = async (field, value) => {
        try {
            if (value) {
                const response = await axios.get(`${baseUrl}/search?${field}=${value}`);
                setSuggestions(response.data);
            } else {
                setSuggestions([]);
            }
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        if (from) {
            fetchSuggestions('from', from);
        }
    }, [from]);

    useEffect(() => {
        if (to) {
            fetchSuggestions('to', to);
        }
    }, [to]);

    return (
        <View>
            <TextInput
                placeholder="From"
                value={from}
                onChangeText={setFrom}
            />
            {suggestions.length > 0 && (
                <FlatList
                    data={suggestions}
                    renderItem={({ item }) => (
                        <Text>{item.from}</Text> // Display "from" suggestions
                    )}
                    keyExtractor={(item) => item._id}
                />
            )}
            <TextInput
                placeholder="To"
                value={to}
                onChangeText={setTo}
            />
            <TextInput
                placeholder="Departure Date (YYYY-MM-DD)"
                value={departureDate}
                onChangeText={setDepartureDate}
            />
            <Button title="Search" onPress={searchRides} />

            <FlatList
                data={rides}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                    <View>
                        <Text>{item.from} → {item.to}</Text>
                        <Text>Departure: {item.departureTime} | Seats: {item.availableSeats}</Text>
                    </View>
                )}
            />
        </View>
    );
}
