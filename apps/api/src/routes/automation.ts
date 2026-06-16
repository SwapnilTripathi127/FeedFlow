import { Router } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { supabaseAdmin } from '../config/supabase';

const router: Router = Router();

router.get('/stats', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    
    // Get user's active instagram account
    const { data: account } = await supabaseAdmin
      .from('instagram_accounts')
      .select('id')
      .eq('user_id', userId)
      .eq('connection_status', 'connected')
      .single();

    if (!account) {
      return res.json({ isRunning: false, personalizationScore: 0, actionsToday: 0 });
    }

    // Check if there are pending or running jobs
    const { data: activeJobs } = await supabaseAdmin
      .from('automation_jobs')
      .select('id')
      .eq('instagram_account_id', account.id)
      .in('status', ['pending', 'running'])
      .limit(1);

    const isRunning = activeJobs && activeJobs.length > 0;

    // Get total runs
    const { count: totalRuns } = await supabaseAdmin
      .from('automation_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('instagram_account_id', account.id)
      .eq('status', 'completed');

    // Get latest analytics
    const { data: analytics } = await supabaseAdmin
      .from('analytics')
      .select('*')
      .eq('instagram_account_id', account.id)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    // Fetch recent automation logs to calculate true percentages and recent actions
    const { data: logs } = await supabaseAdmin
      .from('automation_logs')
      .select('message, metadata, created_at')
      .eq('instagram_account_id', account.id)
      .order('created_at', { ascending: false })
      .limit(200);

    const recentLogs = (logs || []).slice(0, 10).map(log => ({
      message: log.message,
      timestamp: log.created_at
    }));

    const topicCounts: Record<string, number> = {};
    let totalTopicLikes = 0;

    (logs || []).forEach(log => {
      const topic = log.metadata?.topic;
      const action = log.metadata?.action;
      if (topic && action === 'like') {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
        totalTopicLikes++;
      }
    });

    const topPreferences = Object.entries(topicCounts)
      .map(([name, count]) => ({
        name,
        percent: Math.round((count / totalTopicLikes) * 100)
      }))
      .sort((a, b) => b.percent - a.percent);

    res.json({
      isRunning,
      personalizationScore: analytics?.personalization_score || 0,
      actionsToday: analytics?.actions_today || 0,
      totalRuns: totalRuns || 0,
      postsAnalyzed: (analytics?.likes_count || 0) + (analytics?.skips_count || 0),
      totalActionsTaken: analytics?.actions_today || 0,
      topPreferences,
      recentLogs
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/start', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    // Get active account
    const { data: account } = await supabaseAdmin
      .from('instagram_accounts')
      .select('id')
      .eq('user_id', userId)
      .eq('connection_status', 'connected')
      .single();

    if (!account) {
      return res.status(400).json({ error: 'Please connect an Instagram account first.' });
    }

    // Check if already running
    const { data: activeJobs } = await supabaseAdmin
      .from('automation_jobs')
      .select('id')
      .eq('instagram_account_id', account.id)
      .in('status', ['pending', 'running']);

    if (activeJobs && activeJobs.length > 0) {
      return res.json({ success: true, message: 'Engine already running' });
    }

    // Insert new pending job instantly for worker to pick up
    const { error: insertError } = await supabaseAdmin
      .from('automation_jobs')
      .insert({
        user_id: userId,
        instagram_account_id: account.id,
        status: 'pending',
        action_type: 'engagement',
        scheduled_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Failed to insert job:', insertError);
      return res.status(500).json({ error: 'Failed to start automation: ' + insertError.message });
    }

    // Get stats
    const { data: analytics } = await supabaseAdmin
      .from('analytics')
      .select('personalization_score, actions_today')
      .eq('instagram_account_id', account.id)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    res.json({
      success: true,
      state: {
        isRunning: true,
        personalizationScore: analytics?.personalization_score || 0,
        actionsToday: analytics?.actions_today || 0
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/stop', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    const { data: account } = await supabaseAdmin
      .from('instagram_accounts')
      .select('id')
      .eq('user_id', userId)
      .eq('connection_status', 'connected')
      .single();

    if (account) {
      // Mark pending jobs as failed (stopped)
      await supabaseAdmin
        .from('automation_jobs')
        .update({ status: 'failed', error_message: 'Stopped by user', completed_at: new Date().toISOString() })
        .eq('instagram_account_id', account.id)
        .in('status', ['pending', 'running']);
      
      const { data: analytics } = await supabaseAdmin
        .from('analytics')
        .select('personalization_score, actions_today')
        .eq('instagram_account_id', account.id)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      return res.json({
        success: true,
        state: {
          isRunning: false,
          personalizationScore: analytics?.personalization_score || 0,
          actionsToday: analytics?.actions_today || 0
        }
      });
    }

    res.json({ success: true, state: { isRunning: false, personalizationScore: 0, actionsToday: 0 } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
