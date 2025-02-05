import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import RideCardStyles from '../styles/RideCardStyles';
import RideDetailsStyles from '../styles/RideDetailsStyles';

export default function RideCard({ ride }) {
    const [expanded, setExpanded] = useState(false);
    const animation = useRef(new Animated.Value(0)).current; // Create animation reference

    const toggleExpand = () => {
        setExpanded(!expanded);
        Animated.timing(animation, {
            toValue: expanded ? 0 : 1,
            duration: 300,
            useNativeDriver: false,
        }).start();
    };

    const heightInterpolation = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 100], // Adjust height as needed
    });

    return (
        <View style={RideCardStyles.card}>
            {/* Main ride card (only price is shown) */}
            <TouchableOpacity onPress={toggleExpand} style={RideCardStyles.mainInfo}>
                <Text style={RideCardStyles.text}>{ride.from} → {ride.to}</Text>
                <Text style={RideCardStyles.price}>{ride.price}</Text>
                <Text style={RideCardStyles.icon}>{expanded ? "▲" : "▼"}</Text>
            </TouchableOpacity>

            {/* Expandable Details - Animating downward expansion */}
            <Animated.View style={[RideDetailsStyles.container, { height: heightInterpolation, overflow: 'hidden' }]}>
                <View style={RideDetailsStyles.detailsWrapper}>
                    <Text style={RideDetailsStyles.detail}>Departure: {ride.departureTime}</Text>
                    <Text style={RideDetailsStyles.detail}>Driver: {ride.driver}</Text>
                    <Text style={RideDetailsStyles.detail}>Seats Available: {ride.seats}</Text>
                </View>
            </Animated.View>
        </View>
    );
}
