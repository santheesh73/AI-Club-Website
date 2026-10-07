-- ==============================================================================
-- AI CLUB - Local Development Seed Script (Milestone 3)
-- ==============================================================================

-- Include 52 curated assessment questions
\i seed_questions.sql

-- Include Milestone 4 admin and applicant records
\i seed_m4_admin.sql

-- Include Milestone 5 membership records
\i seed_m5_membership.sql

-- Include Milestone 6 events records
\i seed_m6_events.sql

-- Include Milestone 7 courses & learning records
\i seed_m7_courses.sql

-- Include Milestone 8 projects & achievements records
\i seed_m8_projects.sql

-- Include Milestone 9 notifications, analytics & AI records
\i seed_m9_notifications.sql

DO $$
BEGIN
    RAISE NOTICE 'AI CLUB database seed initialized for Milestone 9: Notifications, Analytics, AI Intelligence & Engagement Platform.';
END $$;
