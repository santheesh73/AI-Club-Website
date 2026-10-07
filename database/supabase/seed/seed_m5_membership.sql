-- ==============================================================================
-- AI CLUB - Local Development Seed Script (Milestone 5 Membership Sample Data)
-- ==============================================================================

DO $$
DECLARE
    admin_id UUID := '00000000-0000-0000-0000-000000000001';
    member_user_id UUID := '00000000-0000-0000-0000-000000000006';
    member_app_id UUID := '10000000-0000-0000-0000-000000000006';
BEGIN
    -- 1. Ensure Profile for an Active Member Exists
    INSERT INTO public.profiles (
        id, email, full_name, role, department, year, register_number, skills, interests
    )
    VALUES (
        member_user_id,
        'sri.nikesh@aiclub.internal',
        'Sri Nikesh K',
        'member',
        'Artificial Intelligence & Data Science',
        3,
        '2023AIDS0001',
        ARRAY['PyTorch', 'Large Language Models', 'Reinforcement Learning'],
        ARRAY['Autonomous Agents', 'Deep Learning Research']
    )
    ON CONFLICT (id) DO UPDATE SET
        role = 'member',
        full_name = EXCLUDED.full_name;

    -- 2. Approved Application for the Member
    INSERT INTO public.applications (
        id, user_id, application_number, status, submitted_at,
        assessment_score, assessment_percentage, assessment_passed,
        reviewed_at, reviewed_by, admin_notes
    )
    VALUES (
        member_app_id,
        member_user_id,
        'AIC-2026-000005',
        'approved',
        NOW() - INTERVAL '3 days',
        23.0,
        92.0,
        true,
        NOW() - INTERVAL '2 days',
        admin_id,
        'Exceptional assessment performance and project experience.'
    )
    ON CONFLICT (user_id) DO NOTHING;

    -- 3. Membership Record
    INSERT INTO public.memberships (
        id, user_id, application_id, member_number, status,
        joined_at, activated_at, activated_by
    )
    VALUES (
        '20000000-0000-0000-0000-000000000001',
        member_user_id,
        member_app_id,
        'AIC-2026-0001',
        'active',
        NOW() - INTERVAL '2 days',
        NOW() - INTERVAL '2 days',
        admin_id
    )
    ON CONFLICT (user_id) DO NOTHING;

    RAISE NOTICE 'Milestone 5 Membership seed successfully applied.';
END $$;
