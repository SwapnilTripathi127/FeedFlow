import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useUpdatePreferences } from '../../src/hooks/usePreferences';

const POSITIVE_INTERESTS = [
  'AI', 'Technology', 'Startups', 'Programming', 
  'Cybersecurity', 'Finance', 'Education', 
  'Travel', 'Gaming', 'Health', 'Fitness'
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
    <View className="flex-1 bg-background">
      <ScrollView contentContainerClassName="p-lg pt-xxl">
        <Text className="text-H1 font-bold text-foreground mb-sm">What do you want to see?</Text>
        <Text className="text-muted text-Body mb-xl">
          FeedFlow will train your Instagram algorithm to show you more of these topics.
        </Text>

        <View className="flex-row flex-wrap gap-md mb-xxl">
          {POSITIVE_INTERESTS.map((interest) => {
            const isSelected = selected.includes(interest);
            return (
              <TouchableOpacity
                key={interest}
                onPress={() => toggleInterest(interest)}
                className={`px-lg py-sm rounded-full border ${
                  isSelected 
                    ? 'bg-iris border-iris' 
                    : 'bg-surface border-active'
                }`}
              >
                <Text className={`font-medium ${isSelected ? 'text-white' : 'text-foreground'}`}>
                  {interest}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity 
          className={`py-md rounded-lg items-center ${
            selected.length > 0 ? 'bg-iris' : 'bg-surface border border-muted'
          }`}
          disabled={selected.length === 0 || updatePreferences.isPending}
          onPress={() => {
            updatePreferences.mutate(
              { positiveInterests: selected },
              { onSuccess: () => router.replace('/(tabs)/dashboard') }
            );
          }}
        >
          <Text className={`font-semibold text-Body ${
            selected.length > 0 ? 'text-foreground' : 'text-muted'
          }`}>
            {updatePreferences.isPending ? 'Saving...' : 'Continue to Dashboard'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
