import { Stack } from "expo-router";

export default function ProfileLayout() {
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
            <Stack.Screen 
                name="index" 
                options={{ 
                    title: "Profile",
                    headerShown: false,
                }} 
            />
        </Stack>
    );
}