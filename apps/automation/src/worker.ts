import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

console.log('FeedFlow Automation Worker Started');
console.log('Polling for jobs...');

// Placeholder for worker logic
// This will connect to Supabase, query `automation_jobs` table
// and launch Playwright based on the actionType.
