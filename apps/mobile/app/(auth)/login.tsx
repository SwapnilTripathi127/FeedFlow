import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';

export default function LoginScreen() {
  const router = useRouter();
  const signInDemo = useAuthStore(state => state.signInDemo);

  const handleDemoSignIn = () => {
    signInDemo();
    router.replace('/onboarding');
  };

  return (
    <View className="flex-1 justify-center p-md bg-background">
      <View className="items-center mb-xl">
        <Text className="text-Display font-bold text-foreground mb-sm">FeedFlow</Text>
        <Text className="text-muted text-center text-Body">Sign in to reclaim your feed.</Text>
      </View>

      <View className="bg-surface p-lg rounded-xl border border-muted">
        <TextInput 
          className="border border-active bg-background text-foreground px-md py-sm rounded-lg mb-md h-12"
          placeholder="Email address"
          placeholderTextColor="#A1A1AA"
        />
        <TextInput 
          className="border border-active bg-background text-foreground px-md py-sm rounded-lg mb-lg h-12"
          placeholder="Password"
          placeholderTextColor="#A1A1AA"
          secureTextEntry
        />
        <TouchableOpacity 
          className="bg-iris py-md rounded-lg items-center"
          onPress={handleDemoSignIn}
        >
          <Text className="text-foreground font-semibold text-Body">Sign In (Demo)</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity className="mt-lg items-center" onPress={() => router.push('/(auth)/register')}>
        <Text className="text-iris-light text-Body">Create an account</Text>
      </TouchableOpacity>
    </View>
  );
}
