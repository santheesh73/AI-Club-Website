-- ==============================================================================
-- AI CLUB - Milestone 4: Admin Control Center, Application Review & Decision Engine
-- File: 20261006000004_admin_review_and_audit_m4.sql
-- Description: Audit logs table, append-only trigger, rejection reason constraint,
--              review indexes, and administrative security policies.
-- ==============================================================================

-- 1. Create Immutable Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL DEFAULT 'APPLICATION',
    entity_id UUID NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    request_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient filtering and historical inspection
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- 2. Append-Only Trigger: Strictly Prevent UPDATE and DELETE Operations on Audit Logs
CREATE OR REPLACE FUNCTION public.prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are immutable append-only records and cannot be modified or deleted.'
        USING ERRCODE = '42501';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_audit_log_mutation ON public.audit_logs;
CREATE TRIGGER trg_prevent_audit_log_mutation
    BEFORE UPDATE OR DELETE ON public.audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_audit_log_mutation();

-- 3. Row Level Security on Audit Logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only Admins can view audit logs
CREATE POLICY "Admins can view audit logs"
    ON public.audit_logs FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Admins / Trusted Backend Services can insert audit logs
CREATE POLICY "Admins can insert audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 4. Constraint: Rejection Reason Required on REJECTED Status
DO $$ BEGIN
    ALTER TABLE public.applications 
    ADD CONSTRAINT chk_applications_rejection_reason 
    CHECK (status != 'rejected' OR (rejection_reason IS NOT NULL AND length(trim(rejection_reason)) >= 3));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 5. Additional Performance Indexes for Admin Queries
CREATE INDEX IF NOT EXISTS idx_applications_reviewed_by ON public.applications(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_applications_submitted_at ON public.applications(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_score ON public.applications(assessment_score DESC);
