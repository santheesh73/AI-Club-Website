-- ============================================================================
-- AI CLUB — Milestone 8: Projects, Achievements & Community Showcase Platform
-- Migration: 20261006000008_projects_achievements_m8.sql
-- ============================================================================

-- 1. ENUMS
DO $$ BEGIN
  CREATE TYPE public.project_status AS ENUM ('draft', 'published', 'archived', 'hidden');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.project_visibility AS ENUM ('public', 'members_only');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.project_link_type AS ENUM ('github', 'demo', 'docs', 'paper', 'dataset', 'video', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.project_media_type AS ENUM ('image', 'video', 'document');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.achievement_status AS ENUM ('draft', 'published', 'hidden');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.report_target_type AS ENUM ('project', 'achievement');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.report_reason AS ENUM ('inappropriate', 'spam', 'copyright', 'misleading', 'abuse', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.report_status AS ENUM ('open', 'under_review', 'resolved', 'dismissed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. TABLES

-- 2.1 Project Categories
CREATE TABLE IF NOT EXISTS public.project_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.2 Technologies Dictionary
CREATE TABLE IF NOT EXISTS public.technologies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'General',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.3 Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  short_description TEXT NOT NULL,
  description TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES public.project_categories(id) ON DELETE RESTRICT,
  status public.project_status NOT NULL DEFAULT 'draft',
  visibility public.project_visibility NOT NULL DEFAULT 'public',
  cover_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  hidden_at TIMESTAMPTZ,
  hidden_reason TEXT,
  CONSTRAINT chk_project_title_len CHECK (char_length(title) >= 3 AND char_length(title) <= 255),
  CONSTRAINT chk_project_short_desc_len CHECK (char_length(short_description) >= 5 AND char_length(short_description) <= 500)
);

-- 2.4 Project Technologies (Many-to-Many Join)
CREATE TABLE IF NOT EXISTS public.project_technologies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  technology_id UUID NOT NULL REFERENCES public.technologies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_project_technology UNIQUE (project_id, technology_id)
);

-- 2.5 Project Contributors
CREATE TABLE IF NOT EXISTS public.project_contributors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'contributor',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_project_contributor UNIQUE (project_id, user_id)
);

-- 2.6 Project Links
CREATE TABLE IF NOT EXISTS public.project_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  link_type public.project_link_type NOT NULL DEFAULT 'other',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_project_link_url CHECK (url ~* '^https?://'),
  CONSTRAINT chk_project_link_position CHECK (position >= 0)
);

-- 2.7 Project Media (Screenshots, Demo images)
CREATE TABLE IF NOT EXISTS public.project_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type public.project_media_type NOT NULL DEFAULT 'image',
  alt_text TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_project_media_url CHECK (media_url ~* '^https?://'),
  CONSTRAINT chk_project_media_position CHECK (position >= 0)
);

-- 2.8 Achievement Categories
CREATE TABLE IF NOT EXISTS public.achievement_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.9 Achievements Table
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.achievement_categories(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  issuing_organization TEXT NOT NULL,
  achievement_date DATE NOT NULL,
  credential_url TEXT,
  image_url TEXT,
  status public.achievement_status NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_achievement_credential_url CHECK (credential_url IS NULL OR credential_url ~* '^https?://')
);

-- 2.10 Featured Projects (Admin Curation)
CREATE TABLE IF NOT EXISTS public.featured_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE UNIQUE,
  position INTEGER NOT NULL DEFAULT 0,
  featured_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  featured_until TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_featured_position CHECK (position >= 0)
);

-- 2.11 Content Reports
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type public.report_target_type NOT NULL,
  target_id UUID NOT NULL,
  reason public.report_reason NOT NULL,
  description TEXT NOT NULL,
  status public.report_status NOT NULL DEFAULT 'open',
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint: Prevent duplicate open reports on the same target by the same member
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_open_report_per_target_user
  ON public.reports(reporter_id, target_type, target_id)
  WHERE (status IN ('open', 'under_review'));

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_projects_owner ON public.projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_visibility ON public.projects(visibility);
CREATE INDEX IF NOT EXISTS idx_projects_category ON public.projects(category_id);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON public.projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_published_at ON public.projects(published_at);
CREATE INDEX IF NOT EXISTS idx_project_tech_proj ON public.project_technologies(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tech_tech ON public.project_technologies(technology_id);
CREATE INDEX IF NOT EXISTS idx_project_contrib_proj ON public.project_contributors(project_id);
CREATE INDEX IF NOT EXISTS idx_project_contrib_user ON public.project_contributors(user_id);
CREATE INDEX IF NOT EXISTS idx_project_links_proj ON public.project_links(project_id, position);
CREATE INDEX IF NOT EXISTS idx_project_media_proj ON public.project_media(project_id, position);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON public.achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_cat ON public.achievements(category_id);
CREATE INDEX IF NOT EXISTS idx_achievements_status ON public.achievements(status);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_target ON public.reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_featured_pos ON public.featured_projects(position);

-- 4. ROW-LEVEL SECURITY (RLS)
ALTER TABLE public.project_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_technologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_contributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievement_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 4.1 Categories & Tech: Readable by all, admin write
CREATE POLICY project_categories_read_policy ON public.project_categories
  FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY technologies_read_policy ON public.technologies
  FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY achievement_categories_read_policy ON public.achievement_categories
  FOR SELECT TO authenticated, anon USING (true);

-- 4.2 Projects:
-- Public can view published + public projects
CREATE POLICY projects_public_read_policy ON public.projects
  FOR SELECT TO anon, authenticated
  USING (status = 'published' AND visibility = 'public');

-- Members can view published + members_only projects
CREATE POLICY projects_members_read_policy ON public.projects
  FOR SELECT TO authenticated
  USING (
    status = 'published' AND (
      visibility = 'members_only' OR visibility = 'public'
    )
  );

-- Owner can view own projects regardless of status
CREATE POLICY projects_owner_read_policy ON public.projects
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

-- Admin full access
CREATE POLICY projects_admin_all_policy ON public.projects
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Active members can insert own projects
CREATE POLICY projects_insert_policy ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK (
    owner_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.memberships WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Owner can update own projects if not hidden
CREATE POLICY projects_update_policy ON public.projects
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() AND status != 'hidden')
  WITH CHECK (owner_id = auth.uid());

-- 4.3 Achievements:
CREATE POLICY achievements_read_policy ON public.achievements
  FOR SELECT TO authenticated, anon
  USING (status = 'published' OR user_id = auth.uid());

CREATE POLICY achievements_owner_all_policy ON public.achievements
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY achievements_admin_all_policy ON public.achievements
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4.4 Reports:
CREATE POLICY reports_insert_policy ON public.reports
  FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY reports_owner_read_policy ON public.reports
  FOR SELECT TO authenticated
  USING (reporter_id = auth.uid());

CREATE POLICY reports_admin_all_policy ON public.reports
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4.5 Featured Projects:
CREATE POLICY featured_projects_read_policy ON public.featured_projects
  FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY featured_projects_admin_all_policy ON public.featured_projects
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
