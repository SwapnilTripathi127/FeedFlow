import { Router } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { supabaseAdmin } from '../config/supabase';
import { chromium } from 'playwright';
import * as crypto from 'crypto';

const router: Router = Router();

// ── helpers ──────────────────────────────────────────────────────────────────

function decrypt(text: string): string {
  const ENCRYPTION_KEY = process.env.SESSION_ENCRYPTION_KEY || 'default_secret_key_needs_32_bytes!';
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

async function getSearchQuery(userId: string): Promise<string | null> {
  const { data: prefs } = await supabaseAdmin
    .from('user_preferences')
    .select('positive_interests')
    .eq('user_id', userId)
    .single();

  // Fallback: try user_metadata
  if (!prefs?.positive_interests || prefs.positive_interests.length === 0) {
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
    const interests = userData?.user?.user_metadata?.preferences?.positiveInterests || [];
    if (interests.length === 0) return null;
    return interests[Math.floor(Math.random() * interests.length)];
  }

  const interests = prefs.positive_interests;
  return interests[Math.floor(Math.random() * interests.length)];
}

// Core automation engine — runs directly in the API process
async function runEngineForAccount(job: any) {
  const { id: jobId, instagram_account_id: accountId, user_id: userId } = job;

  console.log(`[Engine] Running job ${jobId} for account ${accountId}`);

  // Mark running
  await supabaseAdmin.from('automation_jobs')
    .update({ status: 'running', started_at: new Date().toISOString() })
    .eq('id', jobId);

  const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';

  let browser;
  try {
    // Load encrypted session
    const { data: account } = await supabaseAdmin
      .from('instagram_accounts')
      .select('encrypted_session_data, username')
      .eq('id', accountId)
      .single();

    if (!account?.encrypted_session_data) throw new Error('No session data found. Please reconnect your Instagram account.');

    const cookies = JSON.parse(decrypt(account.encrypted_session_data));

    browser = await chromium.launch({
      headless: true,
      args: ['--disable-blink-features=AutomationControlled', '--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
      userAgent: IPHONE_UA,
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      locale: 'en-US',
      timezoneId: 'America/New_York',
    });

    await context.addCookies(cookies);
    const page = await context.newPage();
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    // Verify session still valid
    await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded' });
    const isLoginPage = await page.$('input[name="username"]');
    if (isLoginPage) {
      await supabaseAdmin.from('instagram_accounts')
        .update({ session_status: 'invalid', connection_status: 'disconnected' })
        .eq('id', accountId);
      throw new Error('Instagram session expired. Please reconnect your account.');
    }

    // Get search query from user preferences
    const query = await getSearchQuery(userId);
    if (!query) {
      throw new Error('No interests set. Please add at least one interest in Preferences first.');
    }

    console.log(`[Engine] Searching for: ${query}`);

    // Navigate to hashtag explore page
    const formattedQuery = query.replace(/[^a-zA-Z0-9]/g, '');
    await page.goto(`https://www.instagram.com/explore/tags/${formattedQuery}/`, { waitUntil: 'domcontentloaded' });

    try {
      await page.waitForSelector('a[href^="/p/"]', { timeout: 10000 });
    } catch {
      throw new Error(`No posts found for topic "${query}". Try a different interest.`);
    }

    // Scroll to load more posts
    for (let i = 0; i < 3; i++) {
      await page.mouse.wheel(0, 800);
      await page.waitForTimeout(1200);
    }

    const allPosts = await page.$$eval('a[href^="/p/"]', links => [...new Set(links.map(l => l.getAttribute('href')))]);

    // Filter already-seen
    const { data: pastLogs } = await supabaseAdmin
      .from('automation_logs')
      .select('metadata->url')
      .eq('instagram_account_id', accountId)
      .not('metadata->url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(300);

    const seenUrls = new Set((pastLogs || []).map((l: any) => l.url));
    const freshPosts = allPosts.filter(href => href && !seenUrls.has(`https://www.instagram.com${href}`));
    const posts = freshPosts.sort(() => 0.5 - Math.random()).slice(0, 3);

    let likes = 0, saves = 0, skips = 0;

    for (const href of posts) {
      const postUrl = `https://www.instagram.com${href}`;
      await page.goto(postUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(Math.floor(Math.random() * 3000) + 2500);

      const rand = Math.random();
      let actionSuccess = false;

      try {
        if (rand < 0.25) {
          // Save
          const saveBtn = await page.$('svg[aria-label="Save"]');
          if (saveBtn) {
            const parent = await saveBtn.$('xpath=..');
            if (parent) await parent.dispatchEvent('click');
            saves++;
            actionSuccess = true;
          }
        } else {
          // Like
          const likeBtn = await page.$('svg[aria-label="Like"]');
          if (likeBtn) {
            const parent = await likeBtn.$('xpath=..');
            if (parent) await parent.dispatchEvent('click');
            likes++;
            actionSuccess = true;
          }
        }
      } catch (e) { /* silent */ }

      const action = actionSuccess ? (saves > likes ? 'save' : 'like') : 'skip';
      if (!actionSuccess) skips++;

      await supabaseAdmin.from('automation_logs').insert({
        job_id: jobId,
        instagram_account_id: accountId,
        level: 'info',
        message: actionSuccess
          ? `${action === 'like' ? 'Liked' : 'Saved'} a post matching "${query}"`
          : `Analyzed & skipped a post matching "${query}"`,
        metadata: { topic: query, action, url: postUrl }
      });

      if (actionSuccess) await page.waitForTimeout(2500);
    }

    await browser.close();

    // Record analytics
    const { data: existing } = await supabaseAdmin
      .from('analytics')
      .select('likes_count, saves_count, skips_count, actions_today, personalization_score')
      .eq('instagram_account_id', accountId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    const base = existing || { likes_count: 0, saves_count: 0, skips_count: 0, actions_today: 0, personalization_score: 0 };
    const newScore = Math.min(100, Math.round((base.personalization_score || 0) + (likes + saves) * 2));

    await supabaseAdmin.from('analytics').insert({
      instagram_account_id: accountId,
      likes_count: (base.likes_count || 0) + likes,
      saves_count: (base.saves_count || 0) + saves,
      skips_count: (base.skips_count || 0) + skips,
      actions_today: (base.actions_today || 0) + likes + saves + skips,
      personalization_score: newScore,
      timestamp: new Date().toISOString()
    });

    // Mark job done
    await supabaseAdmin.from('automation_jobs')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', jobId);

    // Schedule next run (2–4 hours from now)
    const delayHours = Math.floor(Math.random() * 3) + 2;
    const nextRun = new Date();
    nextRun.setHours(nextRun.getHours() + delayHours);
    await supabaseAdmin.from('automation_jobs').insert({
      user_id: userId,
      instagram_account_id: accountId,
      status: 'pending',
      action_type: 'engagement',
      scheduled_at: nextRun.toISOString()
    });

    console.log(`[Engine] Job ${jobId} complete. Liked: ${likes}, Saved: ${saves}, Skipped: ${skips}`);
  } catch (error: any) {
    if (browser) await browser.close().catch(() => {});
    console.error(`[Engine] Job ${jobId} failed:`, error.message);
    await supabaseAdmin.from('automation_jobs')
      .update({ status: 'failed', error_message: error.message, completed_at: new Date().toISOString() })
      .eq('id', jobId);

    await supabaseAdmin.from('automation_logs').insert({
      job_id: jobId,
      instagram_account_id: accountId,
      level: 'error',
      message: `Automation failed: ${error.message}`,
      metadata: {}
    });
  }
}

// Background poller — picks up any pending jobs that are due
const runningJobs = new Set<string>();

async function pollAndRun() {
  const { data: jobs } = await supabaseAdmin
    .from('automation_jobs')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_at', new Date().toISOString())
    .limit(3);

  for (const job of jobs || []) {
    if (!runningJobs.has(job.id)) {
      runningJobs.add(job.id);
      runEngineForAccount(job).finally(() => runningJobs.delete(job.id));
    }
  }
}

// Poll every 60 seconds within the API process
setInterval(pollAndRun, 60_000);
pollAndRun(); // run once at startup

// ── Routes ────────────────────────────────────────────────────────────────────

router.get('/stats', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    const { data: account } = await supabaseAdmin
      .from('instagram_accounts')
      .select('id')
      .eq('user_id', userId)
      .eq('connection_status', 'connected')
      .single();

    if (!account) {
      return res.json({ isRunning: false, personalizationScore: 0, actionsToday: 0 });
    }

    const { data: activeJobs } = await supabaseAdmin
      .from('automation_jobs')
      .select('id, status')
      .eq('instagram_account_id', account.id)
      .in('status', ['pending', 'running']);

    const isRunning = activeJobs && activeJobs.length > 0;
    const isExecuting = activeJobs?.some(job => job.status === 'running') || false;

    // Next scheduled run
    const { data: nextJob } = await supabaseAdmin
      .from('automation_jobs')
      .select('scheduled_at, status')
      .eq('instagram_account_id', account.id)
      .eq('status', 'pending')
      .order('scheduled_at', { ascending: true })
      .limit(1)
      .single();

    const { count: totalRuns } = await supabaseAdmin
      .from('automation_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('instagram_account_id', account.id)
      .eq('status', 'completed');

    const { data: analytics } = await supabaseAdmin
      .from('analytics')
      .select('*')
      .eq('instagram_account_id', account.id)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    const { data: logs } = await supabaseAdmin
      .from('automation_logs')
      .select('message, metadata, created_at')
      .eq('instagram_account_id', account.id)
      .order('created_at', { ascending: false })
      .limit(200);

    const recentLogs = (logs || []).slice(0, 10).map((log: any) => ({
      message: log.message,
      timestamp: log.created_at
    }));

    const topicCounts: Record<string, number> = {};
    let totalTopicLikes = 0;
    (logs || []).forEach((log: any) => {
      const topic = log.metadata?.topic;
      const action = log.metadata?.action;
      if (topic && action === 'like') {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
        totalTopicLikes++;
      }
    });

    const topPreferences = Object.entries(topicCounts)
      .map(([name, count]) => ({ name, percent: Math.round((count / totalTopicLikes) * 100) }))
      .sort((a, b) => b.percent - a.percent);

    res.json({
      isRunning,
      isExecuting,
      personalizationScore: analytics?.personalization_score || 0,
      actionsToday: analytics?.actions_today || 0,
      totalRuns: totalRuns || 0,
      postsAnalyzed: (analytics?.likes_count || 0) + (analytics?.skips_count || 0),
      totalActionsTaken: analytics?.actions_today || 0,
      nextRunAt: nextJob?.scheduled_at || null,
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

    const { data: account } = await supabaseAdmin
      .from('instagram_accounts')
      .select('id')
      .eq('user_id', userId)
      .eq('connection_status', 'connected')
      .single();

    if (!account) {
      return res.status(400).json({ error: 'Please connect an Instagram account first.' });
    }

    const { data: activeJobs } = await supabaseAdmin
      .from('automation_jobs')
      .select('id')
      .eq('instagram_account_id', account.id)
      .in('status', ['pending', 'running']);

    if (activeJobs && activeJobs.length > 0) {
      return res.json({ success: true, message: 'Engine already running' });
    }

    const { data: newJob, error: insertError } = await supabaseAdmin
      .from('automation_jobs')
      .insert({
        user_id: userId,
        instagram_account_id: account.id,
        status: 'pending',
        action_type: 'engagement',
        scheduled_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError || !newJob) {
      return res.status(500).json({ error: 'Failed to create job: ' + insertError?.message });
    }

    // Fire-and-forget — run engine immediately in background
    runEngineForAccount(newJob).catch(console.error);

    res.json({ success: true, state: { isRunning: true, personalizationScore: 0, actionsToday: 0 } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /automation/run-now — immediately trigger a new job regardless of schedule
router.post('/run-now', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    const { data: account } = await supabaseAdmin
      .from('instagram_accounts')
      .select('id')
      .eq('user_id', userId)
      .eq('connection_status', 'connected')
      .single();

    if (!account) {
      return res.status(400).json({ error: 'Please connect an Instagram account first.' });
    }

    // Cancel any existing pending jobs first, then create a fresh one
    await supabaseAdmin.from('automation_jobs')
      .update({ status: 'failed', error_message: 'Superseded by Run Now', completed_at: new Date().toISOString() })
      .eq('instagram_account_id', account.id)
      .in('status', ['pending']);

    const { data: newJob, error: insertError } = await supabaseAdmin
      .from('automation_jobs')
      .insert({
        user_id: userId,
        instagram_account_id: account.id,
        status: 'pending',
        action_type: 'engagement',
        scheduled_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError || !newJob) {
      return res.status(500).json({ error: 'Failed to create job: ' + insertError?.message });
    }

    // Fire-and-forget
    runEngineForAccount(newJob).catch(console.error);

    res.json({ success: true, message: 'Running now!' });
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
      await supabaseAdmin.from('automation_jobs')
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
