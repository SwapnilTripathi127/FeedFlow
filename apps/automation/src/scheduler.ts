import { supabaseAdmin } from './config/supabase';

export async function scheduleNextJob(userId: string, accountId: string) {
  // Calculate next run time: 2 to 4 hours from now
  const delayHours = Math.floor(Math.random() * 3) + 2;
  const nextRun = new Date();
  nextRun.setHours(nextRun.getHours() + delayHours);

  const { error } = await supabaseAdmin
    .from('automation_jobs')
    .insert({
      user_id: userId,
      instagram_account_id: accountId,
      status: 'pending',
      action_type: 'engagement',
      scheduled_at: nextRun.toISOString()
    });

  if (error) {
    console.error(`[Scheduler] Failed to schedule next job for ${accountId}:`, error.message);
  } else {
    console.log(`[Scheduler] Scheduled next job for ${accountId} at ${nextRun.toISOString()}`);
  }
}

export async function markJobComplete(jobId: string) {
  await supabaseAdmin
    .from('automation_jobs')
    .update({ 
      status: 'completed', 
      completed_at: new Date().toISOString() 
    })
    .eq('id', jobId);
}

export async function markJobFailed(jobId: string, errorMessage: string) {
  await supabaseAdmin
    .from('automation_jobs')
    .update({ 
      status: 'failed', 
      completed_at: new Date().toISOString(),
      error_message: errorMessage
    })
    .eq('id', jobId);
}
