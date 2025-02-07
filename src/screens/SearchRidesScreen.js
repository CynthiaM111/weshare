import React, { useState } from 'react';
import { View, FlatList, Text } from 'react-native';
import SearchBar from '../components/SearchBar';
import RideCard from '../components/RideCard';

const sampleRides = [
    { id: '1', from: 'City A', to: 'City B', price: '$20', departureTime: '10:00 AM', driver: 'John Doe', seats: 3 },
    { id: '2', from: 'City B', to: 'City C', price: '$15', departureTime: '2:00 PM', driver: 'Jane Doe', seats: 2 },
];

export default function SearchRidesScreen() {
    const [filteredRides, setFilteredRides] = useState(sampleRides);

    const handleSearch = (from, to) => {
        const results = sampleRides.filter(ride =>
            ride.from.toLowerCase().includes(from.toLowerCase()) &&
            ride.to.toLowerCase().includes(to.toLowerCase())
        );
        setFilteredRides(results);
    };

    return (
        <View>
            <SearchBar onSearch={handleSearch} />
            <FlatList
                data={filteredRides}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <RideCard ride={item} />}
            />
        </View>
    );
}
