import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // React Native needs async storage for persistence in a real app,
    // but for web/demonstrable MVP we'll use localStorage fallback provided by default
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
