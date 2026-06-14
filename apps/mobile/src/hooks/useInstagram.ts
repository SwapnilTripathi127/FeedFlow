import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../services/api';

export type InstagramStatus = {
  connected: boolean;
  username: string | null;
  profilePicUrl?: string;
  connectedAt?: string;
};

export function useInstagramStatus() {
  return useQuery({
    queryKey: ['instagram', 'status'],
    queryFn: async () => {
      const data = await fetchApi('/instagram/status');
      return data as InstagramStatus;
    },
  });
}

export function useConnectInstagram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const data = await fetchApi('/instagram/connect', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      return data;
    },
    onSuccess: (data) => {
      // Update the status cache directly
      if (data.success && data.account) {
        queryClient.setQueryData(['instagram', 'status'], {
          connected: true,
          username: data.account.username,
          profilePicUrl: data.account.profilePicUrl,
          connectedAt: data.account.connectedAt,
        });
      }
    },
  });
}
