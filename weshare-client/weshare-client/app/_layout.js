import { Tabs, useRouter, useNavigation } from 'expo-router';
import SplashScreen from '../components/SplashScreen';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, TouchableOpacity } from 'react-native';
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
  const navigation = useNavigation();
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  // Track navigation readiness
  useEffect(() => {
    const unsubscribe = navigation.addListener('state', () => {
      setIsNavigationReady(true);
    });
    return unsubscribe;
  }, [navigation]);

  // Handle splash screen timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Handle initial navigation based on role
  useEffect(() => {
    if (loading || !isNavigationReady || !user) return;

    const homeRoute = user.role === 'agency_employee' ? '/(employee)' : '/(home)';
    // Only navigate if not already on the correct route
    if (router.pathname !== homeRoute) {
      console.log('Navigating to:', homeRoute);
      router.replace(homeRoute);
    }
  }, [user, loading, isNavigationReady, router]);

  return (
    <View style={{ flex: 1 }}>
      <Tabs key={user?.role}
        screenOptions={{
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
        }}
      >
        
        <Tabs.Screen
          name="(home)"
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
            tabBarLabel: 'Home',
            tabBarItemStyle: user?.role === 'agency_employee' ? { display: 'none' } : { display: 'flex' },
            tabBarButton: (props) => (
              <TouchableOpacity
                {...props}
                onPress={() => {
                  const route = user?.role === 'agency_employee' ? '/(employee)' : '/(home)';
                  console.log('Home tab pressed, navigating to:', route);
                  router.push(route);
                }}
              />
            ),
          }}
        />
        
        
        <Tabs.Screen
          name="(rides)"
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="car-outline" size={size} color={color} />
            ),
            tabBarLabel: 'Rides',
            tabBarItemStyle: user?.role === 'agency_employee' ? { display: 'none' } : { display: 'flex' },
          }}
        />
        
        
          <Tabs.Screen
            name="(employee)"
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="person-outline" size={size} color={color} />
              ),
              tabBarLabel: 'Employee',
              tabBarItemStyle: user?.role === 'agency_employee' ? { display: 'flex' } : { display: 'none' },
            }}
            listeners={{
              tabPress: (e) => {
                e.preventDefault();
                router.push('/(employee)');
              },
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
        <Tabs.Screen
          name="index"
          options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }}
        />
        <Tabs.Screen
          name="(auth)/login"
          options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }}
        />
        <Tabs.Screen
          name="(auth)/signup"
          options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }}
        />
        <Tabs.Screen
          name="(auth)/index"
          options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }}
        />

        {/* <Tabs.Screen
          name="(employee)"
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
            tabBarLabel: 'Employee',
            ...(user?.role !== 'agency_employee' && {
              tabBarItemStyle: { display: 'none' }
            }),
            tabBarButton: () => null,
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              router.push('/(employee)');
            }
          }}
        /> */}
        
        
        
      </Tabs>

      {/* Overlay for loading or splash screen */}
      {(showSplash || loading) && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#fff',
          }}
        >
          {showSplash ? (
            <SplashScreen />
          ) : (
            <ActivityIndicator size="large" color="#cf1259" />
          )}
        </View>
      )}
    </View>
  );
}