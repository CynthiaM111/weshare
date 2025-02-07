import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import PostRideStyles from '../styles/PostRideStyles';

export default function PostRideForm({ onSubmit }) {
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [price, setPrice] = useState('');
    const [departureTime, setDepartureTime] = useState('');
    const [seats, setSeats] = useState('');

    return (
        <View style={PostRideStyles.container}>
            <TextInput style={PostRideStyles.input} placeholder="From" value={from} onChangeText={setFrom} />
            <TextInput style={PostRideStyles.input} placeholder="To" value={to} onChangeText={setTo} />
            <TextInput style={PostRideStyles.input} placeholder="Price" value={price} onChangeText={setPrice} keyboardType="numeric" />
            <TextInput style={PostRideStyles.input} placeholder="Departure Time" value={departureTime} onChangeText={setDepartureTime} />
            <TextInput style={PostRideStyles.input} placeholder="Seats Available" value={seats} onChangeText={setSeats} keyboardType="numeric" />

            <TouchableOpacity onPress={() => onSubmit({ from, to, price, departureTime, seats })} style={PostRideStyles.button}>
                <Text style={PostRideStyles.buttonText}>Post Ride</Text>
            </TouchableOpacity>
        </View>
    );
}
