-- ==============================================================================
-- AI CLUB - Migration 11: Fix Profiles RLS Recursion & Harden Role Authorization
-- File: 20261006000011_fix_profiles_rls_recursion.sql
-- Description: Eliminates PostgreSQL RLS infinite recursion on public.profiles
--              by introducing SECURITY DEFINER role-check helpers (is_admin, is_member_or_admin),
--              re-defining non-recursive profile policies, updating cross-table admin policies,
--              and securing the signup trigger against metadata role injection.
-- ==============================================================================

-- 1. SECURITY DEFINER Helper: is_admin()
-- Evaluates authoritatively without triggering RLS evaluation on profiles.
-- Strictly scoped to public and auth schemas.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT COALESCE(
        (SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid()),
        false
    );
$$;

-- 2. SECURITY DEFINER Helper: is_member_or_admin()
-- Verifies whether caller possesses active member or administrative status.
CREATE OR REPLACE FUNCTION public.is_member_or_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT COALESCE(
        (SELECT role IN ('member', 'admin') FROM public.profiles WHERE id = auth.uid()),
        false
    );
$$;

-- Grant execution privileges to all application roles
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_member_or_admin() TO anon, authenticated, service_role;

-- 3. Re-define Non-Recursive public.profiles RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3.1 Self Read: Authenticated user can view their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- 3.2 Member Read: Approved members can view public profile details of other members
DROP POLICY IF EXISTS "Members can view member profiles" ON public.profiles;
CREATE POLICY "Members can view member profiles"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (
        role = 'member' AND public.is_member_or_admin()
    );

-- 3.3 Self Update: User can update their own profile fields
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 3.4 Self Insert: User can provision their own profile on registration
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- 3.5 Admin Full Access: Administrative management of all profile records
DROP POLICY IF EXISTS "Admins have full access to profiles" ON public.profiles;
CREATE POLICY "Admins have full access to profiles"
    ON public.profiles
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 4. Harden Anti-Privilege Escalation Trigger Function
-- Uses public.is_admin() to safely verify authorization on role changes
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

    -- Prevent self-promotion to admin or member without admin authorization
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        IF NOT public.is_admin() THEN
            RAISE EXCEPTION 'Unauthorized: Users cannot modify their own authorization role.'
                USING ERRCODE = '42501';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- 5. Harden Automatic Profile Provisioning Trigger (auth.users)
-- Ensures search_path is set, qualifies public.user_role, and rejects client metadata role injection.
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
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- 6. Update Cross-Table Policies to Use public.is_admin() Helper
-- Prevents secondary subqueries against profiles and eliminates any indirect recursion

-- 6.1 Applications & Assessments (Milestone 3)
CREATE OR REPLACE FUNCTION public.protect_application_security_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    -- Prevent modification of immutable foreign keys
    IF NEW.id IS DISTINCT FROM OLD.id OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
        RAISE EXCEPTION 'Security violation: Application identifiers cannot be altered.' USING ERRCODE = '42501';
    END IF;

    -- Protect workflow status and assessment results from unauthorized direct updates
    IF (NEW.status IS DISTINCT FROM OLD.status OR
        NEW.assessment_score IS DISTINCT FROM OLD.assessment_score OR
        NEW.assessment_passed IS DISTINCT FROM OLD.assessment_passed OR
        NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by) THEN
        
        -- Check if current user is admin OR if running from authoritative backend service (auth.uid() IS NULL)
        IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
            RAISE EXCEPTION 'Unauthorized: Status and assessment results must be updated via authoritative assessment services.' USING ERRCODE = '42501';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "Users can view own application" ON public.applications;
CREATE POLICY "Users can view own application"
    ON public.applications FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins full access to applications" ON public.applications;
CREATE POLICY "Admins full access to applications"
    ON public.applications FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users can view own attempt" ON public.assessment_attempts;
CREATE POLICY "Users can view own attempt"
    ON public.assessment_attempts FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins full access to attempts" ON public.assessment_attempts;
CREATE POLICY "Admins full access to attempts"
    ON public.assessment_attempts FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users can view own answers" ON public.assessment_answers;
CREATE POLICY "Users can view own answers"
    ON public.assessment_answers FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.assessment_attempts a 
        WHERE a.id = attempt_id AND (a.user_id = auth.uid() OR public.is_admin())
    ));

DROP POLICY IF EXISTS "Only admins can directly query questions table" ON public.assessment_questions;
CREATE POLICY "Only admins can directly query questions table"
    ON public.assessment_questions FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 6.2 Audit Logs (Milestone 4)
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.audit_logs;
CREATE POLICY "Admins can insert audit logs"
    ON public.audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

-- 6.3 Memberships (Milestone 5)
DROP POLICY IF EXISTS "Admins can view all memberships" ON public.memberships;
CREATE POLICY "Admins can view all memberships"
    ON public.memberships FOR SELECT
    TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert memberships" ON public.memberships;
CREATE POLICY "Admins can insert memberships"
    ON public.memberships FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update memberships" ON public.memberships;
CREATE POLICY "Admins can update memberships"
    ON public.memberships FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 6.4 Events & Registrations (Milestone 6)
DROP POLICY IF EXISTS "Admins have full access to events" ON public.events;
CREATE POLICY "Admins have full access to events"
    ON public.events FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins have full access to event registrations" ON public.event_registrations;
CREATE POLICY "Admins have full access to event registrations"
    ON public.event_registrations FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 6.5 Courses & Curriculum (Milestone 7)
DROP POLICY IF EXISTS "Admins manage course categories" ON public.course_categories;
CREATE POLICY "Admins manage course categories"
    ON public.course_categories FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins full management on courses" ON public.courses;
CREATE POLICY "Admins full management on courses"
    ON public.courses FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Members view modules for accessible courses" ON public.course_modules;
CREATE POLICY "Members view modules for accessible courses"
    ON public.course_modules FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.courses
            WHERE id = course_modules.course_id AND (status = 'published' OR status = 'archived')
        )
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "Admins manage course modules" ON public.course_modules;
CREATE POLICY "Admins manage course modules"
    ON public.course_modules FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Members view lessons if enrolled or preview" ON public.course_lessons;
CREATE POLICY "Members view lessons if enrolled or preview"
    ON public.course_lessons FOR SELECT
    TO authenticated
    USING (
        is_preview = true
        OR EXISTS (
            SELECT 1 FROM public.course_modules m
            JOIN public.course_enrollments e ON e.course_id = m.course_id
            WHERE m.id = course_lessons.module_id AND e.user_id = auth.uid() AND e.status = 'active'
        )
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "Admins manage course lessons" ON public.course_lessons;
CREATE POLICY "Admins manage course lessons"
    ON public.course_lessons FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Members view their own course enrollments" ON public.course_enrollments;
CREATE POLICY "Members view their own course enrollments"
    ON public.course_enrollments FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() OR public.is_admin()
    );

DROP POLICY IF EXISTS "Members can update their own enrollment" ON public.course_enrollments;
CREATE POLICY "Members can update their own enrollment"
    ON public.course_enrollments FOR UPDATE
    TO authenticated
    USING (
        user_id = auth.uid() OR public.is_admin()
    );

DROP POLICY IF EXISTS "Members view their own lesson progress" ON public.lesson_progress;
CREATE POLICY "Members view their own lesson progress"
    ON public.lesson_progress FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.course_enrollments e
            WHERE e.id = lesson_progress.enrollment_id AND e.user_id = auth.uid()
        )
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "Members manage their own lesson progress" ON public.lesson_progress;
CREATE POLICY "Members manage their own lesson progress"
    ON public.lesson_progress FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.course_enrollments e
            WHERE e.id = lesson_progress.enrollment_id AND e.user_id = auth.uid()
        )
        OR public.is_admin()
    );

-- 6.6 Projects & Achievements (Milestone 8)
DROP POLICY IF EXISTS projects_admin_all_policy ON public.projects;
CREATE POLICY projects_admin_all_policy
    ON public.projects FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS achievements_admin_all_policy ON public.achievements;
CREATE POLICY achievements_admin_all_policy
    ON public.achievements FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS reports_admin_all_policy ON public.reports;
CREATE POLICY reports_admin_all_policy
    ON public.reports FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS featured_projects_admin_all_policy ON public.featured_projects;
CREATE POLICY featured_projects_admin_all_policy
    ON public.featured_projects FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 6.7 Notifications & Intelligence (Milestone 9)
DROP POLICY IF EXISTS "Admins can view and create all notifications" ON public.notifications;
CREATE POLICY "Admins can view and create all notifications"
    ON public.notifications FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can view AI insights" ON public.ai_insights;
CREATE POLICY "Admins can view AI insights"
    ON public.ai_insights FOR SELECT
    TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can create AI insights" ON public.ai_insights;
CREATE POLICY "Admins can create AI insights"
    ON public.ai_insights FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

-- 7. Verification Notice
DO $$
BEGIN
    RAISE NOTICE 'AI CLUB Migration 11 applied successfully: Profiles RLS recursion resolved and SECURITY DEFINER helpers established.';
END $$;
