import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import HomeStyles from '../styles/HomeStyles';

export default function Header({ onPostRide }) {
    return (
        <View style={HomeStyles.headerContainer}>
            <Text style={HomeStyles.header}>Find a Ride</Text>
            <TouchableOpacity style={HomeStyles.postRideButton} onPress={onPostRide}>
                <Text style={HomeStyles.postRideButtonText}>Post a Ride</Text>
            </TouchableOpacity>
        </View>
    );
}
