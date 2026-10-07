-- ==============================================================================
-- AI CLUB - Milestone 10: Production Hardening, Security, Storage & Launch Readiness
-- Migration: 20261006000010_production_hardening_m10.sql
-- Description: Supabase storage buckets, storage RLS policies, high-throughput indexes,
--              integrity constraints, and database hardening.
-- ==============================================================================

-- 1. Storage Buckets Configuration (Avatars & Project Media)
DO $$
BEGIN
    -- Check if storage schema exists (standard Supabase environment)
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') THEN
        -- Insert or configure public avatars bucket
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'avatars',
            'avatars',
            true,
            2097152, -- 2MB limit
            ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
        )
        ON CONFLICT (id) DO UPDATE SET
            public = true,
            file_size_limit = 2097152,
            allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

        -- Insert or configure project-media bucket
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'project-media',
            'project-media',
            true,
            5242880, -- 5MB limit
            ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
        )
        ON CONFLICT (id) DO UPDATE SET
            public = true,
            file_size_limit = 5242880,
            allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    END IF;
END $$;

-- 2. Storage Row-Level Security Policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
        -- Enable RLS on storage.objects
        ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

        -- Public Read Access for avatars and project-media
        DROP POLICY IF EXISTS "Public Read Avatars and Media" ON storage.objects;
        CREATE POLICY "Public Read Avatars and Media"
            ON storage.objects FOR SELECT
            USING (bucket_id IN ('avatars', 'project-media'));

        -- User Own Avatar Upload Policy (path must begin with user's auth.uid)
        DROP POLICY IF EXISTS "Users can manage own avatar" ON storage.objects;
        CREATE POLICY "Users can manage own avatar"
            ON storage.objects FOR ALL
            TO authenticated
            USING (
                bucket_id = 'avatars' 
                AND (storage.foldername(name))[1] = auth.uid()::text
            )
            WITH CHECK (
                bucket_id = 'avatars' 
                AND (storage.foldername(name))[1] = auth.uid()::text
            );

        -- Active Member Project Media Upload Policy
        DROP POLICY IF EXISTS "Members can upload project media" ON storage.objects;
        CREATE POLICY "Members can upload project media"
            ON storage.objects FOR ALL
            TO authenticated
            USING (
                bucket_id = 'project-media' 
                AND (storage.foldername(name))[1] = auth.uid()::text
                AND (
                    EXISTS (
                        SELECT 1 FROM public.memberships 
                        WHERE user_id = auth.uid() AND status = 'active'
                    )
                    OR EXISTS (
                        SELECT 1 FROM public.profiles 
                        WHERE id = auth.uid() AND role = 'admin'
                    )
                )
            )
            WITH CHECK (
                bucket_id = 'project-media' 
                AND (storage.foldername(name))[1] = auth.uid()::text
                AND (
                    EXISTS (
                        SELECT 1 FROM public.memberships 
                        WHERE user_id = auth.uid() AND status = 'active'
                    )
                    OR EXISTS (
                        SELECT 1 FROM public.profiles 
                        WHERE id = auth.uid() AND role = 'admin'
                    )
                )
            );

        -- Admins Full Access to All Storage Objects
        DROP POLICY IF EXISTS "Admins full storage access" ON storage.objects;
        CREATE POLICY "Admins full storage access"
            ON storage.objects FOR ALL
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM public.profiles 
                    WHERE id = auth.uid() AND role = 'admin'
                )
            );
    END IF;
END $$;

-- 3. High-Throughput Performance Indexes
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_status 
    ON public.event_registrations(event_id, status);

CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_status 
    ON public.course_enrollments(course_id, status);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_enrollment_completed 
    ON public.lesson_progress(enrollment_id, completed);

CREATE INDEX IF NOT EXISTS idx_projects_category_status 
    ON public.projects(category_id, status);

CREATE INDEX IF NOT EXISTS idx_achievements_category_status 
    ON public.achievements(category_id, status);

CREATE INDEX IF NOT EXISTS idx_reports_status_created 
    ON public.reports(status, created_at DESC);

-- 4. Integrity Constraints Hardening
DO $$
BEGIN
    -- Check constraint on applications: valid score range
    ALTER TABLE public.applications 
        ADD CONSTRAINT chk_applications_score_range 
        CHECK (assessment_score IS NULL OR (assessment_score >= 0 AND assessment_score <= 25));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
    -- Check constraint on assessment attempts: valid score range
    ALTER TABLE public.assessment_attempts 
        ADD CONSTRAINT chk_attempts_score_range 
        CHECK (score IS NULL OR (score >= 0 AND score <= 25));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 5. Complete Migration Verification Notice
DO $$
BEGIN
    RAISE NOTICE 'AI CLUB Milestone 10: Production Hardening and Security Migration successfully applied.';
END $$;
