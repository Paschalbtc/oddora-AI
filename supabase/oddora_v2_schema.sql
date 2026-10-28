-- Oddora AI V2 - Database Schema
-- Run this migration in Supabase SQL Editor for your project

-- 1. Matches Table (Multi-sport daily schedule & quantitative outcomes)
CREATE TABLE IF NOT EXISTS public.oddora_v2_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_fixture_id TEXT,
    sport TEXT NOT NULL DEFAULT 'football',
    league TEXT NOT NULL,
    country TEXT DEFAULT '',
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    home_logo TEXT DEFAULT '',
    away_logo TEXT DEFAULT '',
    kickoff_time TIMESTAMPTZ NOT NULL,
    best_outcome TEXT NOT NULL,
    market_name TEXT NOT NULL,
    selection_label TEXT NOT NULL,
    odd_value NUMERIC(6, 2) NOT NULL DEFAULT 1.50,
    win_probability NUMERIC(5, 2) NOT NULL DEFAULT 75.0,
    is_free_preview BOOLEAN NOT NULL DEFAULT false,
    is_over25_candidate BOOLEAN NOT NULL DEFAULT false,
    internal_ai_reasoning TEXT,
    match_metadata JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'SCHEDULED',
    result_score TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_v2_matches_sport ON public.oddora_v2_matches(sport);
CREATE INDEX IF NOT EXISTS idx_v2_matches_kickoff ON public.oddora_v2_matches(kickoff_time);
CREATE INDEX IF NOT EXISTS idx_v2_matches_free ON public.oddora_v2_matches(is_free_preview);
CREATE INDEX IF NOT EXISTS idx_v2_matches_over25 ON public.oddora_v2_matches(is_over25_candidate);
CREATE INDEX IF NOT EXISTS idx_v2_matches_ext_id ON public.oddora_v2_matches(external_fixture_id);

-- 2. Daily Auto-Booked Slips & Bankers Table
CREATE TABLE IF NOT EXISTS public.oddora_v2_daily_slips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slip_type TEXT NOT NULL,
    slip_title TEXT NOT NULL,
    target_odds NUMERIC(8, 2) NOT NULL,
    actual_odds NUMERIC(8, 2) NOT NULL,
    sport TEXT NOT NULL DEFAULT 'multi',
    sporty_code TEXT DEFAULT '',
    bet9ja_code TEXT DEFAULT '',
    share_url TEXT DEFAULT '',
    legs JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_locked_for_tier TEXT NOT NULL DEFAULT 'FREE',
    created_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    result_status TEXT NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_v2_slips_date ON public.oddora_v2_daily_slips(created_date);
CREATE INDEX IF NOT EXISTS idx_v2_slips_type ON public.oddora_v2_daily_slips(slip_type);
CREATE INDEX IF NOT EXISTS idx_v2_slips_tier ON public.oddora_v2_daily_slips(is_locked_for_tier);

-- 3. Results & Win-Rate Summary Table
CREATE TABLE IF NOT EXISTS public.oddora_v2_results_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calculation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    bankers_win_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
    free_tips_win_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
    overall_win_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
    total_graded_matches INTEGER NOT NULL DEFAULT 0,
    won_matches INTEGER NOT NULL DEFAULT 0,
    total_graded_slips INTEGER NOT NULL DEFAULT 0,
    won_slips INTEGER NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_v2_results_date ON public.oddora_v2_results_summary(calculation_date);

-- 4. AI Training Directives & Heuristics Table
CREATE TABLE IF NOT EXISTS public.oddora_v2_ai_directives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    directive_type TEXT NOT NULL DEFAULT 'HEURISTIC_RULE',
    rule_name TEXT NOT NULL,
    sport TEXT NOT NULL DEFAULT 'all',
    market_affected TEXT NOT NULL DEFAULT 'all',
    weight_adjustment NUMERIC(4, 2) NOT NULL DEFAULT 1.00,
    condition_criteria JSONB DEFAULT '{}'::jsonb,
    min_probability_threshold NUMERIC(5, 2) DEFAULT 60.0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_v2_directives_sport ON public.oddora_v2_ai_directives(sport);
CREATE INDEX IF NOT EXISTS idx_v2_directives_active ON public.oddora_v2_ai_directives(is_active);

-- Seed default high-performing training directives
INSERT INTO public.oddora_v2_ai_directives (rule_name, sport, market_affected, weight_adjustment, min_probability_threshold, notes)
VALUES 
    ('Over 2.5 High xG Synergy', 'football', 'Over 2.5', 1.20, 72.0, 'Boost Over 2.5 when combined xG > 2.85 and both teams scored in 4 of last 5'),
    ('Heavy Home Defensive Wall', 'football', '1X', 1.15, 80.0, 'Double Chance 1X boost when home team conceded <= 0.8 goals/game at home'),
    ('NBA Pace & High Efficiency', 'basketball', 'Total Points', 1.10, 68.0, 'Over 220.5 points preferred when both teams rank top 10 in offensive pace'),
    ('Volleyball Dominant Service', 'volleyball', 'Match Winner', 1.12, 75.0, 'Straight win preferred when team has ace-to-error ratio > 1.8')
ON CONFLICT DO NOTHING;
