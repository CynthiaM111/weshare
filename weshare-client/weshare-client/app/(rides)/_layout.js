// app/(rides)/_layout.js
import { Stack } from 'expo-router';
import { Button } from '@ui-kitten/components';
import { useRouter } from 'expo-router';

export default function RidesLayout() {
    const router = useRouter();

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
            <Stack.Screen
                name="booked"
                options={{
                    title: 'Booked Rides',
                    headerBackVisible: false,
                    gestureEnabled: false,
                }}
            />
        </Stack>
    );
}