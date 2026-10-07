-- ==============================================================================
-- AI CLUB - Migration 14: Harden Admin Identity & Authorization
-- File: 20261007000014_harden_admin_identity_and_authorization.sql
-- Description:
--   1. Hardens public.is_admin() SECURITY DEFINER helper to strictly require
--      BOTH role = 'admin' AND email = 'santheesh651@gmail.com'.
--   2. Hardens public.is_member_or_admin() accordingly.
--   3. Hardens protect_profile_security_fields() trigger:
--      - Allows service_role backend operations while strictly enforcing the
--        santheesh651@gmail.com email check for any 'admin' role assignment.
--      - Completely blocks authenticated client users from modifying their role.
--   4. Preserves hardcoded 'applicant' role in handle_new_user() on public registration.
-- ==============================================================================

-- 1. Canonical is_admin() SECURITY DEFINER Helper
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT COALESCE(
        (
            SELECT (
                p.role = 'admin' 
                AND lower(trim(p.email)) = 'santheesh651@gmail.com'
            )
            FROM public.profiles p
            WHERE p.id = auth.uid()
        ),
        false
    );
$$;

-- 2. Canonical is_member_or_admin() SECURITY DEFINER Helper
CREATE OR REPLACE FUNCTION public.is_member_or_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT COALESCE(
        (
            SELECT (
                p.role = 'member' 
                OR (p.role = 'admin' AND lower(trim(p.email)) = 'santheesh651@gmail.com')
            )
            FROM public.profiles p
            WHERE p.id = auth.uid()
        ),
        false
    );
$$;

-- Grant execution to all standard roles
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_member_or_admin() TO anon, authenticated, service_role;

-- 3. Hardened Profile Security Trigger Function
CREATE OR REPLACE FUNCTION public.protect_profile_security_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
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

    -- Prevent self-promotion to admin or member without authoritative admin authorization
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        -- Allow authoritative service_role operations while enforcing email allowlist
        IF (auth.jwt() ->> 'role') = 'service_role' OR current_user IN ('postgres', 'supabase_admin') THEN
            IF NEW.role = 'admin' AND lower(trim(NEW.email)) != 'santheesh651@gmail.com' THEN
                RAISE EXCEPTION 'Security violation: Only santheesh651@gmail.com is authorized for the admin role.'
                    USING ERRCODE = '42501';
            END IF;
            RETURN NEW;
        END IF;

        -- Authenticated client users must be validated through is_admin()
        IF NOT public.is_admin() THEN
            RAISE EXCEPTION 'Unauthorized: Users cannot modify their own authorization role.'
                USING ERRCODE = '42501';
        END IF;

        -- Even if an authorized admin updates a role to 'admin',
        -- that target account's email MUST strictly be santheesh651@gmail.com
        IF NEW.role = 'admin' AND lower(trim(NEW.email)) != 'santheesh651@gmail.com' THEN
            RAISE EXCEPTION 'Security violation: Only santheesh651@gmail.com is authorized for the admin role.'
                USING ERRCODE = '42501';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- 4. Automatic Profile Provisioning Trigger (auth.users)
-- Ensures initial role is strictly 'applicant'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, auth
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        'applicant'::public.user_role -- Strictly hardcoded; cannot be manipulated by client metadata
    );
    RETURN NEW;
END;
$$;
