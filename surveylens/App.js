import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import mobileAds from 'react-native-google-mobile-ads';
import { getActiveProject } from './src/utils/storageUtils';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Setup');

  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    // Initialize AdMob
    try {
      await mobileAds().initialize();
    } catch (e) {
      console.log('AdMob init error:', e);
    }

    // Check if user has an active project
    const project = await getActiveProject();
    if (project) {
      setInitialRoute('Camera');
    } else {
      setInitialRoute('Setup');
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppNavigator initialRoute={initialRoute} />
    </GestureHandlerRootView>
  );
}
