import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import mobileAds from 'react-native-google-mobile-ads';
import { getActiveProject } from './src/utils/storageUtils';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Setup');

  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    // Initialize AdMob — catch errors so app still works if AdMob fails
    try {
      await mobileAds().initialize();
    } catch (e) {
      console.warn('AdMob init failed (non-fatal):', e);
    }

    // Check if user has an existing project
    try {
      const project = await getActiveProject();
      if (project) setInitialRoute('Camera');
    } catch (e) {
      console.warn('Could not load active project:', e);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppNavigator initialRoute={initialRoute} />
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
