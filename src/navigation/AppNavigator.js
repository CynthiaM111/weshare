import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import HomeScreen from '../screens/HomeScreen';
import RideDetailsScreen from '../screens/RideDetailsScreen';
import SearchRidesScreen from '../screens/SearchRidesScreen';
import PostRideScreen from '../screens/PostRideScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator>
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="RideDetailsScreen" component={RideDetailsScreen} />
                <Stack.Screen name="SearchRidesScreen" component={SearchRidesScreen} />
                <Stack.Screen name="PostRideScreen" component={PostRideScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
