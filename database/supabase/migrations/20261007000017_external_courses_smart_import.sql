-- ==============================================================================
-- AI CLUB - Migration 17: Smart External Course URL Import & Metadata Schema
-- File: 20261007000017_external_courses_smart_import.sql
-- Description:
--   1. Adds published_at timestamp column for explicit publication tracking.
--   2. Adds extraction_metadata JSONB column for extraction source transparency.
--   3. Makes description and category nullable to allow saving partial extraction drafts.
--   4. Adds index on published_at and ensures status defaults to draft for new imports.
-- ==============================================================================

DO $$ BEGIN
    -- 1. Add published_at column if not exists
    ALTER TABLE public.external_courses 
    ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

    -- 2. Add extraction_metadata column if not exists
    ALTER TABLE public.external_courses 
    ADD COLUMN IF NOT EXISTS extraction_metadata JSONB DEFAULT '{}'::jsonb;

    -- 3. Allow description and category to be nullable for initial drafts
    ALTER TABLE public.external_courses 
    ALTER COLUMN description DROP NOT NULL;

    ALTER TABLE public.external_courses 
    ALTER COLUMN category DROP NOT NULL;

    -- 4. Set default status to 'draft' for newly imported courses
    ALTER TABLE public.external_courses 
    ALTER COLUMN status SET DEFAULT 'draft';
EXCEPTION
    WHEN others THEN 
        RAISE NOTICE 'Migration 17 notice: %', SQLERRM;
END $$;

-- 5. Index for published_at for rapid candidate retrieval in recommendation engine
CREATE INDEX IF NOT EXISTS idx_external_courses_published_at 
    ON public.external_courses(published_at);

-- 6. Backfill published_at for existing published courses
UPDATE public.external_courses
SET published_at = created_at
WHERE status = 'published' AND published_at IS NULL;
