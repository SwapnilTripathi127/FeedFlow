import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://kuqsvlcjkusqowmpcowo.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1cXN2bGNqa3VzcW93bXBjb3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MzI2OTEsImV4cCI6MjA5NzEwODY5MX0.eI8ISe9livmVEliV6928vY8-z7aQ_pbx7c72lEqqgSc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // React Native needs async storage for persistence in a real app,
    // but for web/demonstrable MVP we'll use localStorage fallback provided by default
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
