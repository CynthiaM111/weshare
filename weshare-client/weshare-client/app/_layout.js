import { Stack, Tabs, useRouter } from "expo-router";
import SplashScreen from "../components/SplashScreen";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import Ionicons from '@expo/vector-icons/Ionicons';
import * as eva from '@eva-design/eva';
import { ApplicationProvider } from '@ui-kitten/components';
import { AuthProvider, useAuth } from './context/AuthContext';

// Wrap your app with AuthProvider
export default function RootLayout() {
  return (
    <ApplicationProvider {...eva} theme={eva.light}>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ApplicationProvider>
  );
}

function RootLayoutNav() {
  const [showSplash, setShowSplash] = useState(true);
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Show loading indicator while checking auth state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Show main app layout for all users
  return (
    <View style={{ flex: 1 }}>
      <Tabs screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#cf1259',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          paddingBottom: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 10,
        },
      }}>
        {/* Visible tabs first */}
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

        {/* Hidden screens at the end */}
        <Tabs.Screen
          name="index"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="(auth)/login"
          options={{ tabBarButton: () => null, tabBarItemStyle: {display: 'none'} }}
        />
        <Tabs.Screen
          name="(auth)/signup"
          options={{ tabBarButton: () => null, tabBarItemStyle: {display: 'none'} }}
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