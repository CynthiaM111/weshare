import { Stack, useRouter } from "expo-router";
import SplashScreen from "../components/SplashScreen";
import { useEffect, useState } from "react";
import { View } from "react-native";
export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setTimeout(() => {
      setShowSplash(false);
      router.replace("/");
    }, 2500);
    // return () => clearTimeout(timeout);
  }, [router]);



  return  (
    <View style={{ flex: 1 }}>
      {/* Always render the Stack navigator */}
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>

      {/* Overlay SplashScreen when showSplash is true */}
      {showSplash && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000, // Ensure it’s on top
          }}
        >
          <SplashScreen />
        </View>
      )}
    </View>
  );
}
