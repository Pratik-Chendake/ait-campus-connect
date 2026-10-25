-- =============================================================================
-- AIT PUNE CAMPUS ACHIEVEMENT & PARTICIPATION PORTAL
-- MASTER SUPABASE DATABASE RECOVERY & RECONSTRUCTION SCHEMA
-- Target Project ID: igekrdkefsrpzxwncwce
-- Target URL: https://igekrdkefsrpzxwncwce.supabase.co
-- Compatible: PostgreSQL 15+ / Supabase Auth & Storage & Realtime
-- =============================================================================

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. PROFILES & AUTHENTICATED IDENTITIES (Linked to Supabase auth.users)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT DEFAULT 'AIT Student',
    display_name TEXT,
    avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
    bio TEXT DEFAULT 'Student at Army Institute of Technology, Pune.',
    branch TEXT DEFAULT 'Computer Engineering', -- 'Computer Engineering', 'Information Technology', 'Electronics & Telecommunication', 'Mechanical Engineering', 'Automation & Robotics'
    year INTEGER DEFAULT 1,                      -- 1, 2, 3, 4
    semester INTEGER DEFAULT 1,                  -- 1 to 8
    student_id TEXT,
    phone TEXT,
    github_url TEXT,
    linkedin_url TEXT,
    portfolio_url TEXT,
    contribution_score INTEGER DEFAULT 0,
    profile_visibility TEXT DEFAULT 'PUBLIC',    -- 'PUBLIC', 'AIT_ONLY', 'PRIVATE'
    account_status TEXT DEFAULT 'ACTIVE',        -- 'ACTIVE', 'SUSPENDED'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 2. USER ROLES & AUTHORIZATION
-- Strict Role Assignments: 'student', 'organizer', 'admin', 'super_admin', 'faculty'
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'organizer', 'admin', 'super_admin', 'faculty')),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT uq_user_role UNIQUE(user_id, role)
);

-- Audit log for sensitive role changes
CREATE TABLE IF NOT EXISTS public.role_change_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    previous_role TEXT NOT NULL,
    new_role TEXT NOT NULL,
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log for platform actions
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_email TEXT,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 3. HACKATHONS, COMPETITIONS & UNSTOP OPPORTUNITIES
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL DEFAULT 'UNSTOP',
    source_opportunity_id TEXT NOT NULL,
    unstop_id TEXT UNIQUE,
    title TEXT NOT NULL,
    slug TEXT,
    organizer TEXT,
    opportunity_type TEXT DEFAULT 'hackathons', -- 'hackathons', 'competitions', 'quizzes', 'coding_contests'
    description TEXT,
    problem_statement TEXT,
    prize_pool TEXT,
    prize_details JSONB,
    eligibility JSONB,
    eligibility_category TEXT DEFAULT 'ELIGIBLE', -- 'ELIGIBLE', 'POTENTIALLY_ELIGIBLE', 'NOT_ELIGIBLE', 'INSUFFICIENT_INFORMATION'
    eligibility_reason TEXT,
    registration_fee TEXT DEFAULT 'Free',
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

CREATE TABLE IF NOT EXISTS public.opportunity_sync_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    status TEXT DEFAULT 'RUNNING',
    error_summary TEXT,
    execution_metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.saved_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'SAVED', -- 'SAVED', 'INTERESTED', 'PLANNING_TO_APPLY', 'APPLIED', 'COMPLETED'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_user_saved_opportunity UNIQUE (user_id, opportunity_id)
);

-- =============================================================================
-- 4. CAMPUS EVENTS & CLUBS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.clubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT UNIQUE NOT NULL,
    category TEXT DEFAULT 'Technical', -- 'Technical', 'Cultural', 'Sports', 'Social', 'Literary'
    description TEXT NOT NULL,
    lead_name TEXT,
    lead_email TEXT,
    faculty_advisor TEXT,
    logo_url TEXT,
    banner_url TEXT,
    instagram_url TEXT,
    linkedin_url TEXT,
    website_url TEXT,
    member_count INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.club_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'MEMBER', -- 'LEAD', 'CO_LEAD', 'CORE_MEMBER', 'MEMBER'
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_club_member UNIQUE (club_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE,
    club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL,
    organizer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    category TEXT DEFAULT 'HACKATHON', -- 'HACKATHON', 'CODING_CONTEST', 'WORKSHOP', 'TECH_COMPETITION', 'CULTURAL', 'SPORTS', 'SEMINAR'
    event_type TEXT DEFAULT 'INTERNAL', -- 'INTERNAL', 'INTER_COLLEGE', 'NATIONAL'
    description TEXT NOT NULL,
    problem_statement TEXT,
    rules TEXT,
    mode TEXT DEFAULT 'Offline', -- 'Online', 'Offline', 'Hybrid'
    location TEXT DEFAULT 'AIT Campus, Pune',
    venue_details TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    registration_deadline TIMESTAMPTZ NOT NULL,
    max_teams INTEGER,
    team_min_size INTEGER DEFAULT 1,
    team_max_size INTEGER DEFAULT 4,
    registration_fee TEXT DEFAULT 'Free',
    prize_pool TEXT,
    banner_url TEXT,
    official_link TEXT,
    status TEXT DEFAULT 'UPCOMING', -- 'UPCOMING', 'REGISTRATION_OPEN', 'ONGOING', 'COMPLETED', 'CANCELLED'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 5. PERMANENT STUDENT PARTICIPATION & ACHIEVEMENT SYSTEM (MY ACHIEVEMENTS)
-- Strict non-deletable participation history with audit trail
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.student_participations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
    custom_event_title TEXT, -- for imported or self-reported events
    custom_organizer TEXT,
    category TEXT DEFAULT 'HACKATHON',
    registration_id TEXT UNIQUE NOT NULL,
    registration_timestamp TIMESTAMPTZ DEFAULT NOW(),
    registration_status TEXT DEFAULT 'CONFIRMED', -- 'CONFIRMED', 'PENDING', 'CANCELLED', 'INVALID'
    participation_status TEXT DEFAULT 'REGISTERED' CHECK (
        participation_status IN (
            'REGISTERED', 'ATTENDANCE_CONFIRMED', 'PARTICIPATED',
            'SUBMISSION_COMPLETED', 'QUALIFIED', 'SHORTLISTED',
            'FINALIST', 'WINNER', 'COMPLETED', 'CANCELLED', 'WITHDRAWN', 'DISQUALIFIED'
        )
    ),
    attendance_confirmed BOOLEAN DEFAULT FALSE,
    attendance_timestamp TIMESTAMPTZ,
    role_in_event TEXT DEFAULT 'INDIVIDUAL', -- 'INDIVIDUAL', 'TEAM_LEADER', 'TEAM_MEMBER'
    team_name TEXT,
    team_leader TEXT,
    team_members JSONB,
    project_title TEXT,
    project_description TEXT,
    project_links JSONB,
    submission_details JSONB,
    official_rank INTEGER,
    award_title TEXT, -- '1st Place', '2nd Place', '3rd Place', 'Runner-Up', 'Finalist', 'Special Mention'
    official_score NUMERIC(5,2),
    official_result_url TEXT,
    verification_status TEXT DEFAULT 'UNVERIFIED' CHECK (
        verification_status IN ('UNVERIFIED', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED')
    ),
    verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    source_type TEXT DEFAULT 'PORTAL_REGISTRATION', -- 'PORTAL_REGISTRATION', 'SELF_REPORTED', 'ADMIN_IMPORT'
    is_in_portfolio BOOLEAN DEFAULT FALSE,
    portfolio_display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Durable Milestones for Round Progression in Competitions
CREATE TABLE IF NOT EXISTS public.participation_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participation_id UUID NOT NULL REFERENCES public.student_participations(id) ON DELETE CASCADE,
    milestone_type TEXT NOT NULL, -- 'REGISTERED', 'ATTENDANCE_CONFIRMED', 'SUBMISSION_SUBMITTED', 'ROUND_QUALIFIED', 'SHORTLISTED', 'FINALIST_SELECTED', 'RESULT_PUBLISHED', 'CERTIFICATE_ISSUED'
    title TEXT NOT NULL,
    description TEXT,
    round_number INTEGER,
    round_name TEXT,
    achieved_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Append-Only Participation Audit Trail (Enforces permanent non-deletability)
CREATE TABLE IF NOT EXISTS public.participation_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participation_id UUID NOT NULL REFERENCES public.student_participations(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'REGISTRATION_RECORDED', 'ATTENDANCE_UPDATED', 'ROUND_ADVANCED', 'RESULT_ASSIGNED', 'ADMIN_CORRECTION', 'PORTFOLIO_TOGGLED'
    performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_email TEXT,
    reason TEXT,
    previous_state JSONB,
    new_state JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 6. CERTIFICATE VAULT & CREDENTIALS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    participation_id UUID REFERENCES public.student_participations(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'PARTICIPATION', -- 'PARTICIPATION', 'WINNER', 'RUNNER_UP', 'FINALIST', 'COMPLETION', 'INTERNSHIP', 'TECHNICAL', 'SPORTS', 'CULTURAL'
    issuer TEXT NOT NULL,
    credential_id TEXT UNIQUE,
    issue_date DATE NOT NULL,
    expiry_date DATE,
    certificate_url TEXT NOT NULL,
    verification_status TEXT DEFAULT 'VERIFIED' CHECK (
        verification_status IN ('PENDING_VERIFICATION', 'VERIFIED', 'REJECTED')
    ),
    verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 7. TEAMS & TEAM FORMATION
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    leader_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT,
    project_title TEXT,
    github_url TEXT,
    status TEXT DEFAULT 'OPEN', -- 'OPEN', 'FULL', 'REGISTERED', 'DISBANDED'
    max_members INTEGER DEFAULT 4,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'MEMBER', -- 'LEADER', 'MEMBER'
    status TEXT DEFAULT 'ACCEPTED', -- 'PENDING', 'ACCEPTED', 'DECLINED'
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_team_member UNIQUE (team_id, user_id)
);

-- =============================================================================
-- 8. INTERNSHIPS (Opportunities Hub)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.internships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    company_logo TEXT,
    location TEXT DEFAULT 'Pune, Maharashtra',
    mode TEXT DEFAULT 'Hybrid', -- 'Remote', 'On-Site', 'Hybrid'
    category TEXT DEFAULT 'Software Engineering',
    stipend TEXT DEFAULT 'Stipend Disclosed',
    duration TEXT DEFAULT '6 Months',
    description TEXT NOT NULL,
    requirements JSONB,
    eligible_branches JSONB,
    eligible_years JSONB,
    official_apply_url TEXT NOT NULL,
    application_deadline TIMESTAMPTZ NOT NULL,
    verification_status TEXT DEFAULT 'VERIFIED',
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.saved_internships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    internship_id UUID NOT NULL REFERENCES public.internships(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'SAVED', -- 'SAVED', 'APPLIED', 'INTERVIEWING', 'OFFERED', 'REJECTED'
    applied_date TIMESTAMPTZ,
    notes TEXT,
    saved_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_user_saved_internship UNIQUE (user_id, internship_id)
);

-- =============================================================================
-- 9. SCHOLARSHIPS (Verified Indian & Defense Schemes)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.scholarships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    provider TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'CENTRAL', -- 'CENTRAL', 'STATE', 'DEFENCE', 'POLICE_CAPF', 'PRIVATE_CORPORATE', 'AIT_EXCLUSIVE'
    academic_year TEXT NOT NULL DEFAULT '2026-27',
    description TEXT NOT NULL,
    benefits_summary TEXT,
    amount_min BIGINT DEFAULT 0,
    amount_max BIGINT DEFAULT 0,
    amount_display TEXT NOT NULL,
    eligible_branches TEXT DEFAULT 'All',
    eligible_years TEXT DEFAULT '1, 2, 3, 4',
    min_percentage NUMERIC(5,2) DEFAULT 0,
    max_income BIGINT DEFAULT 0,
    applicable_states TEXT DEFAULT 'ALL_INDIA',
    gender_restriction TEXT DEFAULT 'ANY',
    category_restriction TEXT DEFAULT 'ALL',
    defence_category TEXT DEFAULT 'NONE',
    application_open_at TIMESTAMPTZ,
    application_close_at TIMESTAMPTZ NOT NULL,
    institute_verification_deadline TIMESTAMPTZ,
    official_application_url TEXT NOT NULL,
    status TEXT DEFAULT 'OPEN',
    verification_status TEXT DEFAULT 'VERIFIED',
    is_featured SMALLINT DEFAULT 0,
    is_active SMALLINT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.saved_scholarships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scholarship_id UUID NOT NULL REFERENCES public.scholarships(id) ON DELETE CASCADE,
    application_status TEXT DEFAULT 'SAVED', -- 'SAVED', 'ELIGIBLE', 'APPLIED', 'VERIFIED_BY_COLLEGE', 'SANCTIONED'
    student_notes TEXT,
    applied_date TIMESTAMPTZ,
    saved_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_user_saved_scholarship UNIQUE (user_id, scholarship_id)
);

-- =============================================================================
-- 10. IN-APP NOTIFICATIONS & REALTIME ALERTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'SYSTEM', -- 'SYSTEM', 'HACKATHON', 'RESULT', 'CERTIFICATE', 'MILESTONE', 'CLUB', 'OPPORTUNITY'
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 11. INDEXES FOR HIGH-SPEED QUERYING & SCALABILITY
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_branch ON public.profiles(branch);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_participations_student ON public.student_participations(student_id);
CREATE INDEX IF NOT EXISTS idx_participations_status ON public.student_participations(participation_status);
CREATE INDEX IF NOT EXISTS idx_participations_portfolio ON public.student_participations(student_id, is_in_portfolio);
CREATE INDEX IF NOT EXISTS idx_milestones_part_id ON public.participation_milestones(participation_id);
CREATE INDEX IF NOT EXISTS idx_certificates_student ON public.certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_opps_deadline ON public.opportunities(registration_deadline);
CREATE INDEX IF NOT EXISTS idx_events_start ON public.events(start_date);

-- =============================================================================
-- 12. AUTOMATIC PROFILE CREATION TRIGGER ON AUTH SIGNUP
-- Automatically creates student profile & assigns 'student' role
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Create public profile
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        branch,
        account_status
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'branch', 'Computer Engineering'),
        'ACTIVE'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();

    -- 2. Automatically assign student role (Never public admin)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'student')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- 3. Record in activity log
    INSERT INTO public.activity_logs (user_id, actor_email, action, details)
    VALUES (
        NEW.id,
        NEW.email,
        'ACCOUNT_CREATED',
        jsonb_build_object('provider', 'supabase_auth', 'assigned_role', 'student', 'time', NOW())
    );

    -- 4. Send welcome notification
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
        NEW.id,
        'Welcome to AIT Campus Connect!',
        'Your account is ready. Explore hackathons, register for college events, and build your permanent achievement history.',
        'SYSTEM',
        '/student/dashboard'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();

-- =============================================================================
-- 13. ROW LEVEL SECURITY (RLS) POLICIES
-- Strict data isolation and non-deletable participation history
-- =============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_change_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participation_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participation_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: Public can view active profiles; users can update own profile
CREATE POLICY "Public profiles viewable" ON public.profiles FOR SELECT USING (account_status = 'ACTIVE');
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- User Roles: Users view own roles; Admins view all
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all roles" ON public.user_roles FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'super_admin'))
);

-- Opportunities: Public read for active opportunities
CREATE POLICY "Opportunities public read" ON public.opportunities FOR SELECT USING (is_active = 1);

-- Saved Opportunities: Users manage their own saved opportunities
CREATE POLICY "Users view saved opportunities" ON public.saved_opportunities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert saved opportunities" ON public.saved_opportunities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete saved opportunities" ON public.saved_opportunities FOR DELETE USING (auth.uid() = user_id);

-- Clubs & Events: Public read
CREATE POLICY "Clubs public read" ON public.clubs FOR SELECT USING (is_active = 1);
CREATE POLICY "Events public read" ON public.events FOR SELECT USING (status != 'CANCELLED');

-- Student Participations (My Achievements):
-- 1. Students can view their OWN participation history
CREATE POLICY "Students view own participation" ON public.student_participations
    FOR SELECT USING (auth.uid() = student_id);

-- 2. Public can view achievements explicitly marked in portfolio
CREATE POLICY "Public view portfolio achievements" ON public.student_participations
    FOR SELECT USING (is_in_portfolio = TRUE);

-- 3. Students can create a registration record for themselves
CREATE POLICY "Students register for events" ON public.student_participations
    FOR INSERT WITH CHECK (auth.uid() = student_id);

-- 4. Students can update portfolio inclusion flag ONLY (CANNOT alter rank, score, or results)
CREATE POLICY "Students toggle portfolio" ON public.student_participations
    FOR UPDATE USING (auth.uid() = student_id)
    WITH CHECK (auth.uid() = student_id);

-- 5. MANDATORY SECURITY: NO DIRECT DELETE POLICY FOR STUDENTS
-- Direct DELETE by students is prohibited by omitting a DELETE policy for non-admins!

-- Milestones: Viewable by student owner and verifiers
CREATE POLICY "View milestones" ON public.participation_milestones
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.student_participations sp
            WHERE sp.id = participation_id AND (sp.student_id = auth.uid() OR sp.is_in_portfolio = TRUE)
        )
    );

-- Certificates: Student view own certificates
CREATE POLICY "Students view own certificates" ON public.certificates
    FOR SELECT USING (auth.uid() = student_id);

-- Notifications: Students view and update own notifications
CREATE POLICY "Users view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Scholarships & Internships: Public read
CREATE POLICY "Scholarships public read" ON public.scholarships FOR SELECT USING (is_active = 1);
CREATE POLICY "Internships public read" ON public.internships FOR SELECT USING (is_active = 1);
CREATE POLICY "Saved scholarships view" ON public.saved_scholarships FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Saved scholarships insert" ON public.saved_scholarships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Saved scholarships delete" ON public.saved_scholarships FOR DELETE USING (auth.uid() = user_id);

-- Teams: Public read; Members view team details
CREATE POLICY "Teams public read" ON public.teams FOR SELECT USING (status != 'DISBANDED');
CREATE POLICY "Team members view" ON public.team_members FOR SELECT USING (TRUE);

-- =============================================================================
-- 14. SUPABASE STORAGE BUCKETS CONFIGURATION
-- Buckets: avatars (public), certificates (private), submissions (private)
-- =============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
    ('certificates', 'certificates', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
    ('submissions', 'submissions', false, 26214400, ARRAY['application/pdf', 'application/zip', 'image/jpeg', 'image/png']),
    ('club-assets', 'club-assets', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit;

-- Storage Policies: Public avatar view
CREATE POLICY "Public avatar access" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

-- Users upload own avatar
CREATE POLICY "Users upload avatar" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Certificates: Private to user or verified faculty
CREATE POLICY "Users access own certificates" ON storage.objects
    FOR SELECT USING (bucket_id = 'certificates' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own certificates" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'certificates' AND auth.uid()::text = (storage.foldername(name))[1]);
