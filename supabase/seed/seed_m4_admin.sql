-- ==============================================================================
-- AI CLUB - Local Development Seed Script (Milestone 4 Admin Sample Data)
-- ==============================================================================

DO $$
DECLARE
    admin_id UUID := '00000000-0000-0000-0000-000000000001';
    student_1_id UUID := '00000000-0000-0000-0000-000000000002';
    student_2_id UUID := '00000000-0000-0000-0000-000000000003';
    student_3_id UUID := '00000000-0000-0000-0000-000000000004';
    student_4_id UUID := '00000000-0000-0000-0000-000000000005';
BEGIN
    -- 1. Ensure Profiles Exist
    INSERT INTO public.profiles (id, email, full_name, role, department, year, register_number, skills)
    VALUES
        (admin_id, 'admin@aiclub.internal', 'Lead Administrator', 'admin', 'Computer Science', 4, 'REG-ADMIN-01', ARRAY['Administration', 'System Security']),
        (student_1_id, 'rahul.sharma@aiclub.internal', 'Rahul Sharma', 'applicant', 'CSE', 3, '2023CSE0101', ARRAY['Python', 'PyTorch', 'Computer Vision']),
        (student_2_id, 'priya.patel@aiclub.internal', 'Priya Patel', 'applicant', 'AI&DS', 3, '2023AIDS0204', ARRAY['TensorFlow', 'NLP', 'Transformers']),
        (student_3_id, 'arjun.verma@aiclub.internal', 'Arjun Verma', 'applicant', 'ECE', 2, '2024ECE0315', ARRAY['Embedded Systems', 'TinyML']),
        (student_4_id, 'ananya.iyer@aiclub.internal', 'Ananya Iyer', 'applicant', 'IT', 4, '2022IT0419', ARRAY['Full Stack AI', 'FastAPI', 'LangChain'])
    ON CONFLICT (id) DO UPDATE SET
        role = EXCLUDED.role,
        full_name = EXCLUDED.full_name;

    -- 2. Seed Sample Applications Across Key Statuses
    INSERT INTO public.applications (
        id, user_id, application_number, status, submitted_at,
        assessment_score, assessment_percentage, assessment_passed
    )
    VALUES
        ('10000000-0000-0000-0000-000000000001', student_1_id, 'AIC-2026-000101', 'under_review', NOW() - INTERVAL '2 days', 22.0, 88.0, true),
        ('10000000-0000-0000-0000-000000000002', student_2_id, 'AIC-2026-000102', 'under_review', NOW() - INTERVAL '1 day', 24.0, 96.0, true),
        ('10000000-0000-0000-0000-000000000003', student_3_id, 'AIC-2026-000103', 'under_review', NOW() - INTERVAL '5 hours', 19.0, 76.0, true),
        ('10000000-0000-0000-0000-000000000004', student_4_id, 'AIC-2026-000104', 'under_review', NOW() - INTERVAL '3 hours', 21.0, 84.0, true)
    ON CONFLICT (user_id) DO NOTHING;

    RAISE NOTICE 'Milestone 4 Admin and sample applicant seeds successfully applied.';
END $$;
