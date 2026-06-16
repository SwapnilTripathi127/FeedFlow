import { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Square, Activity, Zap, Camera, TrendingUp, Clock, CircleCheck, LogOut } from 'lucide-react-native';
import { useInstagramStatus, useDisconnectInstagram } from '../../src/hooks/useInstagram';
import { useAutomationStats, useStartAutomation, useStopAutomation } from '../../src/hooks/useAutomation';
import { ConnectInstagramModal } from '../../src/components/ConnectInstagramModal';

export default function DashboardScreen() {
  const [isConnectModalVisible, setConnectModalVisible] = useState(false);
  const { data: instagramStatus, isLoading: isInstaLoading } = useInstagramStatus();
  const { data: autoStats } = useAutomationStats();
  
  const startEngine = useStartAutomation();
  const stopEngine = useStopAutomation();
  const disconnectInstagram = useDisconnectInstagram();

  const isConnected = instagramStatus?.connected;
  const isRunning = autoStats?.isRunning || false;
  
  const handleToggleEngine = () => {
    if (isRunning) {
      stopEngine.mutate();
    } else {
      startEngine.mutate();
    }
  };

  const handleDisconnect = () => {
    if (isRunning) {
      stopEngine.mutate();
    }
    disconnectInstagram.mutate();
  };

  const now = new Date();
  const formatTime = (hoursAgo: number) => {
    const d = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 100 }}>
      <View className="px-lg pt-xxl pb-md">
        <Text className="text-foreground text-4xl font-bold tracking-tight" style={{ fontFamily: 'Inter_700Bold' }}>Listen Now</Text>
      </View>

      {!isConnected ? (
        // --- EMPTY STATE ---
        <View className="px-lg mt-8 flex-1 justify-center items-center">
          <View className="w-24 h-24 rounded-full bg-[#FA233B]/10 items-center justify-center mb-6">
            <Camera color="#FA233B" size={40} />
          </View>
          <Text className="text-white text-2xl font-bold mb-3 text-center" style={{ fontFamily: 'Inter_700Bold' }}>Connect Instagram</Text>
          <Text className="text-muted text-center mb-8 text-base px-4 leading-relaxed" style={{ fontFamily: 'Inter_400Regular' }}>
            FeedFlow needs access to your Instagram account to start curating your feed and interacting with content on your behalf.
          </Text>
          <TouchableOpacity 
            className="bg-[#FA233B] w-full h-14 rounded-full items-center justify-center shadow-lg flex-row"
            onPress={() => setConnectModalVisible(true)}
          >
            <Camera color="#FFFFFF" size={20} className="mr-3" />
            <Text className="text-white font-bold text-lg" style={{ fontFamily: 'Inter_600SemiBold' }}>Securely Connect</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // --- CONNECTED STATE ---
        <>
          {/* Hero Section */}
          <View className="px-lg mb-xl">
            <LinearGradient
              colors={isRunning ? ['#FF2D55', '#FA233B'] : ['#2C2C2E', '#1C1C1E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="rounded-3xl p-lg shadow-lg overflow-hidden relative"
            >
              <View className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white opacity-5" />
              
              <View className="flex-row justify-between items-start mb-6">
                <View>
                  <Text className="text-white/80 text-sm font-medium tracking-widest uppercase mb-1" style={{ fontFamily: 'Inter_600SemiBold' }}>
                    STATUS
                  </Text>
                  <Text className="text-white text-3xl font-bold tracking-tight mb-2" style={{ fontFamily: 'Inter_700Bold' }}>
                    {isRunning ? 'FeedFlow Active' : 'FeedFlow Paused'}
                  </Text>
                  <View className="flex-row items-center bg-black/20 self-start px-3 py-1.5 rounded-full">
                    {instagramStatus?.profilePicUrl ? (
                      <Image source={{ uri: instagramStatus.profilePicUrl }} className="w-5 h-5 rounded-full mr-2" />
                    ) : (
                      <Camera color="#FFFFFF" size={12} className="mr-2" />
                    )}
                    <Text className="text-white text-xs font-semibold" style={{ fontFamily: 'Inter_600SemiBold' }}>
                      @{instagramStatus?.username}
                    </Text>
                  </View>
                </View>
                <View className={`w-12 h-12 rounded-full items-center justify-center ${isRunning ? 'bg-white/20' : 'bg-white/10'}`}>
                  <Activity color="#FFFFFF" size={24} />
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Primary Cards */}
          <View className="px-lg flex-row gap-4 mb-xl">
            <View className="flex-1 bg-surfaceElevated p-5 rounded-3xl border border-white/5">
              <View className="w-8 h-8 rounded-full bg-[#0A84FF]/20 items-center justify-center mb-3">
                <Zap color="#0A84FF" size={16} />
              </View>
              <Text className="text-white text-3xl font-bold tracking-tight mb-1" style={{ fontFamily: 'Inter_700Bold' }}>
                {autoStats?.personalizationScore || 0}%
              </Text>
              <Text className="text-muted text-xs font-medium" style={{ fontFamily: 'Inter_500Medium' }}>Personalization</Text>
            </View>

            <View className="flex-1 bg-surfaceElevated p-5 rounded-3xl border border-white/5">
              <View className="w-8 h-8 rounded-full bg-[#5E5CE6]/20 items-center justify-center mb-3">
                <TrendingUp color="#5E5CE6" size={16} />
              </View>
              <Text className="text-white text-3xl font-bold tracking-tight mb-1" style={{ fontFamily: 'Inter_700Bold' }}>
                {autoStats?.actionsToday || 0}
              </Text>
              <Text className="text-muted text-xs font-medium" style={{ fontFamily: 'Inter_500Medium' }}>Actions Today</Text>
            </View>
          </View>

          {/* Timeline */}
          <View className="px-lg mb-xl">
            <Text className="text-white text-xl font-bold mb-4" style={{ fontFamily: 'Inter_700Bold' }}>Recent Activity</Text>
            <View className="bg-surfaceElevated rounded-3xl p-5 border border-white/5">
              {isRunning ? (
                <>
                  <View className="flex-row items-start mb-6">
                    <View className="w-8 h-8 rounded-full bg-[#38383A] items-center justify-center mr-4 mt-1 border border-[#48484A]">
                      <Activity color="#8E8E93" size={14} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white text-base font-semibold mb-1" style={{ fontFamily: 'Inter_600SemiBold' }}>Analyzing Feed</Text>
                      <Text className="text-muted text-sm" style={{ fontFamily: 'Inter_400Regular' }}>{formatTime(0)}</Text>
                    </View>
                  </View>

                  <View className="flex-row items-start mb-6">
                    <View className="w-8 h-8 rounded-full bg-[#0A84FF]/20 items-center justify-center mr-4 mt-1">
                      <Zap color="#0A84FF" size={14} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white text-base font-semibold mb-1" style={{ fontFamily: 'Inter_600SemiBold' }}>Reinforced Topics</Text>
                      <Text className="text-muted text-sm" style={{ fontFamily: 'Inter_400Regular' }}>{formatTime(2)}</Text>
                    </View>
                  </View>

                  <View className="flex-row items-start">
                    <View className="w-8 h-8 rounded-full bg-[#10B981]/20 items-center justify-center mr-4 mt-1">
                      <CircleCheck color="#10B981" size={14} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white text-base font-semibold mb-1" style={{ fontFamily: 'Inter_600SemiBold' }}>Completed Cycle</Text>
                      <Text className="text-muted text-sm" style={{ fontFamily: 'Inter_400Regular' }}>{formatTime(5)}</Text>
                    </View>
                  </View>
                </>
              ) : (
                 <View className="items-center justify-center py-6">
                    <Clock color="#8E8E93" size={32} className="mb-3" />
                    <Text className="text-muted text-base text-center" style={{ fontFamily: 'Inter_500Medium' }}>Timeline paused while engine is stopped.</Text>
                 </View>
              )}
            </View>
          </View>

          {/* Quick Actions */}
          <View className="px-lg mb-lg">
            <Text className="text-white text-xl font-bold mb-4" style={{ fontFamily: 'Inter_700Bold' }}>Quick Actions</Text>
            
            <TouchableOpacity 
              className={`h-14 rounded-xl items-center flex-row justify-center mb-4 ${isRunning ? 'bg-surfaceElevated border border-white/10' : 'bg-[#FA233B]'}`}
              disabled={startEngine.isPending || stopEngine.isPending}
              onPress={handleToggleEngine}
            >
              {(startEngine.isPending || stopEngine.isPending) ? (
                <ActivityIndicator color={isRunning ? "#8E8E93" : "#FFFFFF"} className="mr-2" />
              ) : isRunning ? (
                <Square color="#FA233B" size={20} fill="#FA233B" className="mr-2" />
              ) : (
                <Play color="#FFFFFF" size={20} fill="#FFFFFF" className="mr-2" />
              )}
              <Text className={`font-semibold text-lg ${isRunning ? 'text-[#FA233B]' : 'text-white'}`} style={{ fontFamily: 'Inter_600SemiBold' }}>
                {startEngine.isPending 
                  ? 'Starting...' 
                  : stopEngine.isPending
                    ? 'Stopping...'
                    : isRunning 
                      ? 'Pause Engine' 
                      : 'Start Engine'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="h-14 rounded-xl items-center flex-row justify-center bg-surfaceElevated border border-[#FA233B]/20"
              onPress={handleDisconnect}
              disabled={disconnectInstagram.isPending}
            >
              {disconnectInstagram.isPending ? (
                <ActivityIndicator color="#FA233B" className="mr-2" />
              ) : (
                <LogOut color="#FA233B" size={20} className="mr-2" />
              )}
              <Text className="font-semibold text-lg text-[#FA233B]" style={{ fontFamily: 'Inter_600SemiBold' }}>
                {disconnectInstagram.isPending ? 'Disconnecting...' : 'Disconnect Instagram'}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <ConnectInstagramModal 
        visible={isConnectModalVisible} 
        onClose={() => setConnectModalVisible(false)} 
      />
    </ScrollView>
  );
}
