-- ==============================================================================
-- AI CLUB - Local Development Seed Script (Milestone 3)
-- ==============================================================================

-- Include 52 curated assessment questions
\i seed_questions.sql

DO $$
BEGIN
    RAISE NOTICE 'AI CLUB database seed initialized for Milestone 3: Applications & Assessment Engine.';
END $$;
