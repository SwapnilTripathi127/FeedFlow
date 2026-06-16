import { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, ActivityIndicator,
  SafeAreaView, StatusBar, TextInput, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { useLoginInstagram } from '../hooks/useInstagram';

type ConnectInstagramModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function ConnectInstagramModal({ visible, onClose }: ConnectInstagramModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const loginMutation = useLoginInstagram();

  const handleConnect = async () => {
    setError(null);
    if (!username.trim() || !password.trim()) {
      setError('Please enter both your Instagram username and password.');
      return;
    }

    loginMutation.mutate(
      { username: username.trim().replace('@', ''), password: password.trim() },
      {
        onSuccess: () => handleClose(),
        onError: (err: any) => setError(err.message || 'Connection failed. Please try again.'),
      }
    );
  };

  const handleClose = () => {
    setUsername('');
    setPassword('');
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
          <TouchableOpacity onPress={handleClose} disabled={loginMutation.isPending}>
            <Text style={{ color: '#8E8E93', fontSize: 16 }}>Cancel</Text>
          </TouchableOpacity>

          <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>
            Connect Instagram
          </Text>

          <View style={{ width: 60 }} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={{ padding: 24 }}>

            {/* Instagram logo area */}
            <View style={{ alignItems: 'center', marginBottom: 32, marginTop: 8 }}>
              <View style={{
                width: 72, height: 72, borderRadius: 20,
                background: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
                backgroundColor: '#E1306C',
                alignItems: 'center', justifyContent: 'center', marginBottom: 16,
              }}>
                <Text style={{ fontSize: 36 }}>📸</Text>
              </View>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 6 }}>
                Sign in to Instagram
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center', lineHeight: 18 }}>
                FeedFlow will log in as a mobile device to connect your account securely.
              </Text>
            </View>

            {/* Error banner */}
            {error && (
              <View style={{
                backgroundColor: 'rgba(250,35,59,0.12)',
                padding: 14,
                borderRadius: 12,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: 'rgba(250,35,59,0.25)',
              }}>
                <Text style={{ color: '#FF4458', fontSize: 13, lineHeight: 18 }}>
                  {error}
                </Text>
              </View>
            )}

            {/* Username */}
            <View style={{ marginBottom: 14 }}>
              <Text style={{
                color: 'rgba(255,255,255,0.45)', fontSize: 11,
                textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8
              }}>
                Username
              </Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="@yourusername"
                placeholderTextColor="rgba(255,255,255,0.25)"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loginMutation.isPending}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.07)',
                  color: '#fff',
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)',
                }}
              />
            </View>

            {/* Password */}
            <View style={{ marginBottom: 28 }}>
              <Text style={{
                color: 'rgba(255,255,255,0.45)', fontSize: 11,
                textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8
              }}>
                Password
              </Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor="rgba(255,255,255,0.25)"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loginMutation.isPending}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.07)',
                  color: '#fff',
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)',
                }}
              />
            </View>

            {/* Connect Button */}
            <TouchableOpacity
              onPress={handleConnect}
              disabled={loginMutation.isPending}
              style={{
                backgroundColor: loginMutation.isPending ? 'rgba(225,48,108,0.4)' : '#E1306C',
                borderRadius: 14,
                paddingVertical: 16,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 10,
              }}
            >
              {loginMutation.isPending ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
                    Connecting via mobile browser…
                  </Text>
                </>
              ) : (
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
                  Connect Account
                </Text>
              )}
            </TouchableOpacity>

            {loginMutation.isPending && (
              <Text style={{
                color: 'rgba(255,255,255,0.4)', fontSize: 12,
                textAlign: 'center', marginTop: 16, lineHeight: 18
              }}>
                FeedFlow is opening a private iPhone browser session to log in. This takes about 10–20 seconds…
              </Text>
            )}

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
