-- ==============================================================================
-- AI CLUB - Local Development Seed Script (Milestone 3)
-- ==============================================================================

-- Include 52 curated assessment questions
\i seed_questions.sql

-- Include Milestone 4 admin and applicant records
\i seed_m4_admin.sql

DO $$
BEGIN
    RAISE NOTICE 'AI CLUB database seed initialized for Milestone 4: Admin Control Center & Application Review.';
END $$;
