-- ==============================================================================
-- AI CLUB - Milestone 5: Membership Activation & Member Experience Migration
-- File: 20261006000005_membership_activation_m5.sql
-- Description: Membership table, member number sequence, one-active-membership
--              constraint, RLS policies, and anti-tampering triggers.
-- ==============================================================================

-- 1. Extend membership_status enum to cover complete lifecycle
DO $$ BEGIN
    ALTER TYPE membership_status ADD VALUE IF NOT EXISTS 'pending';
    ALTER TYPE membership_status ADD VALUE IF NOT EXISTS 'expired';
    ALTER TYPE membership_status ADD VALUE IF NOT EXISTS 'revoked';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Transaction-Safe Member Number Sequence & Generator
CREATE SEQUENCE IF NOT EXISTS member_number_seq START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION generate_member_number()
RETURNS TEXT AS $$
BEGIN
    RETURN 'AIC-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('member_number_seq')::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- 3. Dedicated Memberships Table
CREATE TABLE IF NOT EXISTS public.memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE RESTRICT,
    member_number TEXT NOT NULL UNIQUE DEFAULT generate_member_number(),
    status membership_status NOT NULL DEFAULT 'active',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    activated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    suspended_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Critical Database Constraints
-- One Active Membership Rule: A user can only possess AT MOST ONE 'active' membership at any time
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_membership_per_user 
    ON public.memberships (user_id) 
    WHERE (status = 'active');

-- Indexing for high-throughput queries
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON public.memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_application_id ON public.memberships(application_id);
CREATE INDEX IF NOT EXISTS idx_memberships_member_number ON public.memberships(member_number);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON public.memberships(status);
CREATE INDEX IF NOT EXISTS idx_memberships_joined_at ON public.memberships(joined_at DESC);

-- Trigger to keep updated_at synchronized
DROP TRIGGER IF EXISTS set_memberships_updated_at ON public.memberships;
CREATE TRIGGER set_memberships_updated_at
    BEFORE UPDATE ON public.memberships
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Anti-Tampering Trigger: Protect Immutable Membership Identity Attributes
CREATE OR REPLACE FUNCTION public.protect_membership_security_fields()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.member_number IS NOT NULL AND NEW.member_number != OLD.member_number) THEN
        RAISE EXCEPTION 'member_number is immutable and cannot be modified'
            USING ERRCODE = '42501';
    END IF;
    IF (OLD.user_id != NEW.user_id) THEN
        RAISE EXCEPTION 'user_id is immutable on membership records'
            USING ERRCODE = '42501';
    END IF;
    IF (OLD.application_id != NEW.application_id) THEN
        RAISE EXCEPTION 'application_id is immutable on membership records'
            USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_membership_security_fields ON public.memberships;
CREATE TRIGGER trg_protect_membership_security_fields
    BEFORE UPDATE ON public.memberships
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_membership_security_fields();

-- 6. Row Level Security (RLS) Policies
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- Policy A: Members can inspect their own membership record
DROP POLICY IF EXISTS "Users can view own membership" ON public.memberships;
CREATE POLICY "Users can view own membership"
    ON public.memberships FOR SELECT
    USING (auth.uid() = user_id);

-- Policy B: Admins can inspect all membership records
DROP POLICY IF EXISTS "Admins can view all memberships" ON public.memberships;
CREATE POLICY "Admins can view all memberships"
    ON public.memberships FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Policy C: Only Admins / Service Role can insert membership records
DROP POLICY IF EXISTS "Admins can insert memberships" ON public.memberships;
CREATE POLICY "Admins can insert memberships"
    ON public.memberships FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Policy D: Only Admins / Service Role can update membership records
DROP POLICY IF EXISTS "Admins can update memberships" ON public.memberships;
CREATE POLICY "Admins can update memberships"
    ON public.memberships FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
