import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FontAwesome5 } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import ServicesScreen from '../screens/ServicesScreen';
import ActivityScreen from '../screens/ActivityScreen';
import AccountStackNavigator from './AccountStackNavigator';

const Tab = createBottomTabNavigator();

export default function BottomTabNav() {
    return (
        <Tab.Navigator
            screenOptions={{
                tabBarStyle: { backgroundColor: '#fff', height: 60, marginBottom: 15 },
                tabBarLabelStyle: { fontSize: 12, marginBottom: 2 },
                tabBarIconStyle: { marginTop: 5 },
                tabBarActiveTintColor: '#007AFF',
                tabBarInactiveTintColor: '#777',
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <FontAwesome5 name="home" size={size} color={color} />,
                    headerShown: false,
                }}
            />
            <Tab.Screen
                name="Services"
                component={ServicesScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <FontAwesome5 name="concierge-bell" size={size} color={color} />
                }}
            />
            <Tab.Screen
                name="Activity"
                component={ActivityScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <FontAwesome5 name="list-alt" size={size} color={color} />
                }}
            />
            <Tab.Screen
                name="Account"
                component={AccountStackNavigator}
                options={{
                    tabBarIcon: ({ color, size }) => <FontAwesome5 name="user" size={size} color={color} />
                }}
            />
        </Tab.Navigator>
    );
}
