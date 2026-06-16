import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap } from 'lucide-react-native';
import { useUpdatePreferences } from '../../src/hooks/usePreferences';

const POSITIVE_INTERESTS = [
  'AI', 'Technology', 'Startups', 'Programming', 
  'Cybersecurity', 'Finance', 'Education', 
  'Travel', 'Gaming', 'Health', 'Fitness', 'Design', 'Photography', 'Art'
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const updatePreferences = useUpdatePreferences();

  const toggleInterest = (interest: string) => {
    if (selected.includes(interest)) {
      setSelected(selected.filter(i => i !== interest));
    } else {
      setSelected([...selected, interest]);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="px-lg pt-12 pb-24">
        <View className="mb-10 items-center">
          <View className="w-16 h-16 rounded-[24px] bg-white/10 items-center justify-center mb-6">
            <Zap color="#FA233B" size={32} />
          </View>
          <Text className="text-white text-4xl font-bold tracking-tight text-center mb-4" style={{ fontFamily: 'Inter_700Bold' }}>Tell us what you love</Text>
          <Text className="text-muted text-lg text-center" style={{ fontFamily: 'Inter_400Regular' }}>
            Tap the topics you want to see more of in your feed. We'll train the algorithm to find them.
          </Text>
        </View>

        <View className="flex-row flex-wrap justify-center gap-3 mb-12">
          {POSITIVE_INTERESTS.map((interest) => {
            const isSelected = selected.includes(interest);
            return (
              <TouchableOpacity
                key={interest}
                onPress={() => toggleInterest(interest)}
              >
                <View 
                  className={`px-6 py-4 rounded-full border ${
                    isSelected 
                      ? 'bg-[#FA233B]/20 border-[#FA233B]' 
                      : 'bg-surfaceElevated border-white/5'
                  }`}
                >
                  <Text className={`text-lg font-semibold ${isSelected ? 'text-[#FA233B]' : 'text-white'}`} style={{ fontFamily: 'Inter_600SemiBold' }}>
                    {interest}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {updatePreferences.error && (
          <View className="bg-[#FA233B]/10 p-4 rounded-2xl mb-6 border border-[#FA233B]/20">
            <Text className="text-[#FF2D55] text-center font-medium" style={{ fontFamily: 'Inter_500Medium' }}>
              {updatePreferences.error.message}
            </Text>
          </View>
        )}

      </ScrollView>

      {/* Floating Bottom Bar */}
      <View className="absolute bottom-10 left-lg right-lg">
        <TouchableOpacity 
          disabled={selected.length === 0 || updatePreferences.isPending}
          onPress={() => {
            updatePreferences.mutate(
              { positiveInterests: selected },
              { onSuccess: () => router.replace('/(tabs)/dashboard') }
            );
          }}
        >
          <LinearGradient
            colors={selected.length > 0 ? ['#FF2D55', '#FA233B'] : ['#2C2C2E', '#1C1C1E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="h-16 rounded-full items-center flex-row justify-center shadow-lg"
          >
            <Text className={`font-bold text-lg tracking-wide ${
              selected.length > 0 ? 'text-white' : 'text-muted'
            }`} style={{ fontFamily: 'Inter_700Bold' }}>
              {updatePreferences.isPending ? 'Saving...' : 'Start Curating'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
