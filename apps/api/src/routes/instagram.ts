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
// New: Accepts a sessionid cookie extracted from the in-app WebView login.
// The user logs in directly on their device (trusted residential IP),
// the app extracts the cookie, and sends it here for secure storage.
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
