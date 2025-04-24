// app/(rides)/_layout.js
import { Stack } from 'expo-router';

export default function RidesLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: 'royalblue',
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
                    title: 'Available Rides',
                }}
            />
            <Stack.Screen
                name="[id]"
                options={{
                    title: 'Ride Details',
                }}
            />
        </Stack>
    );
}