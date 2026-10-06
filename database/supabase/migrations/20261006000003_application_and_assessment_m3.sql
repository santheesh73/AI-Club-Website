-- ==============================================================================
-- AI CLUB - Milestone 3: Applications & 25-MCQ Assessment Engine Migration
-- File: 20261006000003_application_and_assessment_m3.sql
-- Description: Applications table, 25-MCQ question bank, attempts, autosaved answers,
--              server-authoritative timer, and anti-tampering triggers.
-- ==============================================================================

-- 1. Ensure Domain Enum Covers M3 Application Lifecycle
DO $$ BEGIN
    ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'test_required';
    ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'test_in_progress';
    ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'test_completed';
    ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'waitlisted';
    ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'withdrawn';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Sequence for Concurrent-Safe Application Numbers
CREATE SEQUENCE IF NOT EXISTS application_number_seq START WITH 1 INCREMENT BY 1;

-- Function to generate human-readable unique application number: e.g. AIC-2026-000001
CREATE OR REPLACE FUNCTION generate_application_number()
RETURNS TEXT AS $$
BEGIN
    RETURN 'AIC-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('application_number_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- 3. Applications Table
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    application_number TEXT NOT NULL UNIQUE DEFAULT generate_application_number(),
    status application_status NOT NULL DEFAULT 'test_required',
    submitted_at TIMESTAMPTZ,
    assessment_score NUMERIC(5,2),
    assessment_percentage NUMERIC(5,2),
    assessment_passed BOOLEAN,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id),
    admin_notes TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_applications_user_id UNIQUE (user_id)
);

-- Trigger to sync updated_at
DROP TRIGGER IF EXISTS set_applications_updated_at ON public.applications;
CREATE TRIGGER set_applications_updated_at
    BEFORE UPDATE ON public.applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Indexes for applications
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_number ON public.applications(application_number);

-- 4. Assessment Questions Bank (Sensitive - Answer Key Server-Guarded)
CREATE TABLE IF NOT EXISTS public.assessment_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_text TEXT NOT NULL,
    category TEXT NOT NULL,
    difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option CHAR(1) NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
    marks NUMERIC(3,1) NOT NULL DEFAULT 1.0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_category ON public.assessment_questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_active ON public.assessment_questions(is_active);

-- 5. Assessment Attempts Table (One attempt per application)
CREATE TABLE IF NOT EXISTS public.assessment_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'SUBMITTED', 'EXPIRED')),
    question_ids UUID[] NOT NULL, -- Exactly 25 question IDs in persistent assigned order
    duration_seconds INT NOT NULL DEFAULT 1800, -- 30 minutes
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    submitted_at TIMESTAMPTZ,
    score NUMERIC(5,2) DEFAULT 0,
    percentage NUMERIC(5,2) DEFAULT 0,
    passed BOOLEAN DEFAULT false,
    correct_count INT DEFAULT 0,
    wrong_count INT DEFAULT 0,
    unanswered_count INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_assessment_attempts_application UNIQUE (application_id)
);

CREATE INDEX IF NOT EXISTS idx_attempts_user_id ON public.assessment_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_application ON public.assessment_attempts(application_id);

-- 6. Assessment Answers Table (Autosaved Student Responses)
CREATE TABLE IF NOT EXISTS public.assessment_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.assessment_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.assessment_questions(id) ON DELETE CASCADE,
    selected_option CHAR(1) NOT NULL CHECK (selected_option IN ('A', 'B', 'C', 'D')),
    answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_assessment_answers_attempt_question UNIQUE (attempt_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_answers_attempt ON public.assessment_answers(attempt_id);

-- 7. Security Trigger: Prevent Student Tampering with Application Results
CREATE OR REPLACE FUNCTION public.protect_application_security_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent altering application number or user_id
    IF NEW.application_number IS DISTINCT FROM OLD.application_number THEN
        RAISE EXCEPTION 'Security violation: Application number is immutable.' USING ERRCODE = '42501';
    END IF;
    IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
        RAISE EXCEPTION 'Security violation: Application ownership cannot be transferred.' USING ERRCODE = '42501';
    END IF;

    -- Non-admin callers cannot manipulate status, score, or review fields
    IF (NEW.status IS DISTINCT FROM OLD.status OR
        NEW.assessment_score IS DISTINCT FROM OLD.assessment_score OR
        NEW.assessment_passed IS DISTINCT FROM OLD.assessment_passed OR
        NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by) THEN
        
        -- Check if current user is admin OR if running from authoritative backend service
        IF auth.uid() IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
        ) THEN
            RAISE EXCEPTION 'Unauthorized: Status and assessment results must be updated via authoritative assessment services.' USING ERRCODE = '42501';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_application_security_fields ON public.applications;
CREATE TRIGGER trg_protect_application_security_fields
    BEFORE UPDATE ON public.applications
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_application_security_fields();

-- 8. Row Level Security Policies

-- A. Applications
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own application"
    ON public.applications FOR SELECT
    USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can create own application"
    ON public.applications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins full access to applications"
    ON public.applications FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- B. Assessment Attempts
ALTER TABLE public.assessment_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attempt"
    ON public.assessment_attempts FOR SELECT
    USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins full access to attempts"
    ON public.assessment_attempts FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- C. Assessment Answers
ALTER TABLE public.assessment_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own answers"
    ON public.assessment_answers FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.assessment_attempts a WHERE a.id = attempt_id AND (a.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))));

CREATE POLICY "Users can insert/update own answers during active attempt"
    ON public.assessment_answers FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.assessment_attempts a 
            WHERE a.id = attempt_id 
              AND a.user_id = auth.uid() 
              AND a.status = 'IN_PROGRESS' 
              AND a.expires_at > NOW()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.assessment_attempts a 
            WHERE a.id = attempt_id 
              AND a.user_id = auth.uid() 
              AND a.status = 'IN_PROGRESS' 
              AND a.expires_at > NOW()
        )
    );

-- D. Assessment Questions Bank (Strictly Protected - No Client Access to Answer Keys)
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can directly query questions table"
    ON public.assessment_questions FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
