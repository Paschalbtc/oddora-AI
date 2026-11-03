-- =========================================================================
-- Oddora AI V2 - User Saved Tickets & Cross-Device Cloud Sync Schema
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.user_saved_tickets (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    user_email TEXT,
    booking_code TEXT NOT NULL,
    share_code TEXT,
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

-- Efficient indexes for lightning fast cross-device lookups
CREATE INDEX IF NOT EXISTS idx_user_saved_tickets_user_id ON public.user_saved_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_tickets_user_email ON public.user_saved_tickets(user_email);
CREATE INDEX IF NOT EXISTS idx_user_saved_tickets_status ON public.user_saved_tickets(status);
CREATE INDEX IF NOT EXISTS idx_user_saved_tickets_created_at ON public.user_saved_tickets(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_saved_tickets ENABLE ROW LEVEL SECURITY;

-- Allow read/write access for authenticated sessions & service role
DROP POLICY IF EXISTS "Allow all access to user_saved_tickets" ON public.user_saved_tickets;
CREATE POLICY "Allow all access to user_saved_tickets" 
ON public.user_saved_tickets FOR ALL 
USING (true) 
WITH CHECK (true);
