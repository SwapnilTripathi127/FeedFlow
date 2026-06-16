import { Tabs as ExpoTabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { StyleSheet, View } from 'react-native';
import { Home, Settings, Activity } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <ExpoTabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarBackground: () => (
          <BlurView 
            tint="dark" 
            intensity={80} 
            style={StyleSheet.absoluteFill} 
            className="border-t border-white/10"
          />
        ),
        tabBarActiveTintColor: '#FA233B',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarLabelStyle: {
          fontFamily: 'Inter_500Medium',
          fontSize: 10,
          marginTop: 4,
        }
      }}
    >
      <ExpoTabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Home color={color} size={26} />
          ),
        }}
      />
      <ExpoTabs.Screen
        name="analytics"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, size }) => (
            <Activity color={color} size={26} />
          ),
        }}
      />
      <ExpoTabs.Screen
        name="preferences"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Settings color={color} size={26} />
          ),
        }}
      />
    </ExpoTabs>
  );
}
