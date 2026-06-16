import { Router } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { supabaseAdmin } from '../config/supabase';
import { chromium } from 'playwright';
import * as crypto from 'crypto';

const router: Router = Router();

// Helper to encrypt a session payload
function encryptSession(data: object): string {
  const ENCRYPTION_KEY = process.env.SESSION_ENCRYPTION_KEY || 'default_secret_key_needs_32_bytes!';
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(JSON.stringify(data));
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// GET /instagram/status
// Check if the user is connected to Instagram
router.get('/status', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { data: account } = await supabaseAdmin
      .from('instagram_accounts')
      .select('username, connection_status')
      .eq('user_id', userId)
      .eq('connection_status', 'connected')
      .single();

    if (account) {
      return res.json({ connected: true, username: account.username });
    }
    return res.json({ connected: false, username: null });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /instagram/disconnect
// Disconnect the user's Instagram account
router.delete('/disconnect', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    await supabaseAdmin
      .from('instagram_accounts')
      .update({
        connection_status: 'disconnected',
        session_status: 'invalid',
        encrypted_session_data: null
      })
      .eq('user_id', userId);
      
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /instagram/login
// Triggers a Playwright iPhone-emulated login on the backend.
// The browser masquerades as an iPhone 15 Pro, which Instagram trusts.
router.post('/login', async (req: AuthenticatedRequest, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const userId = req.user!.id;
  if (userId === 'demo-user') {
    return res.status(400).json({ error: 'Demo Mode: Cannot connect real Instagram accounts.' });
  }

  const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';

  let browser;
  try {
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
      extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' }
    });

    const page = await context.newPage();
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[name="username"]', { timeout: 15000 });

    await page.click('input[name="username"]');
    await page.waitForTimeout(600);
    await page.type('input[name="username"]', username.replace('@', ''), { delay: 80 });
    await page.waitForTimeout(500);
    await page.click('input[name="password"]');
    await page.waitForTimeout(400);
    await page.type('input[name="password"]', password, { delay: 90 });
    await page.waitForTimeout(800);
    await page.click('button[type="submit"]');

    // Wait for redirect away from login page
    await page.waitForURL(/instagram\.com\/(accounts\/onetap|\/?$)/, { timeout: 20000 });

    // Handle "Save login info?" prompt
    try {
      const saveBtn = await page.waitForSelector('button:has-text("Save Info")', { timeout: 4000 });
      if (saveBtn) await saveBtn.click();
    } catch (_) {}

    // Check if still on login page (= wrong credentials)
    const stillOnLogin = await page.$('input[name="username"]');
    if (stillOnLogin) {
      await browser.close();
      return res.status(401).json({ error: 'Instagram rejected the credentials. Please check your username and password.' });
    }

    const cookies = await context.cookies();
    await browser.close();

    const sessionid = cookies.find(c => c.name === 'sessionid')?.value;
    if (!sessionid) {
      return res.status(401).json({ error: 'Login appeared to succeed but no session cookie was returned. Instagram may have triggered a security check — please try logging in via Instagram directly first.' });
    }

    // Encrypt and store
    const cookiePayload = cookies.map(c => ({ name: c.name, value: c.value, domain: c.domain, path: c.path }));
    const encryptedSession = encryptSession(cookiePayload);

    const { data: userRecord } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (userRecord?.user?.email) {
      await supabaseAdmin.from('users').upsert({ id: userId, email: userRecord.user.email });
    }

    const { data: existing } = await supabaseAdmin
      .from('instagram_accounts').select('id').eq('user_id', userId).eq('username', username.replace('@', '')).single();

    if (existing) {
      await supabaseAdmin.from('instagram_accounts').update({
        encrypted_session_data: encryptedSession,
        session_status: 'valid',
        connection_status: 'connected',
        updated_at: new Date().toISOString()
      }).eq('id', existing.id);
    } else {
      await supabaseAdmin.from('instagram_accounts').insert({
        user_id: userId,
        username: username.replace('@', ''),
        encrypted_session_data: encryptedSession,
        session_status: 'valid',
        connection_status: 'connected'
      });
    }

    return res.json({
      success: true,
      account: {
        username: username.replace('@', ''),
        profilePicUrl: 'https://i.pravatar.cc/150?u=' + username,
        connectedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    if (browser) await browser.close().catch(() => {});
    console.error('Instagram login error:', error);
    // Distinguish timeout (probably a 2FA / challenge page) from true errors
    if (error.message?.includes('Timeout') || error.message?.includes('waiting for')) {
      return res.status(401).json({ error: 'Instagram showed a security challenge (2FA or CAPTCHA). Please log into instagram.com in a browser first to clear it, then try again.' });
    }
    return res.status(500).json({ error: error.message });
  }
});

// POST /instagram/connect
// Fallback: Accepts a sessionid cookie pasted manually by the user.
router.post('/connect', async (req: AuthenticatedRequest, res) => {
  try {
    const { username, sessionid } = req.body;

    if (!username || !sessionid) {
      return res.status(400).json({ error: 'Username and sessionid are required' });
    }

    const userId = req.user!.id;

    if (userId === 'demo-user') {
      return res.status(400).json({ error: 'Demo Mode: Cannot connect real Instagram accounts. Please sign up.' });
    }

    // Ensure user exists in public.users to prevent FK constraint failures
    const { data: userRecord } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (userRecord?.user?.email) {
      await supabaseAdmin.from('users').upsert({ id: userId, email: userRecord.user.email });
    }

    // Encrypt the session cookie before storing
    const crypto = require('crypto');
    const ENCRYPTION_KEY = process.env.SESSION_ENCRYPTION_KEY || 'default_secret_key_needs_32_bytes!';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv);

    // Build a minimal cookie array that the automation worker expects
    const cookiePayload = [{ name: 'sessionid', value: sessionid, domain: '.instagram.com', path: '/' }];
    let encrypted = cipher.update(JSON.stringify(cookiePayload));
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const encryptedSession = iv.toString('hex') + ':' + encrypted.toString('hex');

    // Upsert the instagram account row
    const { data: existing } = await supabaseAdmin
      .from('instagram_accounts')
      .select('id')
      .eq('user_id', userId)
      .eq('username', username)
      .single();

    if (existing) {
      await supabaseAdmin.from('instagram_accounts').update({
        encrypted_session_data: encryptedSession,
        session_status: 'valid',
        connection_status: 'connected',
        updated_at: new Date().toISOString()
      }).eq('id', existing.id);
    } else {
      await supabaseAdmin.from('instagram_accounts').insert({
        user_id: userId,
        username,
        encrypted_session_data: encryptedSession,
        session_status: 'valid',
        connection_status: 'connected'
      });
    }

    res.json({
      success: true,
      account: {
        username,
        profilePicUrl: 'https://i.pravatar.cc/150?u=' + username,
        connectedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Connect Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
