import { Stack } from "expo-router";

export default function InboxLayout() {
    return (
        <Stack>
            <Stack.Screen name="index" options={{ headerShown: true, title: "Activity" }} />
        </Stack>
    );
}