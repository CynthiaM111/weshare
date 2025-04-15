// app/_layout.js
import { Stack, Tabs } from "expo-router";
import SplashScreen from "../components/SplashScreen";
import { useEffect, useState } from "react";
import { View } from "react-native";
import Ionicons from '@expo/vector-icons/Ionicons';

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {/* Main Navigation Structure */}
      <Tabs screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          paddingBottom: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 5,
        },
      }}>
        <Tabs.Screen
          name="(home)"
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
            tabBarLabel: 'Home',
          }}
        />
        <Tabs.Screen
          name="(rides)"
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="car-outline" size={size} color={color} />
            ),
            tabBarLabel: 'Rides',
          }}
        />
        <Tabs.Screen
          name="(inbox)"
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="chatbox-outline" size={size} color={color} />
            ),
            tabBarLabel: 'Inbox',
          }}
        />
        <Tabs.Screen
          name="(profile)"
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
            tabBarLabel: 'Profile',
          }}
        />
      </Tabs>

      {/* Splash Screen Overlay */}
      {showSplash && (
        <View style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
        }}>
          <SplashScreen />
        </View>
      )}
    </View>
  );
}