-- ==============================================================================
-- AI CLUB - Milestone 6: Events & Activities Platform Migration
-- File: 20261006000006_events_and_activities_m6.sql
-- Description: Event schema, event categories, lifecycle enums, capacity constraints,
--              registrations table, transaction concurrency safety, and RLS policies.
-- ==============================================================================

-- 1. Create Enums for Event Domain
DO $$ BEGIN
    CREATE TYPE event_category AS ENUM (
        'workshop',
        'hackathon',
        'tech_talk',
        'webinar',
        'competition',
        'meetup',
        'bootcamp',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE event_status AS ENUM (
        'draft',
        'published',
        'ongoing',
        'completed',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE event_mode AS ENUM (
        'physical',
        'online',
        'hybrid'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE event_eligibility AS ENUM (
        'public',
        'members_only',
        'admin_only'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE registration_status AS ENUM (
        'registered',
        'cancelled',
        'attended',
        'no_show'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Events Table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL CHECK (length(trim(title)) >= 3),
    slug TEXT NOT NULL UNIQUE CHECK (length(trim(slug)) >= 3),
    short_description TEXT NOT NULL CHECK (length(trim(short_description)) >= 5),
    description TEXT NOT NULL CHECK (length(trim(description)) >= 10),
    category event_category NOT NULL DEFAULT 'workshop',
    event_mode event_mode NOT NULL DEFAULT 'physical',
    location TEXT,
    is_online BOOLEAN NOT NULL DEFAULT false,
    meeting_url TEXT,
    cover_image_url TEXT,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    registration_open_at TIMESTAMPTZ NOT NULL,
    registration_close_at TIMESTAMPTZ NOT NULL,
    capacity INTEGER CHECK (capacity IS NULL OR capacity > 0),
    eligibility event_eligibility NOT NULL DEFAULT 'members_only',
    status event_status NOT NULL DEFAULT 'draft',
    speaker TEXT,
    organizer TEXT,
    requirements TEXT,
    tags TEXT[] NOT NULL DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    published_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints enforcing valid scheduling and window logic
    CONSTRAINT chk_event_end_after_start CHECK (end_at > start_at),
    CONSTRAINT chk_event_reg_close_after_open CHECK (registration_close_at > registration_open_at),
    CONSTRAINT chk_event_reg_close_before_start CHECK (registration_close_at <= start_at)
);

-- Trigger to keep events.updated_at synchronized
DROP TRIGGER IF EXISTS set_events_updated_at ON public.events;
CREATE TRIGGER set_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Indexes for events query performance
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_start_at ON public.events(start_at);
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);
CREATE INDEX IF NOT EXISTS idx_events_eligibility ON public.events(eligibility);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events(created_by);

-- 3. Create Event Registrations Table
CREATE TABLE IF NOT EXISTS public.event_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status registration_status NOT NULL DEFAULT 'registered',
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cancelled_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to keep event_registrations.updated_at synchronized
DROP TRIGGER IF EXISTS set_event_registrations_updated_at ON public.event_registrations;
CREATE TRIGGER set_event_registrations_updated_at
    BEFORE UPDATE ON public.event_registrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- One Active Registration Rule: A user can only hold AT MOST ONE 'registered' status per event
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_registration_per_event_user
    ON public.event_registrations (event_id, user_id)
    WHERE (status = 'registered');

-- Performance indexes for registrations
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON public.event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON public.event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON public.event_registrations(status);
CREATE INDEX IF NOT EXISTS idx_event_registrations_registered_at ON public.event_registrations(registered_at DESC);

-- 4. Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- 4.1 Events Table Policies
-- Policy A: Anyone with admin role can perform ALL operations on events
DROP POLICY IF EXISTS "Admins have full access to events" ON public.events;
CREATE POLICY "Admins have full access to events"
    ON public.events
    FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Policy B: Active members can view published, ongoing, and completed member-eligible events
DROP POLICY IF EXISTS "Active members can view visible events" ON public.events;
CREATE POLICY "Active members can view visible events"
    ON public.events
    FOR SELECT
    USING (
        status IN ('published', 'ongoing', 'completed')
        AND eligibility IN ('public', 'members_only')
        AND (
            eligibility = 'public'
            OR EXISTS (
                SELECT 1 FROM public.memberships
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    );

-- 4.2 Event Registrations Table Policies
-- Policy A: Admins can inspect and manage all registrations
DROP POLICY IF EXISTS "Admins have full access to event registrations" ON public.event_registrations;
CREATE POLICY "Admins have full access to event registrations"
    ON public.event_registrations
    FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Policy B: Users can view their own registrations
DROP POLICY IF EXISTS "Users can view own event registrations" ON public.event_registrations;
CREATE POLICY "Users can view own event registrations"
    ON public.event_registrations
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy C: Active members can register themselves for eligible events
DROP POLICY IF EXISTS "Active members can register for events" ON public.event_registrations;
CREATE POLICY "Active members can register for events"
    ON public.event_registrations
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.memberships
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- Policy D: Users can cancel their own registrations
DROP POLICY IF EXISTS "Users can cancel own registration" ON public.event_registrations;
CREATE POLICY "Users can cancel own registration"
    ON public.event_registrations
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
