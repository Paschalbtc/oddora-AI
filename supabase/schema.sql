-- ============================================================================
-- ODDORA AI - COMPLETE PRODUCTION SUPABASE DATABASE SCHEMA
-- ============================================================================
-- Covers:
-- 1. Extensions (pgvector, uuid-ossp, pg_trgm)
-- 2. Core Tables (profiles, affiliate_referrals, daily_matches, ai_predictions, ai_lessons_memory, generated_slips)
-- 3. Row Level Security (RLS) & Fine-Grained Access Policies
-- 4. Auth Trigger (Automatically creates public.profiles when auth.users is created)
-- 5. Vector Similarity Search Function (match_ai_lessons for 768-dim embeddings)
-- 6. Performance Indexes & Realtime Publications
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. CORE TABLES

-- Table: public.profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL DEFAULT 'Oddora Strategist',
    email TEXT NOT NULL,
    phone_number TEXT DEFAULT '',
    plan_tier TEXT NOT NULL DEFAULT 'FREE' CHECK (plan_tier IN ('FREE', 'PRO', 'VIP')),
    subscription_cycle TEXT DEFAULT 'BETA_TESTER',
    daily_chat_used INTEGER DEFAULT 0,
    referral_code TEXT UNIQUE NOT NULL,
    referred_by_code TEXT,
    affiliate_balance NUMERIC(10, 2) DEFAULT 0.00,
    total_referrals INTEGER DEFAULT 0,
    total_commission_earned NUMERIC(10, 2) DEFAULT 0.00,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- Table: public.affiliate_referrals
CREATE TABLE IF NOT EXISTS public.affiliate_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    referred_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    referred_name TEXT NOT NULL,
    plan_purchased TEXT NOT NULL DEFAULT 'FREE',
    commission_earned NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('PENDING', 'ACTIVE', 'PAID', 'SIMULATED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- Table: public.daily_matches
CREATE TABLE IF NOT EXISTS public.daily_matches (
    fixture_id BIGINT PRIMARY KEY,
    match_date DATE NOT NULL,
    league_id INTEGER,
    league_name TEXT NOT NULL,
    league_logo TEXT DEFAULT '',
    league_country TEXT DEFAULT '',
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    home_logo TEXT DEFAULT '',
    away_logo TEXT DEFAULT '',
    kickoff_time TIMESTAMPTZ,
    status TEXT DEFAULT 'NS',
    home_goals INTEGER,
    away_goals INTEGER,
    odds_json JSONB DEFAULT '{}'::jsonb,
    stats_context JSONB DEFAULT '{}'::jsonb,
    post_match_stats JSONB DEFAULT '{}'::jsonb,
    news_summary TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- Table: public.ai_predictions
CREATE TABLE IF NOT EXISTS public.ai_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fixture_id BIGINT NOT NULL REFERENCES public.daily_matches(fixture_id) ON DELETE CASCADE,
    match_date DATE NOT NULL,
    selected_market TEXT NOT NULL,
    odd_value NUMERIC(6, 2) NOT NULL,
    confidence_score NUMERIC(5, 2) NOT NULL,
    risk_category TEXT NOT NULL CHECK (risk_category IN ('SAFE', 'VALUE', 'HIGH_ODDS', 'DEGEN')),
    is_vip_only BOOLEAN NOT NULL DEFAULT FALSE,
    ai_reasoning TEXT NOT NULL,
    outcome_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (outcome_status IN ('PENDING', 'WON', 'LOST', 'VOID')),
    failure_autopsy TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- Table: public.ai_lessons_memory (pgvector enabled)
CREATE TABLE IF NOT EXISTS public.ai_lessons_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fixture_id BIGINT,
    teams_or_league TEXT,
    market_type TEXT,
    lesson_text TEXT NOT NULL,
    category TEXT DEFAULT 'TACTICAL_HEURISTIC',
    embedding vector(768),
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);
ALTER TABLE public.ai_lessons_memory ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'TACTICAL_HEURISTIC';
ALTER TABLE public.ai_lessons_memory ADD COLUMN IF NOT EXISTS fixture_id BIGINT;

-- Table: public.generated_slips
CREATE TABLE IF NOT EXISTS public.generated_slips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    bookmaker TEXT NOT NULL DEFAULT 'SportyBet',
    booking_code TEXT NOT NULL,
    target_odds_requested NUMERIC(10, 2),
    actual_combined_odds NUMERIC(10, 2) NOT NULL,
    duration TEXT DEFAULT '1_day',
    legs_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);
ALTER TABLE public.generated_slips ADD COLUMN IF NOT EXISTS bookmaker TEXT NOT NULL DEFAULT 'SportyBet';
ALTER TABLE public.generated_slips ADD COLUMN IF NOT EXISTS duration TEXT DEFAULT '1_day';

-- 3. INDEXES FOR HIGH-THROUGHPUT QUERIES
CREATE INDEX IF NOT EXISTS idx_matches_date ON public.daily_matches(match_date);
CREATE INDEX IF NOT EXISTS idx_matches_kickoff ON public.daily_matches(kickoff_time);
CREATE INDEX IF NOT EXISTS idx_predictions_date ON public.ai_predictions(match_date);
CREATE INDEX IF NOT EXISTS idx_predictions_fixture ON public.ai_predictions(fixture_id);
CREATE INDEX IF NOT EXISTS idx_predictions_outcome ON public.ai_predictions(outcome_status);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrer ON public.affiliate_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_generated_slips_code ON public.generated_slips(booking_code);

-- HNSW Vector Index for Instant Semantic Similarity Search
CREATE INDEX IF NOT EXISTS idx_lessons_embedding ON public.ai_lessons_memory 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 4. DATABASE FUNCTIONS & TRIGGERS

-- Function: Automatic Updated At Timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_matches_updated_at ON public.daily_matches;
CREATE TRIGGER trigger_matches_updated_at
    BEFORE UPDATE ON public.daily_matches
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Function: Auto-generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_unique_referral_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    result TEXT := 'ODD-';
    i INTEGER;
BEGIN
    FOR i IN 1..5 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger Function: Automatic Profile Creation on auth.users Sign-Up
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    gen_code TEXT;
    raw_full_name TEXT;
    raw_phone TEXT;
    raw_ref_code TEXT;
    referrer_record RECORD;
BEGIN
    gen_code := public.generate_unique_referral_code();
    raw_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Oddora Member');
    raw_phone := COALESCE(NEW.raw_user_meta_data->>'phone_number', '');
    raw_ref_code := UPPER(NULLIF(TRIM(NEW.raw_user_meta_data->>'referred_by_code'), ''));

    INSERT INTO public.profiles (
        id,
        full_name,
        email,
        phone_number,
        plan_tier,
        referral_code,
        referred_by_code,
        affiliate_balance,
        total_referrals,
        created_at
    )
    VALUES (
        NEW.id,
        raw_full_name,
        NEW.email,
        raw_phone,
        'FREE',
        gen_code,
        raw_ref_code,
        0.00,
        0,
        TIMEZONE('utc', NOW())
    )
    ON CONFLICT (id) DO NOTHING;

    -- Link affiliate referrer if valid code passed
    IF raw_ref_code IS NOT NULL THEN
        SELECT * INTO referrer_record FROM public.profiles WHERE referral_code = raw_ref_code LIMIT 1;
        IF referrer_record.id IS NOT NULL THEN
            INSERT INTO public.affiliate_referrals (
                referrer_id,
                referred_user_id,
                referred_name,
                plan_purchased,
                commission_earned,
                status
            )
            VALUES (
                referrer_record.id,
                NEW.id,
                raw_full_name,
                'FREE',
                0.00,
                'ACTIVE'
            );

            UPDATE public.profiles
            SET total_referrals = total_referrals + 1
            WHERE id = referrer_record.id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_auth_user();

-- Vector Semantic Search RPC Function (used by Copilot & Autopsy)
CREATE OR REPLACE FUNCTION public.match_ai_lessons(
    query_embedding vector(768),
    match_threshold FLOAT DEFAULT 0.4,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    lesson_text TEXT,
    teams_or_league TEXT,
    market_type TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ai_lessons_memory.id,
        ai_lessons_memory.lesson_text,
        ai_lessons_memory.teams_or_league,
        ai_lessons_memory.market_type,
        1 - (ai_lessons_memory.embedding <=> query_embedding) AS similarity
    FROM public.ai_lessons_memory
    WHERE 1 - (ai_lessons_memory.embedding <=> query_embedding) > match_threshold
    ORDER BY ai_lessons_memory.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- 5. ROW LEVEL SECURITY (RLS) POLICIES

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_lessons_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_slips ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles read policy" ON public.profiles;
CREATE POLICY "Public profiles read policy" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Service role full access on profiles" ON public.profiles;
CREATE POLICY "Service role full access on profiles" ON public.profiles FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Affiliate Referrals Policies
DROP POLICY IF EXISTS "Referrers can view their referrals" ON public.affiliate_referrals;
CREATE POLICY "Referrers can view their referrals" ON public.affiliate_referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Service role full access on referrals" ON public.affiliate_referrals;
CREATE POLICY "Service role full access on referrals" ON public.affiliate_referrals FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Daily Matches & Predictions Policies (Public Read)
DROP POLICY IF EXISTS "Public read matches" ON public.daily_matches;
CREATE POLICY "Public read matches" ON public.daily_matches FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role write matches" ON public.daily_matches;
CREATE POLICY "Service role write matches" ON public.daily_matches FOR ALL USING (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Public read predictions" ON public.ai_predictions;
CREATE POLICY "Public read predictions" ON public.ai_predictions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role write predictions" ON public.ai_predictions;
CREATE POLICY "Service role write predictions" ON public.ai_predictions FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- AI Lessons Memory Policies
DROP POLICY IF EXISTS "Public read lessons" ON public.ai_lessons_memory;
CREATE POLICY "Public read lessons" ON public.ai_lessons_memory FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role write lessons" ON public.ai_lessons_memory;
CREATE POLICY "Service role write lessons" ON public.ai_lessons_memory FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Generated Slips Policies
DROP POLICY IF EXISTS "Public read slips" ON public.generated_slips;
CREATE POLICY "Public read slips" ON public.generated_slips FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role write slips" ON public.generated_slips;
CREATE POLICY "Service role write slips" ON public.generated_slips FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- 6. REALTIME REPLICATION (For Live Scores & Betslip Updates)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_matches, public.ai_predictions, public.profiles;
