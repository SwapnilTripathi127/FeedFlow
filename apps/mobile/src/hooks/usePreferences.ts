import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../services/api';
import { Preferences } from '@feedflow/shared';

export const usePreferences = () => {
  return useQuery<Preferences>({
    queryKey: ['preferences'],
    queryFn: () => fetchApi('/preferences')
  });
};

export const useUpdatePreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newPreferences: Partial<Preferences>) => {
      return fetchApi('/preferences', {
        method: 'PUT',
        body: JSON.stringify(newPreferences),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
    },
  });
};
