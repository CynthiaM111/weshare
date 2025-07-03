import { Tabs, useRouter, useNavigation } from 'expo-router';
import SplashScreen from '../components/SplashScreen';
import GlobalErrorBoundary from '../components/GlobalErrorBoundary';
import MaintenanceMode from '../components/MaintenanceMode';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as eva from '@eva-design/eva';
import { ApplicationProvider } from '@ui-kitten/components';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ErrorProvider, useError } from './context/ErrorContext';

// Wrap your app with providers and error boundary
export default function RootLayout() {
  return (
    <ApplicationProvider {...eva} theme={eva.light}>
      <ErrorProvider>
        <AuthProvider>
          <ErrorBoundaryWrapper>
            <RootLayoutNav />
          </ErrorBoundaryWrapper>
        </AuthProvider>
      </ErrorProvider>
    </ApplicationProvider>
  );
}

// Wrapper component to access router context for error boundary
function ErrorBoundaryWrapper({ children }) {
  const router = useRouter();

  const handleErrorRetry = () => {
    // Force a complete app refresh
    try {
      router.replace('/(home)');
    } catch (error) {
      console.error('Router refresh failed:', error);
      // Last resort
      if (typeof window !== 'undefined' && window.location) {
        window.location.reload();
      }
    }
  };

  const handleNavigateHome = () => {
    try {
      router.replace('/(home)');
    } catch (error) {
      console.error('Navigation to home failed:', error);
    }
  };

  return (
    <GlobalErrorBoundary
      onRetry={handleErrorRetry}
      onNavigateHome={handleNavigateHome}
    >
      {children}
    </GlobalErrorBoundary>
  );
}

function RootLayoutNav() {
  const [showSplash, setShowSplash] = useState(true);
  const { user, loading } = useAuth();
  const { isMaintenanceMode, clearMaintenanceMode, handleGlobalError } = useError();
  const router = useRouter();
  const navigation = useNavigation();
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const [currentRouteName, setCurrentRouteName] = useState('');

  // Track navigation readiness and current route
  useEffect(() => {
    const unsubscribe = navigation.addListener('state', (e) => {
      setIsNavigationReady(true);

      // Get the current route name
      const state = navigation.getState();
      if (state) {
        const currentRoute = state.routes[state.index];
        if (currentRoute?.state) {
          const nestedRoute = currentRoute.state.routes[currentRoute.state.index];
          setCurrentRouteName(nestedRoute?.name || '');
        } else {
          setCurrentRouteName(currentRoute?.name || '');
        }
      }
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

    // Don't redirect if user needs verification
    if (!user.isVerified) {
      console.log('[ROOT LAYOUT] User needs verification, not redirecting');
      return;
    }

    const homeRoute = user.role === 'agency_employee' ? '/(employee)' : '/(home)';
    // Only navigate if not already on the correct route
    if (router.pathname !== homeRoute) {
      console.log('[ROOT LAYOUT] Redirecting to home route:', homeRoute);
      router.replace(homeRoute);
    }
  }, [user, loading, isNavigationReady, router]);

  // Handle maintenance mode check
  const handleMaintenanceRetry = async () => {
    try {
      // Try to make a health check request
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/health`, {
        method: 'GET',
        timeout: 10000
      });

      if (response.ok) {
        // Service is back up, clear maintenance mode
        clearMaintenanceMode();

        // Navigate to appropriate screen based on user state
        if (user) {
          const homeRoute = user.role === 'agency_employee' ? '/(employee)' : '/(home)';
          router.replace(homeRoute);
        } else {
          router.replace('/(auth)/login');
        }
      } else {
        throw new Error('Service still unavailable');
      }
    } catch (error) {
      // Handle the error but don't clear maintenance mode
      handleGlobalError(error, { context: 'maintenance_check' });
      console.log('Service still in maintenance mode');
    }
  };

  const handleMaintenanceCheckStatus = async () => {
    // Alternative maintenance check method
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/status`, {
        method: 'GET',
        timeout: 5000
      });

      const data = await response.json();

      if (data.maintenance === false) {
        clearMaintenanceMode();
        // Navigate based on current user state
        if (user) {
          const homeRoute = user.role === 'agency_employee' ? '/(employee)' : '/(home)';
          router.replace(homeRoute);
        } else {
          router.replace('/(home)');
        }
      }
    } catch (error) {
      throw new Error('Unable to check service status');
    }
  };

  // Show maintenance mode if active
  if (isMaintenanceMode && !showSplash && !loading) {
    return (
      <MaintenanceMode
        onRetry={handleMaintenanceRetry}
        onCheckStatus={handleMaintenanceCheckStatus}
      />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Tabs
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
          }}
        />
        <Tabs.Screen
          name="(rides)"
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="bus-outline" size={size} color={color} />
            ),
            tabBarLabel: 'Rides',
            tabBarItemStyle: user?.role === 'agency_employee' ? { display: 'none' } : { display: 'flex' },
            tabBarButton: ({ children, onPress, ...props }) => {
              return (
                <TouchableOpacity
                  {...props}
                  onPress={(e) => {
                    // Check if we're currently on booked screen
                    const isOnBookedScreen = currentRouteName === 'booked';

                    // Only allow navigation if we're NOT on the booked screen
                    if (!isOnBookedScreen) {
                      onPress?.(e);
                    }
                    // If we're on booked screen, do nothing (prevent navigation)
                  }}
                >
                  {children}
                </TouchableOpacity>
              );
            },
          }}
        />
        <Tabs.Screen
          name="(private)"
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="car-outline" size={size} color={color} />
            ),
            tabBarLabel: 'Private',
            tabBarItemStyle: user?.role === 'agency_employee' ? { display: 'none' } : { display: 'flex' },
          }}
        />
        <Tabs.Screen
          name="(history)"
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="time-outline" size={size} color={color} />
            ),
            tabBarLabel: 'History',
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
          name="(employee)"
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
            tabBarLabel: 'Employee',
            tabBarItemStyle: user?.role === 'agency_employee' ? { display: 'flex' } : { display: 'none' },
          }}
        />

        {/* Hidden screens for navigation but not shown in tab bar */}
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
          name="(auth)/verify"
          options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }}
        />
        <Tabs.Screen
          name="(messages)/index"
          options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }}
        />
        <Tabs.Screen
          name="(auth)/index"
          options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }}
        />
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