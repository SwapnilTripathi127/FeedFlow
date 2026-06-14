import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useAuthStore } from '../src/store/authStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../src/theme/global.css'; // NativeWind CSS entry

const queryClient = new QueryClient();

export default function RootLayout() {
  const { isInitialized, session, initialize } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const inOnboarding = segments[0] === 'onboarding';
    
    // Simple basic routing logic for demo
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && !inTabsGroup && !inOnboarding) {
      router.replace('/(tabs)/dashboard');
    }
  }, [session, isInitialized, segments]);

  if (!isInitialized) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-iris font-semibold text-lg">FeedFlow Loading...</Text>
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Slot />
    </QueryClientProvider>
  );
}
