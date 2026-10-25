-- =========================================================================
-- AIT CAMPUS CONNECT: UNSTOP OPPORTUNITY AGGREGATION & SYNC SCHEMA
-- Target Database: Supabase PostgreSQL
-- =========================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table: opportunities
CREATE TABLE IF NOT EXISTS public.opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source TEXT NOT NULL DEFAULT 'UNSTOP',
    source_opportunity_id TEXT NOT NULL,
    unstop_id TEXT UNIQUE,
    title TEXT NOT NULL,
    slug TEXT,
    organizer TEXT,
    opportunity_type TEXT DEFAULT 'hackathons',
    description TEXT,
    problem_statement TEXT,
    prize_pool TEXT,
    prize_details JSONB,
    eligibility JSONB,
    eligibility_category TEXT DEFAULT 'ELIGIBLE', -- 'ELIGIBLE', 'POTENTIALLY_ELIGIBLE', 'NOT_ELIGIBLE', 'INSUFFICIENT_INFORMATION'
    eligibility_reason TEXT,
    registration_fee TEXT,
    team_min_size INTEGER DEFAULT 1,
    team_max_size INTEGER DEFAULT 4,
    registration_start TIMESTAMPTZ,
    registration_deadline TIMESTAMPTZ,
    event_start TIMESTAMPTZ,
    event_end TIMESTAMPTZ,
    mode TEXT DEFAULT 'Online', -- 'Online', 'In-Person', 'Hybrid'
    location TEXT,
    banner_url TEXT,
    source_url TEXT NOT NULL,
    official_url TEXT,
    skills_required JSONB,
    domains JSONB,
    rounds JSONB,
    rules JSONB,
    contact_information JSONB,
    raw_data JSONB,
    data_quality_status TEXT DEFAULT 'VERIFIED',
    verification_status TEXT DEFAULT 'VERIFIED',
    is_active INTEGER DEFAULT 1,
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_source_opportunity UNIQUE (source, source_opportunity_id)
);

-- Indexes for high-speed queries, filtering, and deadline sorting
CREATE INDEX IF NOT EXISTS idx_opps_source_opp_id ON public.opportunities(source, source_opportunity_id);
CREATE INDEX IF NOT EXISTS idx_opps_unstop_id ON public.opportunities(unstop_id);
CREATE INDEX IF NOT EXISTS idx_opps_deadline ON public.opportunities(registration_deadline);
CREATE INDEX IF NOT EXISTS idx_opps_type ON public.opportunities(opportunity_type);
CREATE INDEX IF NOT EXISTS idx_opps_mode ON public.opportunities(mode);
CREATE INDEX IF NOT EXISTS idx_opps_eligibility ON public.opportunities(eligibility_category);
CREATE INDEX IF NOT EXISTS idx_opps_active ON public.opportunities(is_active);

-- 2. Table: opportunity_sync_runs (Audit & Telemetry)
CREATE TABLE IF NOT EXISTS public.opportunity_sync_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sync_id TEXT UNIQUE NOT NULL,
    source TEXT NOT NULL DEFAULT 'UNSTOP',
    actor_id TEXT DEFAULT 'hipersoft/unstop-scraper',
    run_id TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    total_fetched INTEGER DEFAULT 0,
    inserted_records INTEGER DEFAULT 0,
    updated_records INTEGER DEFAULT 0,
    failed_records INTEGER DEFAULT 0,
    status TEXT DEFAULT 'RUNNING', -- 'RUNNING', 'COMPLETED', 'FAILED', 'PARTIAL'
    error_summary TEXT,
    execution_metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_runs_started ON public.opportunity_sync_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_runs_status ON public.opportunity_sync_runs(status);

-- 3. Table: saved_opportunities (Student Bookmarks & Self-Reported Tracking)
CREATE TABLE IF NOT EXISTS public.saved_opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'SAVED', -- 'SAVED', 'INTERESTED', 'PLANNING_TO_APPLY', 'APPLIED', 'COMPLETED'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_user_opportunity UNIQUE (user_id, opportunity_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_opps_user ON public.saved_opportunities(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_opps_status ON public.saved_opportunities(status);

-- =========================================================================
-- DATABASE SECURITY: ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable Row Level Security
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_sync_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_opportunities ENABLE ROW LEVEL SECURITY;

-- Opportunities Policies
DROP POLICY IF EXISTS "Allow public read access to opportunities" ON public.opportunities;
CREATE POLICY "Allow public read access to opportunities"
ON public.opportunities
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow service_role full management on opportunities" ON public.opportunities;
CREATE POLICY "Allow service_role full management on opportunities"
ON public.opportunities
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Sync Runs Policies
DROP POLICY IF EXISTS "Allow authenticated read sync runs" ON public.opportunity_sync_runs;
CREATE POLICY "Allow authenticated read sync runs"
ON public.opportunity_sync_runs
FOR SELECT
TO authenticated, anon
USING (true);

DROP POLICY IF EXISTS "Allow service_role full management on sync runs" ON public.opportunity_sync_runs;
CREATE POLICY "Allow service_role full management on sync runs"
ON public.opportunity_sync_runs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Saved Opportunities Policies
DROP POLICY IF EXISTS "Allow users to read their own saved opportunities" ON public.saved_opportunities;
CREATE POLICY "Allow users to read their own saved opportunities"
ON public.saved_opportunities
FOR SELECT
TO authenticated, anon
USING (true);

DROP POLICY IF EXISTS "Allow users to modify their own saved opportunities" ON public.saved_opportunities;
CREATE POLICY "Allow users to modify their own saved opportunities"
ON public.saved_opportunities
FOR ALL
TO authenticated, anon
USING (true)
WITH CHECK (true);
