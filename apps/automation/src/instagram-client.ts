import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { loadSession, saveSession, invalidateSession } from './session-manager';
import { recordAnalytics } from './analytics';
import { supabaseAdmin } from './config/supabase';

export class InstagramClient {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;

  constructor(
    private accountId: string,
    private userId: string,
    private jobId: string
  ) {}

  async initialize(headless = true): Promise<boolean> {
    this.browser = await chromium.launch({ headless });
    this.context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    // Try restoring session
    const cookies = await loadSession(this.accountId);
    if (cookies && cookies.length > 0) {
      await this.context.addCookies(cookies);
      console.log(`[InstagramClient] Restored session for account ${this.accountId}`);
    }

    this.page = await this.context.newPage();
    
    // Check if session is actually valid
    await this.page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded' });
    
    // Wait to see if login form appears or home feed appears
    try {
      // If we see the home icon or avatar, we are logged in
      await this.page.waitForSelector('svg[aria-label="Home"]', { timeout: 5000 });
      return true; // Successfully restored and valid
    } catch (e) {
      console.log(`[InstagramClient] Session invalid or not found. Needs login.`);
      return false; // Needs fresh login
    }
  }

  async login(username: string, password: string):Promise<boolean> {
    if (!this.page || !this.context) throw new Error('Client not initialized');

    await this.page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded' });
    
    try {
      await this.page.waitForSelector('input[name="username"]', { timeout: 5000 });
      await this.page.fill('input[name="username"]', username);
      await this.page.fill('input[name="password"]', password);
      
      // Click login
      await this.page.click('button[type="submit"]');
      
      // Wait for navigation / home feed
      await this.page.waitForSelector('svg[aria-label="Home"]', { timeout: 15000 });
      
      // Successfully logged in! Save cookies.
      const cookies = await this.context.cookies();
      await saveSession(this.accountId, cookies);
      console.log(`[InstagramClient] Successfully logged in and saved session for ${username}`);
      return true;
    } catch (e) {
      console.error(`[InstagramClient] Login failed for ${username}:`, e);
      await invalidateSession(this.accountId);
      return false;
    }
  }

  async performCuratedSearch(query: string, maxPosts = 3) {
    if (!this.page) throw new Error('Client not initialized');
    
    console.log(`[InstagramClient] Searching for ${query}`);
    // Navigate to explore tag
    const formattedQuery = query.replace(/[^a-zA-Z0-9]/g, '');
    await this.page.goto(`https://www.instagram.com/explore/tags/${formattedQuery}/`, { waitUntil: 'domcontentloaded' });

    // Wait for posts to load
    try {
      await this.page.waitForSelector('a[href^="/p/"]', { timeout: 10000 });
    } catch (e) {
      console.log(`[InstagramClient] No posts found for ${query}`);
      return;
    }

    // Scroll down a few times to load a larger pool of posts
    for (let i = 0; i < 4; i++) {
      await this.page.mouse.wheel(0, 1000);
      await this.page.waitForTimeout(1500);
    }

    // Get a large pool of post links
    const allPosts = await this.page.$$eval('a[href^="/p/"]', links => links.map(l => l.getAttribute('href')));
    
    // Query database to see which URLs we have ALREADY interacted with
    const { data: pastLogs } = await supabaseAdmin
      .from('automation_logs')
      .select('metadata->>url')
      .eq('instagram_account_id', this.accountId)
      .not('metadata->>url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(200);
      
    // Filter out already seen posts
    const seenUrls = new Set((pastLogs || []).map(log => log.url));
    const freshPosts = allPosts.filter(href => {
      const fullUrl = `https://www.instagram.com${href}`;
      return !seenUrls.has(fullUrl);
    });

    // Shuffle the fresh posts and pick the top `maxPosts`
    const shuffledPosts = freshPosts.sort(() => 0.5 - Math.random());
    const posts = shuffledPosts.slice(0, maxPosts);
    
    if (posts.length === 0) {
      console.log(`[InstagramClient] All posts on the first page have already been interacted with!`);
      return;
    }
    
    // Query database to see how many times we've followed for this specific topic
    const { count: followsCount } = await supabaseAdmin
      .from('automation_logs')
      .select('*', { count: 'exact', head: true })
      .eq('instagram_account_id', this.accountId)
      .eq('metadata->>action', 'follow')
      .eq('metadata->>topic', query);
      
    const currentFollowsForTopic = followsCount || 0;
    
    let likes = 0;
    let saves = 0;
    let follows = 0;
    let skips = 0;

    for (let i = 0; i < Math.min(maxPosts, posts.length); i++) {
      const postUrl = `https://www.instagram.com${posts[i]}`;
      await this.page.goto(postUrl, { waitUntil: 'domcontentloaded' });
      
      // Simulate human viewing time
      const viewTime = Math.floor(Math.random() * 4000) + 3000;
      await this.page.waitForTimeout(viewTime);

      // Determine action based on random chance and follow limit
      let actionToTake = 'like';
      const rand = Math.random();
      
      if (currentFollowsForTopic + follows < 5) {
        if (rand < 0.2) actionToTake = 'follow';
        else if (rand < 0.4) actionToTake = 'save';
      } else {
        if (rand < 0.25) actionToTake = 'save';
      }

      // Attempt the action
      try {
        let actionSuccess = false;
        
        if (actionToTake === 'follow') {
          // Instagram follow button on post header usually has text "Follow"
          const followBtn = await this.page.$('button:has-text("Follow")');
          if (followBtn) {
            await followBtn.click();
            follows++;
            actionSuccess = true;
            console.log(`[InstagramClient] Followed account from post ${postUrl}`);
            await supabaseAdmin.from('automation_logs').insert({
              job_id: this.jobId,
              instagram_account_id: this.accountId,
              level: 'info',
              message: `Followed an account matching "${query}"`,
              metadata: { topic: query, action: 'follow', url: postUrl }
            });
          }
        } else if (actionToTake === 'save') {
          const saveBtn = await this.page.$('svg[aria-label="Save"]');
          if (saveBtn) {
            const parentBtn = await saveBtn.$('xpath=..');
            if (parentBtn) await parentBtn.dispatchEvent('click').catch(() => {});
            else await saveBtn.dispatchEvent('click').catch(() => {});
            saves++;
            actionSuccess = true;
            console.log(`[InstagramClient] Saved post ${postUrl}`);
            await supabaseAdmin.from('automation_logs').insert({
              job_id: this.jobId,
              instagram_account_id: this.accountId,
              level: 'info',
              message: `Saved post matching "${query}"`,
              metadata: { topic: query, action: 'save', url: postUrl }
            });
          }
        } else {
          // Default to like
          const likeButton = await this.page.$('svg[aria-label="Like"][height="24"]');
          if (likeButton) {
            const parentBtn = await likeButton.$('xpath=..');
            if (parentBtn) await parentBtn.dispatchEvent('click').catch(() => {});
            else await likeButton.dispatchEvent('click').catch(() => {});
            likes++;
            actionSuccess = true;
            console.log(`[InstagramClient] Liked post ${postUrl}`);
            await supabaseAdmin.from('automation_logs').insert({
              job_id: this.jobId,
              instagram_account_id: this.accountId,
              level: 'info',
              message: `Liked post matching "${query}"`,
              metadata: { topic: query, action: 'like', url: postUrl }
            });
          }
        }
        
        if (actionSuccess) {
          await this.page.waitForTimeout(3000);
        } else {
          skips++;
          await supabaseAdmin.from('automation_logs').insert({
            job_id: this.jobId,
            instagram_account_id: this.accountId,
            level: 'info',
            message: `Analyzed & skipped post matching "${query}"`,
            metadata: { topic: query, action: 'skip', url: postUrl }
          });
        }
      } catch (e) {
        console.error(`[InstagramClient] Action failed for ${postUrl}:`, e);
        skips++;
      }
    }

    // Record the analytics
    await recordAnalytics(this.userId, this.accountId, {
      likesCount: likes,
      savesCount: saves,
      followsCount: follows,
      skipsCount: skips,
      actionsToday: likes + saves + follows + skips
    });
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}
