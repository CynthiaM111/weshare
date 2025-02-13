import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import axios from 'axios';

export default function PostRideScreen() {
    // const [ride, setRide] = useState({ driverName: '', licensePlate: '', from: '', to: '', departureTime: '', departureDate: '', availableSeats: '', price: '' });


    const TEMP_USER_ID = "60b6a3f8c6a7463ad6f7a29d";
    const baseUrl = 'http://10.48.96.152:4000'; // Hardcoded for now

    const rideData = {
        userId: TEMP_USER_ID,
        from: "New York",
        to: "Boston",
        availableSeats: 3,
        departureTime: "10:00 AM",
        departureDate: "2024-02-04",
        licensePlate: "XYZ 123",
    };

    try {
        const response =  axios.post(`${baseUrl}/rides/post`, rideData);
        Alert.alert("Ride posted successfully!");
    } catch (error) {
        console.error("Error posting ride:", error);
        Alert.alert("Failed to post ride.");
    }

    

    return (
        <View>
            <TextInput placeholder="Driver Name" onChangeText={(text) => setRide({ ...ride, driverName: text })} />
            <TextInput placeholder="License Plate" onChangeText={(text) => setRide({ ...ride, licensePlate: text })} />
            <TextInput placeholder="From" onChangeText={(text) => setRide({ ...ride, from: text })} />
            <TextInput placeholder="To" onChangeText={(text) => setRide({ ...ride, to: text })} />
            <TextInput placeholder="Departure Time" onChangeText={(text) => setRide({ ...ride, departureTime: text })} />
            <TextInput placeholder="Departure Date" onChangeText={(text) => setRide({ ...ride, departureDate: text })} />
            <TextInput placeholder="Seats" keyboardType="numeric" onChangeText={(text) => setRide({ ...ride, availableSeats: Number(text) })} />
            <TextInput placeholder="Price" onChangeText={(text) => setRide({ ...ride, price: text })} />
            <Button title="Post Ride" onPress={postRide} />
        </View>
    );

}