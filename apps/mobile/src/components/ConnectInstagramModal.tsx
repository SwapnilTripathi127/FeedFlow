import { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, ActivityIndicator } from 'react-native';
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
      <View className="flex-1 justify-end bg-black/60">
        <View className="bg-background rounded-t-3xl p-lg pt-xl min-h-[50%]">
          <View className="items-center mb-xl">
            <View className="w-16 h-1 bg-muted rounded-full mb-lg" />
            <Text className="text-H1 font-bold text-foreground mb-xs">Connect Instagram</Text>
            <Text className="text-muted text-center text-Body">
              Securely connect your account to allow the FeedFlow Engine to personalize your algorithm.
            </Text>
          </View>

          <View className="mb-xl">
            <Text className="text-foreground font-medium mb-xs ml-xs">Username</Text>
            <TextInput
              className="bg-surface border border-active text-foreground rounded-xl px-md py-sm h-14 mb-md font-medium"
              placeholder="e.g. @zuck"
              placeholderTextColor="#71717A"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text className="text-foreground font-medium mb-xs ml-xs">Password</Text>
            <TextInput
              className="bg-surface border border-active text-foreground rounded-xl px-md py-sm h-14 font-medium"
              placeholder="••••••••"
              placeholderTextColor="#71717A"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            className={`py-md rounded-xl items-center flex-row justify-center ${
              !username || !password || connectMutation.isPending
                ? 'bg-surface border border-muted'
                : 'bg-iris'
            }`}
            disabled={!username || !password || connectMutation.isPending}
            onPress={handleConnect}
          >
            {connectMutation.isPending && (
              <ActivityIndicator color="#FFFFFF" className="mr-sm" />
            )}
            <Text
              className={`font-semibold text-Body ${
                !username || !password ? 'text-muted' : 'text-white'
              }`}
            >
              {connectMutation.isPending ? 'Connecting safely...' : 'Securely Connect'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="py-md mt-sm items-center" 
            onPress={onClose}
            disabled={connectMutation.isPending}
          >
            <Text className="text-muted font-medium">Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
