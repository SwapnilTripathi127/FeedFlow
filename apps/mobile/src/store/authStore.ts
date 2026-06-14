import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

interface AuthState {
  session: Session | null;
  user: User | null;
  isInitialized: boolean;
  isDemoMode: boolean;
  setSession: (session: Session | null) => void;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
  signInDemo: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isInitialized: false,
  isDemoMode: false,
  setSession: (session) => set({ session, user: session?.user || null }),
  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    set({ session, user: session?.user || null, isInitialized: true });

    supabase.auth.onAuthStateChange((_event, newSession) => {
      set({ session: newSession, user: newSession?.user || null });
    });
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, isDemoMode: false });
  },
  signInDemo: () => {
    // Inject a fake session so the layout doesn't bounce the user back to login
    set({ 
      isDemoMode: true,
      session: { access_token: 'demo', token_type: 'bearer', user: { id: 'demo' } } as any,
      user: { id: 'demo' } as any
    });
  }
}));
