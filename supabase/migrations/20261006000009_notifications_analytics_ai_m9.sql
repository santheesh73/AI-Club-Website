-- ==============================================================================
-- AI CLUB - Milestone 9: Notifications, Analytics, AI Intelligence & Engagement
-- File: 20261006000009_notifications_analytics_ai_m9.sql
-- Description: Notifications, preferences, AI insight caching, indexes & RLS
-- ==============================================================================

-- 1. Notification Types & Categories Enum
DO $$ BEGIN
    CREATE TYPE public.notification_type AS ENUM (
        'APPLICATION_STATUS_CHANGED',
        'MEMBERSHIP_ACTIVATED',
        'EVENT_PUBLISHED',
        'EVENT_REGISTRATION_CONFIRMED',
        'EVENT_CANCELLED',
        'EVENT_REMINDER',
        'COURSE_PUBLISHED',
        'COURSE_ENROLLMENT_CONFIRMED',
        'COURSE_COMPLETED',
        'PROJECT_FEATURED',
        'PROJECT_MODERATION',
        'ACHIEVEMENT_UNLOCKED',
        'ADMIN_ANNOUNCEMENT',
        'SYSTEM_ALERT',
        'NEW_APPLICATION',
        'NEW_REPORT',
        'COURSE_ACTIVITY_ALERT',
        'EVENT_ACTIVITY_ALERT'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type public.notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id) WHERE (read_at IS NULL);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

-- 3. Notification Preferences Table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    application_updates BOOLEAN NOT NULL DEFAULT true,
    membership_updates BOOLEAN NOT NULL DEFAULT true,
    event_updates BOOLEAN NOT NULL DEFAULT true,
    course_updates BOOLEAN NOT NULL DEFAULT true,
    community_updates BOOLEAN NOT NULL DEFAULT true,
    system_notifications BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_prefs_user ON public.notification_preferences(user_id);

-- 4. AI Insights Caching Table
CREATE TABLE IF NOT EXISTS public.ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period TEXT NOT NULL DEFAULT '30d',
    summary TEXT NOT NULL,
    platform_overview TEXT NOT NULL,
    member_engagement TEXT NOT NULL,
    learning_insights TEXT NOT NULL,
    event_insights TEXT NOT NULL,
    community_insights TEXT NOT NULL,
    recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
    metrics_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_insights_created_at ON public.ai_insights(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_insights_period ON public.ai_insights(period);

-- 5. Row Level Security Policies

-- Notifications RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification read status"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view and create all notifications"
    ON public.notifications FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Notification Preferences RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notification preferences"
    ON public.notification_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert or update their own notification preferences"
    ON public.notification_preferences FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- AI Insights RLS
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view AI insights"
    ON public.ai_insights FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can create AI insights"
    ON public.ai_insights FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
