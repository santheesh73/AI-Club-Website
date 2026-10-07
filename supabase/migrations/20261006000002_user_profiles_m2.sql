-- ==============================================================================
-- AI CLUB - Milestone 2: User Profiles & Identity Migration
-- File: 20261006000002_user_profiles_m2.sql
-- Description: Extends profiles table with academic & portfolio attributes,
--              hardens RLS, and adds security triggers against privilege escalation.
-- ==============================================================================

-- 1. Extend public.profiles with Academic and Portfolio Fields
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS register_number TEXT,
    ADD COLUMN IF NOT EXISTS department TEXT,
    ADD COLUMN IF NOT EXISTS year SMALLINT,
    ADD COLUMN IF NOT EXISTS section TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}'::TEXT[],
    ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}'::TEXT[],
    ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
    ADD COLUMN IF NOT EXISTS github_url TEXT;

-- 2. Add Register Number Uniqueness Constraint (Nullable Unique)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_profiles_register_number'
    ) THEN
        ALTER TABLE public.profiles
            ADD CONSTRAINT uq_profiles_register_number UNIQUE (register_number);
    END IF;
END $$;

-- 3. Add Domain Validation Constraints
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_profiles_year') THEN
        ALTER TABLE public.profiles
            ADD CONSTRAINT chk_profiles_year CHECK (year IS NULL OR (year >= 1 AND year <= 5));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_profiles_bio_length') THEN
        ALTER TABLE public.profiles
            ADD CONSTRAINT chk_profiles_bio_length CHECK (bio IS NULL OR char_length(bio) <= 1000);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_profiles_name_length') THEN
        ALTER TABLE public.profiles
            ADD CONSTRAINT chk_profiles_name_length CHECK (char_length(full_name) <= 100);
    END IF;
END $$;

-- 4. Create Indexes for Common Query Filters
CREATE INDEX IF NOT EXISTS idx_profiles_register_number ON public.profiles(register_number);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON public.profiles(department);

-- 5. Anti-Privilege Escalation Trigger
-- Strictly prevents non-admins from changing their role or mutating id / email
CREATE OR REPLACE FUNCTION public.protect_profile_security_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent modification of immutable primary key
    IF NEW.id IS DISTINCT FROM OLD.id THEN
        RAISE EXCEPTION 'Security violation: Profile ID cannot be altered.'
            USING ERRCODE = '42501';
    END IF;

    -- Prevent modification of email directly on profile
    IF NEW.email IS DISTINCT FROM OLD.email THEN
        RAISE EXCEPTION 'Security violation: Email must be updated via Supabase Auth workflows.'
            USING ERRCODE = '42501';
    END IF;

    -- Prevent self-promotion to admin or member without admin authorization
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        ) THEN
            RAISE EXCEPTION 'Unauthorized: Users cannot modify their own authorization role.'
                USING ERRCODE = '42501';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_profile_security_fields ON public.profiles;
CREATE TRIGGER trg_protect_profile_security_fields
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_profile_security_fields();

-- 6. Ensure Self-Creation Insert Policy exists
-- In case a user profile is provisioned from frontend rather than trigger
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert their own profile'
    ) THEN
        CREATE POLICY "Users can insert their own profile"
            ON public.profiles
            FOR INSERT
            WITH CHECK (auth.uid() = id);
    END IF;
END $$;
