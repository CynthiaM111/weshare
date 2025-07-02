// app/(employee)/_layout.js
import { Stack } from 'expo-router';

export default function EmployeeLayout() {
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
            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    headerShown: false,
                    // tabBarItemStyle: { display: 'none' },
                }}
            />
        </Stack>
    );
}