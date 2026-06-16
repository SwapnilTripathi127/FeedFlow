CREATE TABLE IF NOT EXISTS public.topic_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  instagram_account_id UUID NOT NULL REFERENCES public.instagram_accounts(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  likes_count INT NOT NULL DEFAULT 0,
  skips_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_account_topic UNIQUE (user_id, instagram_account_id, topic)
);

CREATE INDEX IF NOT EXISTS idx_topic_stats_user_account ON public.topic_stats(user_id, instagram_account_id);
