import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import * as Font from 'expo-font';
import { ActivityIndicator, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { initializeCollections } from './src/api/pocketbaseSetup';

// Create a caching method for the fonts
const cacheFonts = (fonts: any[]) => {
  return fonts.map(font => Font.loadAsync(font));
};

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // Initialize app resources
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load fonts
        const fontAssets = cacheFonts([
          // Use the Ionicons font as a plain object since we don't need type checking here
          { 'Ionicons': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf') }
        ]);
        
        await Promise.all([...fontAssets]);
        
        // Check/initialize required collections
        await initializeCollections();
        
        setFontsLoaded(true);
      } catch (e) {
        console.warn('Error during app initialization', e);
        // If initialization fails, proceed anyway so the app doesn't get stuck
        setFontsLoaded(true);
      }
    };

    initializeApp();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <AppNavigator />
          <StatusBar style="auto" />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
