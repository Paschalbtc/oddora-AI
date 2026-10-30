-- =========================================================================
-- Oddora AI V2 - User Saved Tickets & Live Grading Schema
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.user_saved_tickets (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    user_email TEXT,
    booking_code TEXT NOT NULL,
    total_odds NUMERIC NOT NULL DEFAULT 2.0,
    target_odds NUMERIC,
    tier TEXT DEFAULT 'FREE',
    title TEXT DEFAULT 'Oddora Accumulator Ticket',
    legs JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'PENDING',
    source TEXT DEFAULT 'ODDORA_PLATFORM',
    payout NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_saved_tickets_user_id ON public.user_saved_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_tickets_status ON public.user_saved_tickets(status);
CREATE INDEX IF NOT EXISTS idx_user_saved_tickets_created_at ON public.user_saved_tickets(created_at DESC);

-- Enable Row Level Security (optional)
ALTER TABLE public.user_saved_tickets ENABLE ROW LEVEL SECURITY;

-- Allow public read/write or authenticated user policies
CREATE POLICY IF NOT EXISTS "Allow all access to user_saved_tickets" 
ON public.user_saved_tickets FOR ALL 
USING (true) 
WITH CHECK (true);

