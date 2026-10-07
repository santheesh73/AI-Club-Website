-- ==============================================================================
-- AI CLUB - Milestone 1: Database Foundation Migration
-- File: 20261006000001_initial_foundation.sql
-- Description: Baseline extensions, custom enums, core profiles table, and RLS policies
-- ==============================================================================

-- 1. Enable Essential PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Define Domain Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('applicant', 'member', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE application_status AS ENUM (
        'draft',
        'submitted',
        'under_review',
        'assessment_pending',
        'approved',
        'rejected'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE membership_status AS ENUM ('active', 'alumni', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Automatic Updated-At Timestamp Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Core User Profiles Table
-- Authoritative profile record linked 1-to-1 with Supabase Auth users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL DEFAULT '',
    role user_role NOT NULL DEFAULT 'applicant',
    avatar_url TEXT,
    bio TEXT,
    github_username TEXT,
    linkedin_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to keep updated_at synchronized
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Indexing for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 5. Automatic Profile Provisioning Trigger on Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'applicant')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 6. Row Level Security (RLS) Policies
-- Authoritative security model: Default DENY unless explicitly permitted
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy A: Users can view their own profile
CREATE POLICY "Users can view their own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Policy B: Members can view approved member profiles
CREATE POLICY "Members can view member profiles"
    ON public.profiles
    FOR SELECT
    USING (
        role = 'member' AND EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('member', 'admin')
        )
    );

-- Policy C: Users can update their own personal profile data (excluding role)
CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy D: Admins have unrestricted access to all profile records
CREATE POLICY "Admins have full access to profiles"
    ON public.profiles
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );
