import { Stack } from 'expo-router';

export default function PrivateLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: '#667eea',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
                headerBackTitle: 'Back',
            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    title: 'Private Rides',
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="add-private-ride"
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="private-history"
                options={{
                    headerShown: false,
                }}
            />
        </Stack>
    );
} 