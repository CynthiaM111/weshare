// app/(rides)/_layout.js
import { Stack } from "expo-router";

export default function RidesLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: '#4CAF50',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    title: 'Available Rides',
                    headerBackTitle: 'Back'
                }}
            />
            <Stack.Screen
                name="[id]"
                options={{
                    title: 'Ride Details',
                    headerBackTitle: 'Back'
                }}
            />
        </Stack>
    );
}