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
const IG_HOME_URL = 'https://www.instagram.com/';

// This JavaScript is injected into the WebView after every page load.
// It reads the cookies from the browser's document.cookie, finds the sessionid,
// and posts it back to the React Native app via window.ReactNativeWebView.postMessage
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
  })();
  true; // required
`;

// Extract Instagram username from the page after login
const USERNAME_EXTRACTOR_JS = `
  (function() {
    // Try to get username from meta tags or profile links
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      const match = canonical.href.match(/instagram\\.com\\/([^/]+)/);
      if (match && match[1] && match[1] !== 'accounts') {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'username', value: match[1] }));
      }
    }
    // Also try page title "Username • Instagram"
    const titleMatch = document.title.match(/^([^•]+)\s*•/);
    if (titleMatch) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'username', value: titleMatch[1].trim() }));
    }
  })();
  true;
`;

export function ConnectInstagramModal({ visible, onClose }: ConnectInstagramModalProps) {
  const [isWebViewLoading, setIsWebViewLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<{ sessionid?: string; username?: string }>({});
  const connectMutation = useConnectInstagram();

  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'sessionid') sessionRef.current.sessionid = msg.value;
      if (msg.type === 'username') sessionRef.current.username = msg.value;
    } catch (_) {}
  };

  const handleNavigationChange = (navState: WebViewNavigation) => {
    const url = navState.url || '';
    // User has successfully logged in when they land on the home feed
    const isLoggedIn =
      (url.startsWith(IG_HOME_URL) || url.includes('instagram.com/')) &&
      !url.includes('/accounts/login') &&
      !url.includes('/accounts/emailsignup');

    if (isLoggedIn && sessionRef.current.sessionid && !isSaving) {
      setIsSaving(true);
    }
  };

  const handleLoadEnd = () => {
    setIsWebViewLoading(false);
  };

  // Once we have the sessionid and know we're on the home feed, save it
  const handleSaveSession = () => {
    const { sessionid, username } = sessionRef.current;
    if (!sessionid) {
      setError('Could not extract session. Please log in again.');
      setIsSaving(false);
      return;
    }
    // Use username or a placeholder - the API will store whatever username we have
    const finalUsername = username || 'instagram_user_' + Date.now();

    connectMutation.mutate(
      { username: finalUsername, sessionid },
      {
        onSuccess: () => {
          setIsSaving(false);
          onClose();
        },
        onError: (err: any) => {
          setError(err.message || 'Failed to save session. Please try again.');
          setIsSaving(false);
        },
      }
    );
  };

  const handleClose = () => {
    sessionRef.current = {};
    setIsSaving(false);
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
          <TouchableOpacity onPress={handleClose} disabled={isSaving}>
            <Text style={{ color: '#8E8E93', fontSize: 16, fontFamily: 'Inter_500Medium' }}>Cancel</Text>
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700', fontFamily: 'Inter_700Bold' }}>
            Connect Instagram
          </Text>
          <View style={{ width: 60 }} />
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
            🔒 Log in with the real Instagram page. Your password is never seen by FeedFlow.
          </Text>
        </View>

        {/* Saving overlay */}
        {isSaving && (
          <View style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            zIndex: 100,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
          }}>
            <ActivityIndicator size="large" color="#FA233B" />
            <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'Inter_600SemiBold' }}>
              Securing your connection...
            </Text>
            <TouchableOpacity
              onPress={handleSaveSession}
              style={{
                backgroundColor: '#FA233B',
                paddingHorizontal: 32,
                paddingVertical: 14,
                borderRadius: 50,
                marginTop: 8,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', fontFamily: 'Inter_700Bold' }}>
                Tap to Confirm Connection
              </Text>
            </TouchableOpacity>
            {error && (
              <Text style={{ color: '#FF2D55', fontSize: 13, textAlign: 'center', maxWidth: 260, fontFamily: 'Inter_400Regular' }}>
                {error}
              </Text>
            )}
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
          source={{ uri: INSTAGRAM_LOGIN_URL }}
          onMessage={handleMessage}
          onNavigationStateChange={handleNavigationChange}
          onLoadEnd={handleLoadEnd}
          injectedJavaScriptBeforeContentLoaded={COOKIE_EXTRACTOR_JS}
          injectedJavaScript={COOKIE_EXTRACTOR_JS + '\n' + USERNAME_EXTRACTOR_JS}
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          style={{ flex: 1, backgroundColor: '#000' }}
          userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
        />
      </SafeAreaView>
    </Modal>
  );
}
