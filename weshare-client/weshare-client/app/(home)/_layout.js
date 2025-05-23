// app/(home)/_layout.js
import { Stack, Redirect } from "expo-router";
import { useAuth } from "@/app/context/AuthContext";

export default function HomeLayout() {

    return (
        <Stack>
            <Stack.Screen
                name="index"
                options={{
                    title: 'Home',
                    headerShown: false
                }}
            />
            <Stack.Screen
                name="employee/index"
                options={{
                    title: 'Ride Check-in',
                    headerStyle: {
                        backgroundColor: 'royalblue',
                    },
                    headerTintColor: '#fff',
                    headerTitleStyle: {
                        fontWeight: 'bold',
                    },
                    headerBackVisible: false
                }}
            />
        </Stack>
    );
}