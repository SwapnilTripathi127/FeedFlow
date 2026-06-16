import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useAuthStore } from '../src/store/authStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import '../src/theme/global.css';

const queryClient = new QueryClient();

export default function RootLayout() {
  const { isInitialized, session, initialize } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (!isInitialized || !fontsLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const inOnboarding = segments[0] === 'onboarding';
    const inModals = segments[0] === '(modals)';
    
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && !inTabsGroup && !inOnboarding && !inModals) {
      router.replace('/(tabs)/dashboard');
    }
  }, [session, isInitialized, fontsLoaded, segments]);

  if (!isInitialized || !fontsLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-foreground font-semibold text-lg" style={{ fontFamily: fontsLoaded ? 'Inter_600SemiBold' : undefined }}>FeedFlow</Text>
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Slot />
    </QueryClientProvider>
  );
}
