import { useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, ActivityIndicator,
  SafeAreaView, StatusBar,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import CookieManager from '@react-native-cookies/cookies';
import { useConnectInstagram } from '../hooks/useInstagram';

type ConnectInstagramModalProps = {
  visible: boolean;
  onClose: () => void;
};

const INSTAGRAM_LOGIN_URL = 'https://www.instagram.com/accounts/login/';

// Injected on page load to grab username from page title
const USERNAME_EXTRACTOR_JS = `
  (function() {
    const titleMatch = document.title.match(/^([^•]+)\s*•/);
    if (titleMatch && titleMatch[1].trim() !== 'Instagram') {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'username', value: titleMatch[1].trim() }));
    }
  })();
  true;
`;

export function ConnectInstagramModal({ visible, onClose }: ConnectInstagramModalProps) {
  const [isWebViewLoading, setIsWebViewLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const usernameRef = useRef<string>('');
  const webViewRef = useRef<WebView>(null);
  const connectMutation = useConnectInstagram();

  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'username' && msg.value) {
        usernameRef.current = msg.value;
      }
    } catch (_) {}
  };

  const handleNavigationChange = (_navState: WebViewNavigation) => {
    // Re-run username extractor on every navigation
    webViewRef.current?.injectJavaScript(USERNAME_EXTRACTOR_JS);
  };

  const handleDone = async () => {
    setError(null);
    try {
      // Use native CookieManager to read ALL cookies including HttpOnly sessionid
      const cookies = await CookieManager.get('https://www.instagram.com', true);
      const sessionid = cookies['sessionid']?.value;

      if (!sessionid) {
        setError('Not logged in yet — please finish the Instagram login, then tap Done ✓.');
        return;
      }

      const username = usernameRef.current || ('ig_user_' + Date.now());

      connectMutation.mutate(
        { username, sessionid },
        {
          onSuccess: () => handleClose(),
          onError: (err: any) => setError(err.message || 'Failed to save session.'),
        }
      );
    } catch (err: any) {
      setError('Could not read cookies: ' + err.message);
    }
  };

  const handleClose = () => {
    usernameRef.current = '';
    setError(null);
    setIsWebViewLoading(true);
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
            Connect Instagram
          </Text>

          {/* Always-visible Done button */}
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

        {/* Info banner */}
        <View style={{
          backgroundColor: 'rgba(250,35,59,0.08)',
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(250,35,59,0.15)',
          paddingHorizontal: 20,
          paddingVertical: 10,
        }}>
          <Text style={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: 12,
            textAlign: 'center',
            fontFamily: 'Inter_400Regular',
            lineHeight: 18,
          }}>
            🔒 Log in below. Once you see your Instagram feed, tap{' '}
            <Text style={{ color: '#FA233B', fontWeight: '700' }}>Done ✓</Text> above.
          </Text>
        </View>

        {/* Error banner */}
        {error && (
          <View style={{
            backgroundColor: 'rgba(250,35,59,0.1)',
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(250,35,59,0.2)',
          }}>
            <Text style={{ color: '#FF2D55', fontSize: 13, textAlign: 'center', fontFamily: 'Inter_400Regular' }}>
              {error}
            </Text>
          </View>
        )}

        {/* WebView loading spinner */}
        {isWebViewLoading && (
          <View style={{
            position: 'absolute', top: 120, left: 0, right: 0,
            alignItems: 'center', zIndex: 50,
          }}>
            <ActivityIndicator size="large" color="#FA233B" />
          </View>
        )}

        <WebView
          ref={webViewRef}
          source={{ uri: INSTAGRAM_LOGIN_URL }}
          onMessage={handleMessage}
          onNavigationStateChange={handleNavigationChange}
          onLoadEnd={() => setIsWebViewLoading(false)}
          injectedJavaScript={USERNAME_EXTRACTOR_JS}
          sharedCookiesEnabled={true}
          thirdPartyCookiesEnabled={true}
          style={{ flex: 1, backgroundColor: '#000' }}
          userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
        />
      </SafeAreaView>
    </Modal>
  );
}
