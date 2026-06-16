import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, X, Heart, HeartOff, LogOut, ChevronRight, Info } from 'lucide-react-native';
import { usePreferences, useUpdatePreferences } from '../../src/hooks/usePreferences';
import { useAuthStore } from '../../src/store/authStore';

export default function PreferencesScreen() {
  const { data: preferences, isLoading } = usePreferences();
  const updatePrefs = useUpdatePreferences();
  const { signOut } = useAuthStore();
  const router = useRouter();

  const [positiveInterests, setPositiveInterests] = useState<string[]>([]);
  const [negativeInterests, setNegativeInterests] = useState<string[]>([]);
  
  const [posInput, setPosInput] = useState('');
  const [negInput, setNegInput] = useState('');

  // Sync initial data
  useEffect(() => {
    if (preferences) {
      setPositiveInterests(preferences.positiveInterests || []);
      setNegativeInterests(preferences.negativeInterests || []);
    }
  }, [preferences]);

  const handleSave = () => {
    updatePrefs.mutate({
      positiveInterests,
      negativeInterests,
    });
  };

  const addInterest = (type: 'positive' | 'negative', text: string) => {
    const val = text.trim();
    if (!val) return;
    if (type === 'positive' && !positiveInterests.includes(val)) {
      setPositiveInterests([...positiveInterests, val]);
      setPosInput('');
    } else if (type === 'negative' && !negativeInterests.includes(val)) {
      setNegativeInterests([...negativeInterests, val]);
      setNegInput('');
    }
  };

  const removeInterest = (type: 'positive' | 'negative', text: string) => {
    if (type === 'positive') {
      setPositiveInterests(positiveInterests.filter(i => i !== text));
    } else {
      setNegativeInterests(negativeInterests.filter(i => i !== text));
    }
  };

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="px-lg pt-xxl pb-md">
          <Text className="text-white text-4xl font-bold tracking-tight mb-2" style={{ fontFamily: 'Inter_700Bold' }}>Settings</Text>
        </View>

        {/* Group 1: Algorithmic Preferences */}
        <View className="px-lg mb-8">
          <Text className="text-white text-xl font-bold mb-4" style={{ fontFamily: 'Inter_700Bold' }}>Algorithm Tuning</Text>
          <View className="bg-surfaceElevated rounded-3xl overflow-hidden border border-white/5">
            
            {/* Positive */}
            <View className="p-5 border-b border-white/5">
              <View className="flex-row items-center mb-4">
                <Heart color="#FF2D55" size={20} fill="#FF2D55" className="mr-2" />
                <Text className="text-white text-lg font-bold" style={{ fontFamily: 'Inter_700Bold' }}>More of this</Text>
              </View>
              
              <View className="flex-row flex-wrap gap-2 mb-4">
                {positiveInterests.map((interest) => (
                  <TouchableOpacity 
                    key={interest}
                    onPress={() => removeInterest('positive', interest)}
                    className="bg-[#FA233B]/10 border border-[#FA233B]/30 rounded-full px-4 py-2 flex-row items-center"
                  >
                    <Text className="text-[#FF2D55] font-medium mr-1" style={{ fontFamily: 'Inter_500Medium' }}>{interest}</Text>
                    <X color="#FF2D55" size={14} />
                  </TouchableOpacity>
                ))}
                {positiveInterests.length === 0 && (
                  <Text className="text-muted text-sm my-2" style={{ fontFamily: 'Inter_400Regular' }}>No interests added yet.</Text>
                )}
              </View>

              <View className="flex-row items-center bg-surface border border-white/5 rounded-full px-4 h-12">
                <TextInput
                  className="flex-1 text-white font-medium text-base"
                  style={{ fontFamily: 'Inter_500Medium' }}
                  placeholder="Add topic (e.g. Design)"
                  placeholderTextColor="#8E8E93"
                  value={posInput}
                  onChangeText={setPosInput}
                  onSubmitEditing={() => addInterest('positive', posInput)}
                  returnKeyType="done"
                />
                <TouchableOpacity onPress={() => addInterest('positive', posInput)}>
                  <View className="w-8 h-8 rounded-full bg-[#FA233B] items-center justify-center">
                    <Plus color="#FFFFFF" size={16} />
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Negative */}
            <View className="p-5 border-b border-white/5">
              <View className="flex-row items-center mb-4">
                <HeartOff color="#8E8E93" size={20} className="mr-2" />
                <Text className="text-white text-lg font-bold" style={{ fontFamily: 'Inter_700Bold' }}>Less of this</Text>
              </View>
              
              <View className="flex-row flex-wrap gap-2 mb-4">
                {negativeInterests.map((interest) => (
                  <TouchableOpacity 
                    key={interest}
                    onPress={() => removeInterest('negative', interest)}
                    className="bg-white/5 border border-white/10 rounded-full px-4 py-2 flex-row items-center"
                  >
                    <Text className="text-muted font-medium mr-1" style={{ fontFamily: 'Inter_500Medium' }}>{interest}</Text>
                    <X color="#8E8E93" size={14} />
                  </TouchableOpacity>
                ))}
                {negativeInterests.length === 0 && (
                  <Text className="text-muted text-sm my-2" style={{ fontFamily: 'Inter_400Regular' }}>No filters added yet.</Text>
                )}
              </View>

              <View className="flex-row items-center bg-surface border border-white/5 rounded-full px-4 h-12">
                <TextInput
                  className="flex-1 text-white font-medium text-base"
                  style={{ fontFamily: 'Inter_500Medium' }}
                  placeholder="Add filter (e.g. Politics)"
                  placeholderTextColor="#8E8E93"
                  value={negInput}
                  onChangeText={setNegInput}
                  onSubmitEditing={() => addInterest('negative', negInput)}
                  returnKeyType="done"
                />
                <TouchableOpacity onPress={() => addInterest('negative', negInput)}>
                  <View className="w-8 h-8 rounded-full bg-white/10 items-center justify-center">
                    <Plus color="#8E8E93" size={16} />
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <View className="p-5">
              {updatePrefs.error && (
                <View className="mb-4">
                   <Text className="text-[#FF2D55] text-center font-medium" style={{ fontFamily: 'Inter_500Medium' }}>
                    {updatePrefs.error.message}
                   </Text>
                </View>
              )}
              <TouchableOpacity
                className={`h-14 rounded-full items-center flex-row justify-center shadow-lg ${updatePrefs.isPending ? 'bg-surface border border-white/10' : 'bg-white'}`}
                disabled={updatePrefs.isPending}
                onPress={handleSave}
              >
                {updatePrefs.isPending && <ActivityIndicator color="#8E8E93" className="mr-3" />}
                <Text 
                  className={`font-semibold text-lg tracking-wide ${updatePrefs.isPending ? 'text-muted' : 'text-background'}`}
                  style={{ fontFamily: 'Inter_600SemiBold' }}
                >
                  {updatePrefs.isPending ? 'Saving...' : 'Save Algorithm Config'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Group 2: Information */}
        <View className="px-lg mb-8">
          <Text className="text-white text-xl font-bold mb-4" style={{ fontFamily: 'Inter_700Bold' }}>Information</Text>
          <View className="bg-surfaceElevated rounded-3xl overflow-hidden border border-white/5">
            <TouchableOpacity 
              className="flex-row items-center justify-between p-5"
              onPress={() => router.push('/(modals)/about')}
            >
              <View className="flex-row items-center">
                <Info color="#FFFFFF" size={20} className="mr-3" />
                <Text className="text-white text-lg font-medium" style={{ fontFamily: 'Inter_500Medium' }}>About FeedFlow</Text>
              </View>
              <ChevronRight color="#8E8E93" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Group 3: Account */}
        <View className="px-lg mb-8">
          <Text className="text-white text-xl font-bold mb-4" style={{ fontFamily: 'Inter_700Bold' }}>Account</Text>
          <View className="bg-surfaceElevated rounded-3xl overflow-hidden border border-white/5">
            <TouchableOpacity 
              className="flex-row items-center justify-between p-5"
              onPress={signOut}
            >
              <View className="flex-row items-center">
                <LogOut color="#FA233B" size={20} className="mr-3" />
                <Text className="text-[#FA233B] text-lg font-medium" style={{ fontFamily: 'Inter_500Medium' }}>Sign Out</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
