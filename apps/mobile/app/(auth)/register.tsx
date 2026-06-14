import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';

export default function RegisterScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 justify-center p-md bg-background">
      <View className="items-center mb-xl">
        <Text className="text-H1 font-bold text-foreground mb-sm">Create Account</Text>
        <Text className="text-muted text-center text-Body">Join FeedFlow to optimize your feed.</Text>
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
          onPress={() => router.replace('/onboarding')}
        >
          <Text className="text-foreground font-semibold text-Body">Sign Up (Demo)</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity className="mt-lg items-center" onPress={() => router.push('/(auth)/login')}>
        <Text className="text-iris-light text-Body">Already have an account? Log in</Text>
      </TouchableOpacity>
    </View>
  );
}
