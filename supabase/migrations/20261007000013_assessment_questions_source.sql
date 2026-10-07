-- ==============================================================================
-- AI CLUB - Migration 13: Assessment Questions Source Tag & Staging Lifecycle
-- File: 20261007000013_assessment_questions_source.sql
-- Description: Adds 'source' column ('MANUAL' vs 'AI_GENERATED') to
--              assessment_questions to distinguish AI-generated questions from manual questions.
--              Adds index for fast filtering by status and source.
-- ==============================================================================

DO $$ BEGIN
    ALTER TABLE public.assessment_questions 
    ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'MANUAL' 
    CHECK (source IN ('MANUAL', 'AI_GENERATED'));
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_questions_status_source 
    ON public.assessment_questions(status, source);
