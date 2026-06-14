import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useInstagramStatus } from '../../src/hooks/useInstagram';
import { useAutomationStats, useStartAutomation, useStopAutomation } from '../../src/hooks/useAutomation';
import { ConnectInstagramModal } from '../../src/components/ConnectInstagramModal';

export default function DashboardScreen() {
  const [isConnectModalVisible, setConnectModalVisible] = useState(false);
  const { data: instagramStatus, isLoading: isInstaLoading } = useInstagramStatus();
  const { data: autoStats } = useAutomationStats();
  
  const startEngine = useStartAutomation();
  const stopEngine = useStopAutomation();

  const isConnected = instagramStatus?.connected;
  const isRunning = autoStats?.isRunning || false;
  
  // Calculate text colors based on engine state
  const statusTextColor = isRunning ? 'text-[#10B981]' : 'text-[#A1A1AA]';
  const subtitleText = isRunning ? 'Engine is curating your feed...' : 'Your feed is currently unoptimized.';

  const handleToggleEngine = () => {
    if (isRunning) {
      stopEngine.mutate();
    } else {
      startEngine.mutate();
    }
  };

  return (
    <View className="flex-1 bg-background p-lg pt-xxl">
      <View className="mb-xl">
        <Text className="text-Display font-bold text-foreground">Dashboard</Text>
        <Text className={`text-Body ${statusTextColor}`}>{subtitleText}</Text>
      </View>

      <View className="bg-surface p-lg rounded-xl border border-muted mb-md flex-row justify-between items-center">
        <View className="flex-row items-center">
          {isConnected && instagramStatus.profilePicUrl && (
            <Image 
              source={{ uri: instagramStatus.profilePicUrl }} 
              className="w-12 h-12 rounded-full mr-md"
            />
          )}
          <View>
            <Text className="text-foreground font-semibold text-H2 mb-xs">Instagram Account</Text>
            {isInstaLoading ? (
              <Text className="text-[#A1A1AA] text-Body font-medium">Checking status...</Text>
            ) : isConnected ? (
              <Text className="text-[#10B981] text-Body font-medium">Connected as {instagramStatus.username}</Text>
            ) : (
              <Text className="text-coral text-Body font-medium">Disconnected</Text>
            )}
          </View>
        </View>
        
        {!isConnected && (
          <TouchableOpacity 
            className="bg-iris-light/20 px-md py-sm rounded-lg border border-iris-light/30"
            onPress={() => setConnectModalVisible(true)}
          >
            <Text className="text-iris-light font-medium">Connect</Text>
          </TouchableOpacity>
        )}
      </View>

      <View className="flex-row gap-md">
        <View className="flex-1 bg-surface p-md rounded-xl border border-muted items-center">
          <Text className="text-[#A1A1AA] text-Caption mb-xs">Personalization</Text>
          <Text className={`font-bold text-H1 ${isRunning ? 'text-[#10B981]' : 'text-foreground'}`}>
            {autoStats?.personalizationScore || 0}%
          </Text>
        </View>
        <View className="flex-1 bg-surface p-md rounded-xl border border-muted items-center">
          <Text className="text-[#A1A1AA] text-Caption mb-xs">Actions Today</Text>
          <Text className={`font-bold text-H1 ${isRunning ? 'text-[#10B981]' : 'text-foreground'}`}>
            {autoStats?.actionsToday || 0}
          </Text>
        </View>
      </View>

      <TouchableOpacity 
        className={`mt-xl py-md rounded-lg items-center flex-row justify-center ${
          !isConnected 
            ? 'bg-surface border border-muted opacity-50'
            : isRunning 
              ? 'bg-coral' 
              : 'bg-iris'
        }`}
        disabled={!isConnected || startEngine.isPending || stopEngine.isPending}
        onPress={handleToggleEngine}
      >
        {(startEngine.isPending || stopEngine.isPending) && (
          <ActivityIndicator color="#FFFFFF" className="mr-sm" />
        )}
        <Text className={`font-semibold ${isConnected ? 'text-white' : 'text-foreground'}`}>
          {!isConnected 
            ? 'Connect Instagram to Start' 
            : startEngine.isPending 
              ? 'Starting Engine...' 
              : stopEngine.isPending
                ? 'Stopping Engine...'
                : isRunning 
                  ? 'Stop Automation Engine' 
                  : 'Start Automation Engine'}
        </Text>
      </TouchableOpacity>

      <ConnectInstagramModal 
        visible={isConnectModalVisible} 
        onClose={() => setConnectModalVisible(false)} 
      />
    </View>
  );
}
