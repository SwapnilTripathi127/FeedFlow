
import { View, Text } from 'react-native';

// For demonstrable web layout we will just use a basic flex view if Tabs are complex to set up instantly without exact deps.
// Actually expo-router Tabs work great.
import { Tabs as ExpoTabs } from 'expo-router';

export default function TabLayout() {
  return (
    <ExpoTabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#09090B',
          borderTopColor: '#27272A',
        },
        tabBarActiveTintColor: '#7C3AED',
        tabBarInactiveTintColor: '#A1A1AA',
      }}
    >
      <ExpoTabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
        }}
      />
      <ExpoTabs.Screen
        name="preferences"
        options={{
          title: 'Preferences',
        }}
      />
    </ExpoTabs>
  );
}
