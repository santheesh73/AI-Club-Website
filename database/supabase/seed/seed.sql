-- ==============================================================================
-- AI CLUB - Local Development Seed Script (Milestone 3)
-- ==============================================================================

-- Include 52 curated assessment questions
\i seed_questions.sql

-- Include Milestone 4 admin and applicant records
\i seed_m4_admin.sql

-- Include Milestone 5 membership records
\i seed_m5_membership.sql

DO $$
BEGIN
    RAISE NOTICE 'AI CLUB database seed initialized for Milestone 5: Membership Activation & Member Experience.';
END $$;
