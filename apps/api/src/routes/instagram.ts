import { Router } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { supabaseAdmin } from '../config/supabase';

const router: Router = Router();

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

// POST /instagram/connect
// Endpoint to receive credentials and start the headless browser connection
router.post('/connect', async (req: AuthenticatedRequest, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const userId = req.user!.id;

    if (userId === 'demo-user') {
      return res.status(400).json({ error: 'Demo Mode: Cannot connect real Instagram accounts. Please sign up to connect.' });
    }

    // 0. Ensure user exists in public.users to prevent foreign key constraint failures
    const { data: userRecord } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (userRecord?.user?.email) {
      await supabaseAdmin.from('users').upsert({
        id: userId,
        email: userRecord.user.email
      });
    }

    // 1. Create or get instagram account row
    let accountId;
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from('instagram_accounts')
      .select('id')
      .eq('user_id', userId)
      .eq('username', username)
      .single();

    if (existing) {
      accountId = existing.id;
    } else {
      const { data: newAcc, error: insertErr } = await supabaseAdmin
        .from('instagram_accounts')
        .insert({ user_id: userId, username, connection_status: 'connecting' })
        .select()
        .single();
      if (insertErr) throw insertErr;
      accountId = newAcc.id;
    }

    // 2. Perform Playwright Login
    const { chromium } = require('playwright');
    
    const isHeadless = process.env.AUTOMATION_HEADLESS === 'true';
    const browser = await chromium.launch({ headless: isHeadless });
    const context = await browser.newContext({
      userAgent: process.env.AUTOMATION_USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();
    
    await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[name="username"]', { state: 'visible' });
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', password);
    await page.keyboard.press('Enter');
    
    try {
      // Wait for the sessionid cookie to appear.
      // We poll from the Node.js side (context.cookies) instead of page.waitForFunction 
      // because Instagram will redirect to a password reset page, which destroys the page context and causes crashes!
      // Giving 5 full minutes (300 loops * 1s)
      let foundSession = false;
      for (let i = 0; i < 300; i++) {
        const currentCookies = await context.cookies();
        if (currentCookies.some((c: any) => c.name === 'sessionid')) {
          foundSession = true;
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (!foundSession) {
        throw new Error('Timeout waiting for sessionid cookie');
      }
      const cookies = await context.cookies();
      
      // We will encrypt using the same logic as automation
      const crypto = require('crypto');
      const ENCRYPTION_KEY = process.env.SESSION_ENCRYPTION_KEY || 'default_secret_key_needs_32_bytes!';
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv);
      let encrypted = cipher.update(JSON.stringify(cookies));
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      const encryptedSession = iv.toString('hex') + ':' + encrypted.toString('hex');

      await supabaseAdmin.from('instagram_accounts').update({
        encrypted_session_data: encryptedSession,
        session_status: 'valid',
        connection_status: 'connected',
        updated_at: new Date().toISOString()
      }).eq('id', accountId);

      await browser.close();

      res.json({ 
        success: true, 
        account: {
          username: username,
          profilePicUrl: 'https://i.pravatar.cc/150?u=' + username,
          connectedAt: new Date().toISOString()
        }
      });
    } catch (e) {
      console.error('Playwright/Save Error:', e);
      await browser.close().catch(() => {});
      await supabaseAdmin.from('instagram_accounts').update({
        connection_status: 'disconnected',
        session_status: 'invalid'
      }).eq('id', accountId);
      
      return res.status(401).json({ error: 'Login failed. Please check your credentials.' });
    }
  } catch (error: any) {
    console.error('Top-level API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
