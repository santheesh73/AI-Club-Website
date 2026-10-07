-- ==============================================================================
-- AI CLUB - Local Development Seed Script (Milestone 9 Notifications & AI Data)
-- ==============================================================================

DO $$
DECLARE
    admin_id UUID := '00000000-0000-0000-0000-000000000001';
    member_user_id UUID := '00000000-0000-0000-0000-000000000006';
BEGIN
    -- 1. Notification Preferences for Active Member
    INSERT INTO public.notification_preferences (
        user_id,
        application_updates,
        membership_updates,
        event_updates,
        course_updates,
        community_updates,
        system_notifications
    ) VALUES (
        member_user_id,
        true,
        true,
        true,
        true,
        true,
        true
    ) ON CONFLICT (user_id) DO NOTHING;

    -- 2. Sample Notifications for Active Member
    INSERT INTO public.notifications (
        id,
        user_id,
        type,
        title,
        message,
        action_url,
        metadata,
        read_at,
        created_at
    ) VALUES
    (
        'c9111000-0000-0000-0000-000000000001',
        member_user_id,
        'MEMBERSHIP_ACTIVATED',
        'Official Membership Activated',
        'Welcome to AI CLUB! Your digital membership card and student credentials have been confirmed.',
        '/member/membership',
        '{"memberNumber": "AIC-2026-0001"}'::jsonb,
        NOW() - INTERVAL '2 days',
        NOW() - INTERVAL '2 days'
    ),
    (
        'c9111000-0000-0000-0000-000000000002',
        member_user_id,
        'COURSE_ENROLLMENT_CONFIRMED',
        'Enrolled: Applied Generative AI & Large Language Models',
        'You have successfully enrolled in the course. Start module 1 now!',
        '/member/courses/applied-generative-ai-llms',
        '{"courseSlug": "applied-generative-ai-llms"}'::jsonb,
        NOW() - INTERVAL '1 day',
        NOW() - INTERVAL '1 day'
    ),
    (
        'c9111000-0000-0000-0000-000000000003',
        member_user_id,
        'EVENT_REGISTRATION_CONFIRMED',
        'Seat Reserved: Agentic Workflows & Multi-Agent Architecture',
        'Your registration is confirmed. Join link will unlock before the keynote starts.',
        '/member/events/agentic-workflows-workshop',
        '{"eventSlug": "agentic-workflows-workshop"}'::jsonb,
        NULL,
        NOW() - INTERVAL '3 hours'
    ),
    (
        'c9111000-0000-0000-0000-000000000004',
        member_user_id,
        'ACHIEVEMENT_UNLOCKED',
        'Achievement Unlocked: Foundation Member',
        'You have earned the Foundation Member badge for completing onboarding and membership setup.',
        '/member/achievements',
        '{"points": 50}'::jsonb,
        NULL,
        NOW() - INTERVAL '1 hour'
    )
    ON CONFLICT (id) DO NOTHING;

    -- 3. Sample Admin Notifications
    INSERT INTO public.notifications (
        id,
        user_id,
        type,
        title,
        message,
        action_url,
        metadata,
        read_at,
        created_at
    ) VALUES
    (
        'c9111000-0000-0000-0000-000000000005',
        admin_id,
        'NEW_APPLICATION',
        'New Applicant Intake Submitted',
        'Candidate submitted an entrance application and completed the 25-MCQ assessment.',
        '/admin/applications',
        '{"applicationNumber": "AIC-2026-000005"}'::jsonb,
        NULL,
        NOW() - INTERVAL '4 hours'
    ),
    (
        'c9111000-0000-0000-0000-000000000006',
        admin_id,
        'NEW_REPORT',
        'Community Report Filed',
        'A member has submitted a project review report requiring moderation.',
        '/admin/community',
        '{"targetType": "project"}'::jsonb,
        NULL,
        NOW() - INTERVAL '30 minutes'
    )
    ON CONFLICT (id) DO NOTHING;

    -- 4. Initial AI Intelligence Insight Cache
    INSERT INTO public.ai_insights (
        id,
        period,
        summary,
        platform_overview,
        member_engagement,
        learning_insights,
        event_insights,
        community_insights,
        recommendations,
        metrics_snapshot,
        created_by,
        created_at
    ) VALUES (
        'c9112000-0000-0000-0000-000000000001',
        '30d',
        'Platform health is robust with 85% course completion rates and strong workshop attendance.',
        'Total membership has reached sustained momentum across engineering departments.',
        'High weekly active participation across hands-on workshops and project collaborative repositories.',
        'Learners demonstrate greatest engagement in LLM fine-tuning and agentic workflow modules.',
        'Technical workshops operate near 90% seat capacity with low cancellation rates (<5%).',
        'Computer Vision and Generative AI represent the most active project showcase domains.',
        '["Increase intermediate workshop seat capacity for agentic architectures", "Schedule review session for open community project reports", "Publish new advanced reinforcement learning course modules"]'::jsonb,
        '{"totalMembers": 42, "activeCourses": 4, "totalProjects": 18}'::jsonb,
        admin_id,
        NOW() - INTERVAL '1 hour'
    ) ON CONFLICT (id) DO NOTHING;

END $$;
