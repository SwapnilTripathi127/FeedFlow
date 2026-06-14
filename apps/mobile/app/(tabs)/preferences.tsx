import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { usePreferences, useUpdatePreferences } from '../../src/hooks/usePreferences';

export default function PreferencesScreen() {
  const { data: preferences, isLoading } = usePreferences();
  const updatePrefs = useUpdatePreferences();

  const [positiveInput, setPositiveInput] = useState('');
  const [negativeInput, setNegativeInput] = useState('');

  // Sync initial data
  useEffect(() => {
    if (preferences) {
      setPositiveInput(preferences.positiveInterests?.join(', ') || '');
      setNegativeInput(preferences.negativeInterests?.join(', ') || '');
    }
  }, [preferences]);

  const handleSave = () => {
    updatePrefs.mutate({
      positiveInterests: positiveInput.split(',').map(s => s.trim()).filter(Boolean),
      negativeInterests: negativeInput.split(',').map(s => s.trim()).filter(Boolean),
    });
  };

  return (
    <View className="flex-1 bg-[#09090B] p-lg pt-xxl">
      <View className="mb-xl">
        <Text className="text-3xl font-bold text-[#FAFAFA]">Preferences</Text>
        <Text className="text-base text-[#A1A1AA] mt-1">
          Tell FeedFlow what to curate and what to avoid.
        </Text>
      </View>

      <View className="bg-[#18181B] p-md rounded-xl border border-[#27272A] mb-lg">
        <Text className="text-[#FAFAFA] font-semibold text-lg mb-xs">Signal (Positive)</Text>
        <Text className="text-[#A1A1AA] text-base mb-md">
          Topics, creators, or hashtags you want to see more of. Separated by commas.
        </Text>
        <TextInput
          className="bg-[#09090B] border border-[#3F3F46] rounded-lg p-md text-[#FAFAFA]"
          placeholder="e.g. Startups, AI, Design, Photography"
          placeholderTextColor="#A1A1AA"
          value={positiveInput}
          onChangeText={setPositiveInput}
          multiline
          numberOfLines={3}
          style={{ minHeight: 80, textAlignVertical: 'top' }}
        />
      </View>

      <View className="bg-[#18181B] p-md rounded-xl border border-[#27272A] mb-xl">
        <Text className="text-[#FAFAFA] font-semibold text-lg mb-xs">Noise (Negative)</Text>
        <Text className="text-[#A1A1AA] text-base mb-md">
          Topics you want the engine to actively skip and ignore.
        </Text>
        <TextInput
          className="bg-[#09090B] border border-[#3F3F46] rounded-lg p-md text-[#FAFAFA]"
          placeholder="e.g. Politics, Gossip, Crypto"
          placeholderTextColor="#A1A1AA"
          value={negativeInput}
          onChangeText={setNegativeInput}
          multiline
          numberOfLines={3}
          style={{ minHeight: 80, textAlignVertical: 'top' }}
        />
      </View>

      <TouchableOpacity
        className={`py-md rounded-lg items-center flex-row justify-center ${updatePrefs.isPending ? 'bg-[#A78BFA]' : 'bg-[#7C3AED]'}`}
        disabled={updatePrefs.isPending}
        onPress={handleSave}
      >
        {updatePrefs.isPending && <ActivityIndicator color="#FFFFFF" className="mr-sm" />}
        <Text className="font-semibold text-white">
          {updatePrefs.isPending ? 'Saving...' : 'Save Preferences'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
