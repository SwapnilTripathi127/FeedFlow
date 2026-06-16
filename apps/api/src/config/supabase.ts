import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

import WebSocket from 'ws';

dotenv.config({ path: '../../.env' });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Missing Supabase environment variables in API configuration.');
}

// Admin client for backend operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    WebSocket,
  },
});
