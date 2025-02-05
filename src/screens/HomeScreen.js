import React from 'react';
import { View, Text, TextInput, FlatList } from 'react-native';
import HomeStyles from '../styles/HomeStyles';
import GlobalStyles from '../styles/GlobalStyles';
import RideCard from '../components/RideCard';

export default function HomeScreen() {
    const rides = [
        { id: '1', from: 'New York', to: 'Boston', price: '$30', departureTime: '10:00 AM' },
        { id: '2', from: 'San Francisco', to: 'Los Angeles', price: '$50', departureTime: '11:00 AM' },
    ];

    return (
        <View style={GlobalStyles.container}>
            <Text style={HomeStyles.header}>Find a Ride</Text>
            <TextInput
                placeholder="Enter your location..."
                style={HomeStyles.searchBar}
            />
            <FlatList
                data={rides}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <RideCard ride={item} />}
                style={HomeStyles.rideList}
            />
        </View>
    );
}
