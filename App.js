import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import BottomTabNav from './src/navigation/BottomTabNav';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';


SplashScreen.preventAutoHideAsync();
export default function App() {

  const [fontsLoaded] = useFonts({
    'KGRedHands': require('./assets/fonts/KGRedHands.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <NavigationContainer>
      <BottomTabNav />
    </NavigationContainer>
  );
}
