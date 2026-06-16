import { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../src/services/supabase';

export default function LoginScreen() {
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    
    setIsLoading(true);
    setErrorMsg('');
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    setIsLoading(false);
    
    if (error) {
      setErrorMsg(error.message);
    } else {
      router.replace('/(tabs)/dashboard');
    }
  };

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-background justify-center px-lg"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="mb-20 mt-10">
        <Text className="text-white text-5xl font-bold tracking-tighter mb-4" style={{ fontFamily: 'Inter_700Bold' }}>FeedFlow.</Text>
        <Text className="text-muted text-xl font-medium" style={{ fontFamily: 'Inter_500Medium' }}>Welcome back. Sign in to continue curating your digital space.</Text>
      </View>

      <View className="mb-8">
        <TextInput 
          className="bg-surfaceElevated border border-white/5 text-white rounded-2xl px-5 py-4 h-16 mb-4 font-medium text-lg"
          style={{ fontFamily: 'Inter_500Medium' }}
          placeholder="Email address"
          placeholderTextColor="#8E8E93"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput 
          className="bg-surfaceElevated border border-white/5 text-white rounded-2xl px-5 py-4 h-16 font-medium text-lg"
          style={{ fontFamily: 'Inter_500Medium' }}
          placeholder="Password"
          placeholderTextColor="#8E8E93"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      {errorMsg ? (
        <View className="bg-[#FA233B]/10 p-4 rounded-2xl mb-8 border border-[#FA233B]/20">
          <Text className="text-[#FF2D55] text-center font-medium" style={{ fontFamily: 'Inter_500Medium' }}>{errorMsg}</Text>
        </View>
      ) : <View className="h-4 mb-4" />}

      <TouchableOpacity 
        className="mb-8"
        onPress={handleLogin}
        disabled={isLoading}
      >
        <LinearGradient
          colors={['#FF2D55', '#FA233B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className={`h-14 rounded-full items-center flex-row justify-center shadow-lg ${isLoading ? 'opacity-80' : ''}`}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" className="mr-3" />
          ) : null}
          <Text className="text-white font-bold text-lg tracking-wide" style={{ fontFamily: 'Inter_600SemiBold' }}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      <View className="flex-row justify-center">
        <Text className="text-muted text-base" style={{ fontFamily: 'Inter_400Regular' }}>New to FeedFlow? </Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
          <Text className="text-[#FA233B] text-base font-semibold" style={{ fontFamily: 'Inter_600SemiBold' }}>Create an account</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
