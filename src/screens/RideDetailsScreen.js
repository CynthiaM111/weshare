import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import RideDetailsStyles from '../styles/RideDetailsStyles';

export default function RideDetailsScreen({ route, navigation }) {
    const { ride } = route.params;

    return (
        <View style={RideDetailsStyles.container}>
            <Text style={RideDetailsStyles.title}>{ride.from} → {ride.to}</Text>
            <Text style={RideDetailsStyles.detail}>Price: {ride.price}</Text>
            <Text style={RideDetailsStyles.detail}>Departure: {ride.departureTime}</Text>
            <Text style={RideDetailsStyles.detail}>Driver: {ride.driver}</Text>

            <TouchableOpacity
                style={RideDetailsStyles.button}
                onPress={() => navigation.goBack()}
            >
                <Text style={RideDetailsStyles.buttonText}>Go Back</Text>
            </TouchableOpacity>
        </View>
    );
}
