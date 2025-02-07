import React, { useState } from 'react';
import { View, Text } from 'react-native';
import PostRideForm from '../components/PostRideForm';

export default function PostRideScreen() {
    const [rides, setRides] = useState([]);

    const handlePostRide = (newRide) => {
        setRides([...rides, { ...newRide, id: Math.random().toString() }]);
    };

    return (
        <View>
            <Text>Post a Ride</Text>
            <PostRideForm onSubmit={handlePostRide} />
        </View>
    );
}
