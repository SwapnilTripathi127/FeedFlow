import { useAuthStore } from '../store/authStore';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const session = useAuthStore.getState().session;
  
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'An error occurred while fetching data');
  }

  return response.json();
};
