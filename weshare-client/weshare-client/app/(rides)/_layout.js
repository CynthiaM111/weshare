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
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="[id]"
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="booked"
                options={{
                    headerShown: false,
                    title: 'Booked Rides',
                    headerBackVisible: false,
                    gestureEnabled: false,
                }}
            />
            <Stack.Screen
                name="add-private-ride"
                options={{
                    headerShown: false,

                }}
            />
            <Stack.Screen
                name="private"
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