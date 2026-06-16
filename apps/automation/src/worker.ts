import { supabaseAdmin } from './config/supabase';
import { executeJob } from './job-runner';

const POLL_INTERVAL = 30000; // 30 seconds

async function pollJobs() {
  console.log(`[Worker] Polling for pending jobs...`);
  
  const { data: jobs, error } = await supabaseAdmin
    .from('automation_jobs')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_at', new Date().toISOString())
    .limit(5);

  if (error) {
    console.error(`[Worker] Error polling jobs:`, error.message);
    return;
  }

  if (jobs && jobs.length > 0) {
    console.log(`[Worker] Found ${jobs.length} pending jobs to execute.`);
    for (const job of jobs) {
      await executeJob(job);
    }
  }
}

async function startWorker() {
  console.log(`[Worker] Started FeedFlow Automation Worker Engine`);
  // Run once immediately
  await pollJobs();

  // Then loop
  setInterval(async () => {
    await pollJobs();
  }, POLL_INTERVAL);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('[Worker] Shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('[Worker] Shutting down...');
  process.exit(0);
});

startWorker().catch(err => {
  console.error('[Worker] Fatal error:', err);
  process.exit(1);
});
