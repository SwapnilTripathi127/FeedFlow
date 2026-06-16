import { supabaseAdmin } from './config/supabase';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.SESSION_ENCRYPTION_KEY || 'default_secret_key_needs_32_bytes!';
const IV_LENGTH = 16;

function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string): string {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

export async function saveSession(accountId: string, cookies: any[]) {
  const encryptedSession = encrypt(JSON.stringify(cookies));
  
  const { error } = await supabaseAdmin
    .from('instagram_accounts')
    .update({ 
      encrypted_session_data: encryptedSession,
      session_status: 'valid',
      connection_status: 'connected',
      updated_at: new Date().toISOString()
    })
    .eq('id', accountId);

  if (error) {
    throw new Error(`Failed to save session: ${error.message}`);
  }
}

export async function loadSession(accountId: string): Promise<any[] | null> {
  const { data, error } = await supabaseAdmin
    .from('instagram_accounts')
    .select('encrypted_session_data, session_status')
    .eq('id', accountId)
    .single();

  if (error || !data) {
    return null;
  }

  if (data.session_status !== 'valid' || !data.encrypted_session_data) {
    return null;
  }

  try {
    const decrypted = decrypt(data.encrypted_session_data);
    return JSON.parse(decrypted);
  } catch (err) {
    console.error(`Failed to decrypt session for account ${accountId}`, err);
    return null;
  }
}

export async function invalidateSession(accountId: string) {
  await supabaseAdmin
    .from('instagram_accounts')
    .update({ 
      session_status: 'invalid',
      connection_status: 'disconnected',
      updated_at: new Date().toISOString()
    })
    .eq('id', accountId);
}
