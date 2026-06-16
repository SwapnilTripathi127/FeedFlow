import { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, ActivityIndicator,
  SafeAreaView, StatusBar, TextInput, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useConnectInstagram } from '../hooks/useInstagram';

type ConnectInstagramModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function ConnectInstagramModal({ visible, onClose }: ConnectInstagramModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [sessionId, setSessionId] = useState('');
  const connectMutation = useConnectInstagram();

  const handleDone = async () => {
    setError(null);
    if (!username.trim() || !sessionId.trim()) {
      setError('Please provide both your Instagram username and the sessionid cookie.');
      return;
    }

    try {
      connectMutation.mutate(
        { username: username.trim(), sessionid: sessionId.trim() },
        {
          onSuccess: () => handleClose(),
          onError: (err: any) => setError(err.message || 'Failed to save session.'),
        }
      );
    } catch (err: any) {
      setError('Could not connect: ' + err.message);
    }
  };

  const handleClose = () => {
    setUsername('');
    setSessionId('');
    setError(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
        <StatusBar barStyle="light-content" />

        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255,255,255,0.08)',
        }}>
          <TouchableOpacity onPress={handleClose} disabled={connectMutation.isPending}>
            <Text style={{ color: '#8E8E93', fontSize: 16, fontFamily: 'Inter_500Medium' }}>Cancel</Text>
          </TouchableOpacity>

          <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700', fontFamily: 'Inter_700Bold' }}>
            Connect Account
          </Text>

          <TouchableOpacity
            onPress={handleDone}
            disabled={connectMutation.isPending}
            style={{
              backgroundColor: connectMutation.isPending ? 'rgba(250,35,59,0.3)' : '#FA233B',
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 20,
              minWidth: 60,
              alignItems: 'center',
            }}
          >
            {connectMutation.isPending ? (
              <ActivityIndicator size="small" color="#FA233B" />
            ) : (
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700', fontFamily: 'Inter_700Bold' }}>
                Done ✓
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {/* Info banner */}
            <View style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
            }}>
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 8 }}>
                Manual Session Connection
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 20 }}>
                1. Log into Instagram on your computer.{'\n'}
                2. Right-click, select "Inspect", and go to the "Application" or "Storage" tab.{'\n'}
                3. Under Cookies, find "sessionid", copy its value, and paste it below.
              </Text>
            </View>

            {/* Error banner */}
            {error && (
              <View style={{
                backgroundColor: 'rgba(250,35,59,0.1)',
                padding: 12,
                borderRadius: 8,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: 'rgba(250,35,59,0.2)',
              }}>
                <Text style={{ color: '#FF2D55', fontSize: 13, fontFamily: 'Inter_400Medium' }}>
                  {error}
                </Text>
              </View>
            )}

            {/* Inputs */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                Instagram Username
              </Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="@username"
                placeholderTextColor="rgba(255,255,255,0.3)"
                autoCapitalize="none"
                autoCorrect={false}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)',
                }}
              />
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                Session ID (Cookie)
              </Text>
              <TextInput
                value={sessionId}
                onChangeText={setSessionId}
                placeholder="Paste sessionid here..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                autoCapitalize="none"
                autoCorrect={false}
                multiline
                style={{
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 14,
                  minHeight: 100,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)',
                }}
              />
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
