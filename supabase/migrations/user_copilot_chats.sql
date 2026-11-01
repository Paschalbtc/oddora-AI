-- =========================================================================
-- Oddora AI V2 - User Copilot Chats & Daily Conversation History Schema
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.user_copilot_chats (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    user_email TEXT,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lightning-fast daily retrieval
CREATE INDEX IF NOT EXISTS idx_user_copilot_chats_email_date ON public.user_copilot_chats(user_email, session_date);
CREATE INDEX IF NOT EXISTS idx_user_copilot_chats_user_id ON public.user_copilot_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_copilot_chats_session_date ON public.user_copilot_chats(session_date DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_copilot_chats ENABLE ROW LEVEL SECURITY;

-- Allow public read/write or authenticated user policies
CREATE POLICY IF NOT EXISTS "Allow all access to user_copilot_chats" 
ON public.user_copilot_chats FOR ALL 
USING (true) 
WITH CHECK (true);

