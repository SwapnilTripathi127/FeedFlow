import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../services/api';

export type AutomationStats = {
  isRunning: boolean;
  personalizationScore: number;
  actionsToday: number;
  totalRuns: number;
  postsAnalyzed: number;
  totalActionsTaken: number;
  topPreferences?: { name: string; percent: number }[];
  recentLogs?: { message: string; timestamp: string }[];
};

export function useAutomationStats() {
  return useQuery({
    queryKey: ['automation', 'stats'],
    queryFn: async () => {
      const data = await fetchApi('/automation/stats');
      return data as AutomationStats;
    },
    // Poll every 3 seconds to get live updates
    refetchInterval: 3000,
  });
}

export function useStartAutomation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const data = await fetchApi('/automation/start', { method: 'POST' });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation', 'stats'] });
    },
  });
}

export function useStopAutomation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const data = await fetchApi('/automation/stop', { method: 'POST' });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation', 'stats'] });
    },
  });
}
