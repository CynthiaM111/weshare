import React, { useState } from 'react';
import { View, FlatList, Text, TextInput, Button, Alert } from 'react-native';
import axios from 'axios';


export default function SearchRidesScreen() {
    // const [from, setFrom] = useState('');
    // const [to, setTo] = useState('');
    // const [date, setDate] = useState('');
    // const [rides, setRides] = useState([]);

    const baseUrl = 'http://10.48.96.152:4000';

    const searchRides = async () => {
        try {
            const response = await axios.get(`${baseUrl}/search?from=${from}&to=${to}&departureDate=${date}`);
            if (response.data.length > 0) {
                setRides(response.data);
            } else {
                Alert.alert("No rides found!");
            }
        } catch (error) {
            Alert.alert("No rides found!");
        }
    };

    return (
        <View>
            <TextInput placeholder="From" value={from} onChangeText={setFrom} />
            <TextInput placeholder="To" value={to} onChangeText={setTo} />
            <TextInput placeholder="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} />
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
