import { useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, ActivityIndicator,
  SafeAreaView, StatusBar,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { useConnectInstagram } from '../hooks/useInstagram';

type ConnectInstagramModalProps = {
  visible: boolean;
  onClose: () => void;
};

const INSTAGRAM_LOGIN_URL = 'https://www.instagram.com/accounts/login/';

// Injected on every page load to extract cookies
const COOKIE_EXTRACTOR_JS = `
  (function() {
    function getCookie(name) {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? match[2] : null;
    }
    const sessionid = getCookie('sessionid');
    if (sessionid) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'sessionid', value: sessionid }));
    }
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
  const sessionRef = useRef<{ sessionid?: string; username?: string }>({});
  const webViewRef = useRef<WebView>(null);
  const connectMutation = useConnectInstagram();

  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'sessionid') sessionRef.current.sessionid = msg.value;
      if (msg.type === 'username') sessionRef.current.username = msg.value;
    } catch (_) {}
  };

  const handleNavigationChange = (navState: WebViewNavigation) => {
    // Just track URL changes - user will tap button manually
    const url = navState.url || '';
    // Auto-extract cookie on any navigation
    const hasSession = !!sessionRef.current.sessionid;
    if (!hasSession) {
      // keep trying to extract - injectedJavaScript handles this
    }
    void url;
  };

  const handleLoadEnd = () => {
    setIsWebViewLoading(false);
  };

  // When user taps Done, inject JS to extract cookie right now, then save
  const handleSaveSession = () => {
    setError(null);
    // First inject the extractor to get the latest cookies
    webViewRef.current?.injectJavaScript(COOKIE_EXTRACTOR_JS);
    // Give JS 500ms to respond via postMessage, then proceed
    setTimeout(() => {
      const { sessionid, username } = sessionRef.current;
      if (!sessionid) {
        setError('Not logged in yet — please complete the Instagram login first, then tap Done ✓.');
        return;
      }
      const finalUsername = username && username !== 'Instagram' ? username : ('ig_user_' + Date.now());
      connectMutation.mutate(
        { username: finalUsername, sessionid },
        {
          onSuccess: () => {
            handleClose();
          },
          onError: (err: any) => {
            setError(err.message || 'Failed to save session. Please try again.');
          },
        }
      );
    }, 600);
  };

  const handleClose = () => {
    sessionRef.current = {};
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
          {/* This button is always visible - user taps it once logged in */}
          <TouchableOpacity
            onPress={handleSaveSession}
            disabled={connectMutation.isPending}
            style={{
              backgroundColor: connectMutation.isPending ? 'transparent' : '#FA233B',
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
            🔒 Log in below. Once you see your Instagram feed, tap <Text style={{ color: '#FA233B', fontWeight: '700' }}>Done ✓</Text> above.
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

        {/* The actual Instagram login WebView */}
        <WebView
          ref={webViewRef}
          source={{ uri: INSTAGRAM_LOGIN_URL }}
          onMessage={handleMessage}
          onNavigationStateChange={handleNavigationChange}
          onLoadEnd={handleLoadEnd}
          injectedJavaScript={COOKIE_EXTRACTOR_JS}
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          style={{ flex: 1, backgroundColor: '#000' }}
          userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
        />
      </SafeAreaView>
    </Modal>
  );
}
