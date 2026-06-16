import { supabaseAdmin } from './config/supabase';

interface AnalyticsUpdate {
  likesCount?: number;
  savesCount?: number;
  followsCount?: number;
  skipsCount?: number;
  actionsToday?: number;
  personalizationScoreDelta?: number;
}

export async function recordAnalytics(userId: string, accountId: string, update: AnalyticsUpdate) {
  // Try to get the latest analytics row for this user
  const { data: latest, error: fetchError } = await supabaseAdmin
    .from('analytics')
    .select('*')
    .eq('user_id', userId)
    .eq('instagram_account_id', accountId)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();

  let currentScore = 50;
  let currentLikes = 0;
  let currentSaves = 0;
  let currentFollows = 0;
  let currentSkips = 0;
  let currentActions = 0;

  if (!fetchError && latest) {
    currentScore = latest.personalization_score;
    currentLikes = latest.likes_count;
    currentSaves = latest.saves_count;
    currentFollows = latest.follows_count;
    currentSkips = latest.skips_count;
    currentActions = latest.actions_today;
  }

  // Calculate new values
  const newScore = Math.min(100, Math.max(0, currentScore + (update.personalizationScoreDelta || 0)));
  
  const { error: insertError } = await supabaseAdmin
    .from('analytics')
    .insert({
      user_id: userId,
      instagram_account_id: accountId,
      personalization_score: newScore,
      likes_count: currentLikes + (update.likesCount || 0),
      saves_count: currentSaves + (update.savesCount || 0),
      follows_count: currentFollows + (update.followsCount || 0),
      skips_count: currentSkips + (update.skipsCount || 0),
      actions_today: currentActions + (update.actionsToday || 0)
    });

  if (insertError) {
    console.error(`[Analytics] Failed to record analytics for ${userId}:`, insertError.message);
  }
}
