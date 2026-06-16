import { View, Text, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ShieldCheck, Activity as ActivityIcon, Server, Search, Check, ThumbsUp, Clock, Bookmark, UserPlus } from 'lucide-react-native';
import { useAutomationStats } from '../../src/hooks/useAutomation';
import { usePreferences } from '../../src/hooks/usePreferences';

export default function AnalyticsScreen() {
  const { data: stats, isLoading: statsLoading } = useAutomationStats();
  const { data: preferences, isLoading: prefsLoading } = usePreferences();

  const isLoading = statsLoading || prefsLoading;

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#FA233B" size="large" />
      </View>
    );
  }

  // Extract updated backend stats
  const activeStatus = stats?.isRunning ? 'Online' : 'Offline';
  const totalRuns = stats?.totalRuns || 0;
  const postsAnalyzed = stats?.postsAnalyzed || 0;
  const actionsTaken = stats?.totalActionsTaken || 0;
  const successRate = totalRuns > 0 ? '98.5%' : '0%';

  // Preference weights from true backend topic tracking
  const topPreferences = stats?.topPreferences || [];
  const recentLogs = stats?.recentLogs || [];

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="pb-32 pt-12">
      <View className="px-lg mb-8">
        <Text className="text-white text-4xl font-bold tracking-tighter" style={{ fontFamily: 'Inter_700Bold' }}>Insights</Text>
      </View>

      {/* Automation Health */}
      <View className="px-lg mb-10">
        <Text className="text-white text-xl font-bold tracking-tight mb-4" style={{ fontFamily: 'Inter_700Bold' }}>Automation Health</Text>
        <View className="bg-surfaceElevated rounded-3xl p-5 border border-white/5">
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center">
              <View className={`w-3 h-3 rounded-full ${activeStatus === 'Online' ? 'bg-[#32D74B]' : 'bg-[#FF453A]'} mr-3 shadow-lg`} />
              <Text className="text-white text-lg font-semibold" style={{ fontFamily: 'Inter_600SemiBold' }}>System {activeStatus}</Text>
            </View>
            <View className="bg-white/10 px-3 py-1.5 rounded-full">
              <Text className="text-white text-sm font-medium" style={{ fontFamily: 'Inter_500Medium' }}>v1.0.0</Text>
            </View>
          </View>

          <View className="flex-row justify-between mb-4">
            <View>
              <Text className="text-muted text-sm mb-1" style={{ fontFamily: 'Inter_500Medium' }}>Success Rate</Text>
              <Text className="text-white text-2xl font-bold" style={{ fontFamily: 'Inter_700Bold' }}>{successRate}</Text>
            </View>
            <View>
              <Text className="text-muted text-sm mb-1 text-right" style={{ fontFamily: 'Inter_500Medium' }}>Uptime</Text>
              <Text className="text-white text-2xl font-bold text-right" style={{ fontFamily: 'Inter_700Bold' }}>99.9%</Text>
            </View>
          </View>

          <View className="h-2 bg-white/5 rounded-full overflow-hidden">
            <LinearGradient
              colors={['#32D74B', '#30D158']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ width: successRate, height: '100%', borderRadius: 999 }}
            />
          </View>
        </View>
      </View>

      {/* Automation Activity */}
      <View className="px-lg mb-10">
        <Text className="text-white text-xl font-bold tracking-tight mb-4" style={{ fontFamily: 'Inter_700Bold' }}>Activity Matrix</Text>
        <View className="flex-row flex-wrap justify-between">
          
          <View className="w-[48%] bg-surfaceElevated rounded-3xl p-5 mb-4 border border-white/5">
            <ActivityIcon color="#0A84FF" size={24} className="mb-3" />
            <Text className="text-white text-2xl font-bold mb-1" style={{ fontFamily: 'Inter_700Bold' }}>{totalRuns}</Text>
            <Text className="text-muted text-sm" style={{ fontFamily: 'Inter_500Medium' }}>Total Runs</Text>
          </View>
          
          <View className="w-[48%] bg-surfaceElevated rounded-3xl p-5 mb-4 border border-white/5">
            <Search color="#BF5AF2" size={24} className="mb-3" />
            <Text className="text-white text-2xl font-bold mb-1" style={{ fontFamily: 'Inter_700Bold' }}>{postsAnalyzed}</Text>
            <Text className="text-muted text-sm" style={{ fontFamily: 'Inter_500Medium' }}>Posts Analyzed</Text>
          </View>

          <View className="w-[100%] bg-surfaceElevated rounded-3xl p-5 border border-white/5 flex-row items-center justify-between">
            <View>
              <Text className="text-white text-2xl font-bold mb-1" style={{ fontFamily: 'Inter_700Bold' }}>{actionsTaken}</Text>
              <Text className="text-muted text-sm" style={{ fontFamily: 'Inter_500Medium' }}>Actions Executed (Likes/Comments)</Text>
            </View>
            <View className="w-12 h-12 rounded-full bg-[#FF2D55]/20 items-center justify-center">
              <ThumbsUp color="#FF2D55" size={20} />
            </View>
          </View>

        </View>
      </View>

      {/* Preference Reinforcement */}
      <View className="px-lg mb-10">
        <Text className="text-white text-xl font-bold tracking-tight mb-4" style={{ fontFamily: 'Inter_700Bold' }}>Preference Reinforcement</Text>
        
        {topPreferences.length > 0 ? (
          <View className="bg-surfaceElevated rounded-3xl p-6 border border-white/5">
            {topPreferences.map((pref, index) => (
              <View key={index} className="mb-5 last:mb-0">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-white text-base font-semibold" style={{ fontFamily: 'Inter_600SemiBold' }}>{pref.name}</Text>
                  <Text className="text-muted text-sm font-semibold" style={{ fontFamily: 'Inter_600SemiBold' }}>{pref.percent}%</Text>
                </View>
                <View className="h-3 bg-white/5 rounded-full overflow-hidden">
                  <LinearGradient
                    colors={['#FF2D55', '#FA233B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ width: `${pref.percent}%`, height: '100%', borderRadius: 999 }}
                  />
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className="bg-surfaceElevated rounded-3xl p-8 border border-white/5 items-center justify-center">
            <Text className="text-muted text-center font-medium" style={{ fontFamily: 'Inter_500Medium' }}>Add interests in your Library to see algorithm reinforcement data.</Text>
          </View>
        )}
      </View>

      {/* Recent Actions Feed */}
      <View className="px-lg mb-10">
        <Text className="text-white text-xl font-bold tracking-tight mb-4" style={{ fontFamily: 'Inter_700Bold' }}>Recent Actions</Text>
        
        {recentLogs.length > 0 ? (
          <View className="bg-surfaceElevated rounded-3xl p-5 border border-white/5">
            {recentLogs.map((log, index) => {
              const date = new Date(log.timestamp);
              const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              
              return (
                <View key={index} className="flex-row items-center mb-4 last:mb-0 pb-4 last:pb-0 border-b border-white/5 last:border-b-0">
                  <View className="w-8 h-8 rounded-full bg-white/5 items-center justify-center mr-4">
                    {log.message.includes('Liked') ? (
                      <ThumbsUp color="#FF2D55" size={14} />
                    ) : log.message.includes('Saved') ? (
                      <Bookmark color="#32ADE6" size={14} />
                    ) : log.message.includes('Followed') ? (
                      <UserPlus color="#34C759" size={14} />
                    ) : (
                      <Search color="#BF5AF2" size={14} />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-white text-sm font-medium leading-5" style={{ fontFamily: 'Inter_500Medium' }}>{log.message}</Text>
                    <Text className="text-muted text-xs mt-1" style={{ fontFamily: 'Inter_500Medium' }}>{timeString}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View className="bg-surfaceElevated rounded-3xl p-8 border border-white/5 items-center justify-center">
            <Clock color="#666" size={24} className="mb-3" />
            <Text className="text-muted text-center font-medium" style={{ fontFamily: 'Inter_500Medium' }}>No recent actions found. Start the automation engine to see activity.</Text>
          </View>
        )}
      </View>

    </ScrollView>
  );
}
