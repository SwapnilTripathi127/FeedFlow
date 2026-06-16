import { supabaseAdmin } from './config/supabase';
import { InstagramClient } from './instagram-client';
import { getNextSearchQuery } from './search-engine';
import { scheduleNextJob, markJobComplete, markJobFailed } from './scheduler';

export async function executeJob(job: any) {
  console.log(`[JobRunner] Starting job ${job.id} for account ${job.instagram_account_id}`);
  
  // Mark job as running
  await supabaseAdmin
    .from('automation_jobs')
    .update({ status: 'running', started_at: new Date().toISOString() })
    .eq('id', job.id);

  const client = new InstagramClient(job.instagram_account_id, job.user_id, job.id);
  
  try {
    const isHeadless = process.env.AUTOMATION_HEADLESS === 'true';
    const isValid = await client.initialize(isHeadless);
    if (!isValid) {
      throw new Error('Session invalid or expired. User needs to reconnect.');
    }

    const query = await getNextSearchQuery(job.user_id);
    if (!query) {
      console.log(`[JobRunner] No positive interests set for user ${job.user_id}. Skipping search.`);
    } else {
      await client.performCuratedSearch(query, 3);
    }

    await markJobComplete(job.id);
    
    // Schedule the next run for this account
    await scheduleNextJob(job.user_id, job.instagram_account_id);

  } catch (error: any) {
    console.error(`[JobRunner] Job ${job.id} failed:`, error.message);
    await markJobFailed(job.id, error.message);
  } finally {
    await client.close();
  }
}
