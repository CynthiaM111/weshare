import React from 'react';
import { View, FlatList } from 'react-native';
import GlobalStyles from '../styles/GlobalStyles';
import RideCard from '../components/RideCard';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';

export default function HomeScreen({ navigation }) {
    const rides = [
        { id: '1', from: 'New York', to: 'Boston', price: '$30', departureTime: '10:00 AM' },
        { id: '2', from: 'San Francisco', to: 'Los Angeles', price: '$50', departureTime: '11:00 AM' },
    ];

    return (
        <View style={GlobalStyles.container}>
            <Header onPostRide={() => navigation.navigate('PostRideScreen')} />
            <SearchBar />
            <FlatList
                data={rides}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <RideCard ride={item} />}
                style={{ marginBottom: 60 }} // Space for bottom nav
            />
        </View>
    );
}
