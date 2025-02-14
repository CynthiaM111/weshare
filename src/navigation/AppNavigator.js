import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import HomeScreen from '../screens/HomeScreen';
import RideDetailsScreen from '../screens/RideDetailsScreen';
import SearchRidesScreen from '../screens/SearchRidesScreen';
import PostRideScreen from '../screens/PostRideScreen';
import BottomTabNav from './BottomTabNav';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import AccountScreen from '../screens/AccountScreen';
const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name = "Main" component = {BottomTabNav} />
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="RideDetailsScreen" component={RideDetailsScreen} />
                <Stack.Screen name="SearchRidesScreen" component={SearchRidesScreen} />
                <Stack.Screen name="PostRideScreen" component={PostRideScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Signup" component={SignupScreen} />
                <Stack.Screen name="Account" component={AccountScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
