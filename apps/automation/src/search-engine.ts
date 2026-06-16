import { supabaseAdmin } from './config/supabase';

export async function getNextSearchQuery(userId: string): Promise<string | null> {
  const { data: userData, error } = await supabaseAdmin.auth.admin.getUserById(userId);

  if (error || !userData || !userData.user || !userData.user.user_metadata || !userData.user.user_metadata.preferences) {
    return null;
  }

  const interests = userData.user.user_metadata.preferences.positiveInterests || [];
  if (interests.length === 0) return null;
  // Pick a random interest
  const randomIndex = Math.floor(Math.random() * interests.length);
  return interests[randomIndex];
}
