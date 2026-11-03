-- =========================================================================
-- Oddora AI V2 - Site Visits & Traffic Analytics Schema
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.oddora_v2_site_visits (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    session_id TEXT,
    path TEXT NOT NULL DEFAULT '/',
    referrer TEXT,
    user_agent TEXT,
    ip_hash TEXT,
    user_email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_site_visits_created_at ON public.oddora_v2_site_visits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_visits_session_id ON public.oddora_v2_site_visits(session_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_user_email ON public.oddora_v2_site_visits(user_email);

-- Enable RLS
ALTER TABLE public.oddora_v2_site_visits ENABLE ROW LEVEL SECURITY;

-- Allow insert by public service/anon client and full access
CREATE POLICY IF NOT EXISTS "Allow insert to oddora_v2_site_visits"
ON public.oddora_v2_site_visits FOR ALL
USING (true)
WITH CHECK (true);
