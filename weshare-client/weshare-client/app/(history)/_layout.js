import { Stack } from "expo-router";

export default function InboxLayout() {
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
            }}>
            <Stack.Screen name="index" options={{ headerShown: false, title: "Activity",headerBackVisible: true }} />
        </Stack>
    );
}