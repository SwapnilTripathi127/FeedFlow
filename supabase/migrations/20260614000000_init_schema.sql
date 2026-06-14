-- Create custom tables for FeedFlow
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  positive_interests TEXT[] NOT NULL DEFAULT '{}',
  negative_interests TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_preferences UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS public.instagram_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  encrypted_session_data TEXT,
  connection_status TEXT NOT NULL CHECK (connection_status IN ('connected', 'connecting', 'disconnected')) DEFAULT 'disconnected',
  session_status TEXT NOT NULL CHECK (session_status IN ('valid', 'invalid', 'expired')) DEFAULT 'invalid',
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_instagram UNIQUE (user_id, username)
);

CREATE TABLE IF NOT EXISTS public.automation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  instagram_account_id UUID NOT NULL REFERENCES public.instagram_accounts(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')) DEFAULT 'pending',
  action_type TEXT NOT NULL CHECK (action_type IN ('warmup', 'engagement', 'cleanup')) DEFAULT 'engagement',
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.automation_jobs(id) ON DELETE SET NULL,
  instagram_account_id UUID NOT NULL REFERENCES public.instagram_accounts(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error')) DEFAULT 'info',
  message TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  instagram_account_id UUID NOT NULL REFERENCES public.instagram_accounts(id) ON DELETE CASCADE,
  personalization_score INT NOT NULL DEFAULT 50 CHECK (personalization_score >= 0 AND personalization_score <= 100),
  likes_count INT NOT NULL DEFAULT 0,
  saves_count INT NOT NULL DEFAULT 0,
  follows_count INT NOT NULL DEFAULT 0,
  skips_count INT NOT NULL DEFAULT 0,
  actions_today INT NOT NULL DEFAULT 0,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_preferences_user_id ON public.preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_instagram_accounts_user_id ON public.instagram_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_jobs_status ON public.automation_jobs(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_automation_logs_job_id ON public.automation_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user_timestamp ON public.analytics(user_id, timestamp DESC);
