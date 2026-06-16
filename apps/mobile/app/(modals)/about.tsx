import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { X, ExternalLink } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function AboutModal() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row justify-between items-center px-lg py-4 border-b border-white/10">
        <Text className="text-white text-xl font-bold" style={{ fontFamily: 'Inter_700Bold' }}>About FeedFlow</Text>
        <TouchableOpacity 
          onPress={() => router.back()}
          className="w-8 h-8 rounded-full bg-surfaceElevated items-center justify-center"
        >
          <X color="#FFFFFF" size={16} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerClassName="p-lg pb-32">
        <View className="items-center mb-8 mt-4">
          <View className="w-24 h-24 rounded-3xl bg-[#FA233B]/20 items-center justify-center mb-4">
            <LinearGradient
              colors={['#FF2D55', '#FA233B']}
              className="w-16 h-16 rounded-2xl items-center justify-center"
            >
              <Text className="text-white text-3xl font-black" style={{ fontFamily: 'Inter_700Bold' }}>F</Text>
            </LinearGradient>
          </View>
          <Text className="text-white text-3xl font-bold tracking-tight mb-2" style={{ fontFamily: 'Inter_700Bold' }}>FeedFlow</Text>
          <Text className="text-muted text-base font-medium" style={{ fontFamily: 'Inter_500Medium' }}>Version 1.0.0</Text>
        </View>

        <View className="bg-surfaceElevated rounded-3xl p-6 border border-white/5 mb-6">
          <Text className="text-white text-xl font-bold mb-3" style={{ fontFamily: 'Inter_700Bold' }}>The Value Proposition</Text>
          <Text className="text-muted text-base leading-relaxed" style={{ fontFamily: 'Inter_400Regular' }}>
            Social media algorithms dictate what we see, shaping our digital environments. FeedFlow puts the control back in your hands. By defining what you love and what you hate, our headless automation engine autonomously trains your algorithm in the background, curating your digital space without requiring your active attention.
          </Text>
        </View>

        <View className="bg-surfaceElevated rounded-3xl border border-white/5 overflow-hidden">
          <TouchableOpacity className="flex-row items-center justify-between p-5">
            <View className="flex-row items-center">
              <Text className="text-white text-lg font-medium" style={{ fontFamily: 'Inter_500Medium' }}>Privacy Policy</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View className="mt-12 items-center">
          <Text className="text-muted text-sm" style={{ fontFamily: 'Inter_500Medium' }}>Built for the Hackathon</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
