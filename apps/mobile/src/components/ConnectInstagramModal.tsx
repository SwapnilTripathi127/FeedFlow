import { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { useConnectInstagram } from '../hooks/useInstagram';

type ConnectInstagramModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function ConnectInstagramModal({ visible, onClose }: ConnectInstagramModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const connectMutation = useConnectInstagram();

  const handleConnect = () => {
    connectMutation.mutate(
      { username, password },
      {
        onSuccess: () => {
          onClose(); // Close modal on success
        },
      }
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <BlurView intensity={30} tint="dark" className="flex-1 justify-end">
        <View className="bg-surface rounded-t-[40px] p-8 pt-6 min-h-[60%] border-t border-white/10 shadow-2xl">
          <View className="items-center mb-10">
            <View className="w-12 h-1.5 bg-white/20 rounded-full mb-8" />
            <Text className="text-white text-3xl font-bold mb-3 tracking-tight" style={{ fontFamily: 'Inter_700Bold' }}>Connect Account</Text>
            <Text className="text-muted text-center text-base" style={{ fontFamily: 'Inter_400Regular' }}>
              Securely connect to allow the FeedFlow Engine to personalize your algorithm.
            </Text>
          </View>

          <View className="mb-10">
            <TextInput
              className="bg-surfaceElevated border border-white/5 text-white rounded-2xl px-5 py-4 h-16 mb-4 font-medium text-lg"
              style={{ fontFamily: 'Inter_500Medium' }}
              placeholder="Instagram Username"
              placeholderTextColor="#8E8E93"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextInput
              className="bg-surfaceElevated border border-white/5 text-white rounded-2xl px-5 py-4 h-16 font-medium text-lg"
              style={{ fontFamily: 'Inter_500Medium' }}
              placeholder="Password"
              placeholderTextColor="#8E8E93"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {connectMutation.error && (
            <View className="bg-[#FA233B]/10 p-4 rounded-2xl mb-6 border border-[#FA233B]/20">
              <Text className="text-[#FF2D55] text-center font-medium" style={{ fontFamily: 'Inter_500Medium' }}>
                {connectMutation.error.message}
              </Text>
            </View>
          )}

          <TouchableOpacity
            className={`h-14 rounded-full items-center flex-row justify-center shadow-lg ${
              !username || !password || connectMutation.isPending
                ? 'bg-surfaceElevated border border-white/10'
                : 'bg-[#FA233B]'
            }`}
            disabled={!username || !password || connectMutation.isPending}
            onPress={handleConnect}
          >
            {connectMutation.isPending && (
              <ActivityIndicator color={(!username || !password) ? "#8E8E93" : "#FFFFFF"} className="mr-3" />
            )}
            <Text
              className={`font-semibold text-lg tracking-wide ${
                !username || !password ? 'text-muted' : 'text-white'
              }`}
              style={{ fontFamily: 'Inter_600SemiBold' }}
            >
              {connectMutation.isPending ? 'Connecting...' : 'Securely Connect'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="py-5 mt-2 items-center" 
            onPress={onClose}
            disabled={connectMutation.isPending}
          >
            <Text className="text-white/60 font-medium text-base" style={{ fontFamily: 'Inter_500Medium' }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </Modal>
  );
}
