-- ============================================================================
-- AI CLUB — MILESTONE 7 MIGRATION
-- COURSES & LEARNING MANAGEMENT PLATFORM (SCHEMA, RLS, INDEXES & INTEGRITY)
-- ============================================================================

-- 1. Create Enums for Courses & Learning Domain
DO $$ BEGIN
  CREATE TYPE course_status AS ENUM (
    'draft',
    'published',
    'archived'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE course_difficulty AS ENUM (
    'beginner',
    'intermediate',
    'advanced'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE lesson_content_type AS ENUM (
    'text',
    'video',
    'document',
    'external_resource'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE enrollment_status AS ENUM (
    'active',
    'completed',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create Course Categories Table
CREATE TABLE IF NOT EXISTS public.course_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create Courses Table
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  short_description TEXT NOT NULL,
  description TEXT NOT NULL,
  thumbnail_url TEXT NULL,
  category_id UUID NOT NULL REFERENCES public.course_categories(id) ON DELETE RESTRICT,
  difficulty course_difficulty NOT NULL DEFAULT 'beginner',
  estimated_duration INTEGER NOT NULL DEFAULT 60, -- duration in minutes
  status course_status NOT NULL DEFAULT 'draft',
  created_by UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ NULL,
  archived_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_course_title_length CHECK (char_length(trim(title)) >= 3 AND char_length(title) <= 255),
  CONSTRAINT chk_course_short_desc_length CHECK (char_length(trim(short_description)) >= 5 AND char_length(short_description) <= 350),
  CONSTRAINT chk_course_desc_length CHECK (char_length(trim(description)) >= 10),
  CONSTRAINT chk_course_duration_positive CHECK (estimated_duration > 0)
);

-- 4. Create Course Modules Table
CREATE TABLE IF NOT EXISTS public.course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NULL,
  position INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_module_title_length CHECK (char_length(trim(title)) >= 2 AND char_length(title) <= 255),
  CONSTRAINT chk_module_position_positive CHECK (position >= 1)
);

-- 5. Create Course Lessons Table
CREATE TABLE IF NOT EXISTS public.course_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT NULL,
  content TEXT NOT NULL DEFAULT '',
  content_type lesson_content_type NOT NULL DEFAULT 'text',
  video_url TEXT NULL,
  duration INTEGER NOT NULL DEFAULT 15, -- in minutes
  position INTEGER NOT NULL DEFAULT 1,
  is_preview BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_lesson_title_length CHECK (char_length(trim(title)) >= 2 AND char_length(title) <= 255),
  CONSTRAINT chk_lesson_duration_positive CHECK (duration >= 1),
  CONSTRAINT chk_lesson_position_positive CHECK (position >= 1)
);

-- 6. Create Course Enrollments Table
CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status enrollment_status NOT NULL DEFAULT 'active',
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_course_user_enrollment UNIQUE (course_id, user_id)
);

-- 7. Create Lesson Progress Table
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.course_enrollments(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ NULL,
  last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_enrollment_lesson_progress UNIQUE (enrollment_id, lesson_id)
);

-- 8. Indexes for Query Performance
CREATE INDEX IF NOT EXISTS idx_courses_slug ON public.courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_category_id ON public.courses(category_id);
CREATE INDEX IF NOT EXISTS idx_courses_difficulty ON public.courses(difficulty);

CREATE INDEX IF NOT EXISTS idx_course_modules_course_position ON public.course_modules(course_id, position);
CREATE INDEX IF NOT EXISTS idx_course_lessons_module_position ON public.course_lessons(module_id, position);

CREATE INDEX IF NOT EXISTS idx_course_enrollments_user_id ON public.course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON public.course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_status ON public.course_enrollments(status);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_enrollment_id ON public.lesson_progress(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_id ON public.lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_last_accessed ON public.lesson_progress(last_accessed_at);

-- 9. Enable Row-Level Security (RLS)
ALTER TABLE public.course_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies

-- 10.1 Categories
CREATE POLICY "Public and members can view course categories"
  ON public.course_categories FOR SELECT
  USING (true);

CREATE POLICY "Admins manage course categories"
  ON public.course_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 10.2 Courses
CREATE POLICY "Anyone authenticated can view published courses"
  ON public.courses FOR SELECT
  USING (
    status = 'published' OR status = 'archived'
  );

CREATE POLICY "Admins full management on courses"
  ON public.courses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 10.3 Modules
CREATE POLICY "Members view modules for accessible courses"
  ON public.course_modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE id = course_modules.course_id AND (status = 'published' OR status = 'archived')
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins manage course modules"
  ON public.course_modules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 10.4 Lessons
CREATE POLICY "Members view lessons if enrolled or preview"
  ON public.course_lessons FOR SELECT
  USING (
    is_preview = true
    OR
    EXISTS (
      SELECT 1 FROM public.course_modules m
      JOIN public.course_enrollments e ON e.course_id = m.course_id
      WHERE m.id = course_lessons.module_id AND e.user_id = auth.uid() AND e.status = 'active'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins manage course lessons"
  ON public.course_lessons FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 10.5 Enrollments
CREATE POLICY "Members view their own course enrollments"
  ON public.course_enrollments FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Active members can enroll in published courses"
  ON public.course_enrollments FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
    AND
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE id = course_id AND status = 'published'
    )
  );

CREATE POLICY "Members can update their own enrollment"
  ON public.course_enrollments FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 10.6 Lesson Progress
CREATE POLICY "Members view their own lesson progress"
  ON public.lesson_progress FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.course_enrollments e
      WHERE e.id = lesson_progress.enrollment_id AND e.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Members manage their own lesson progress"
  ON public.lesson_progress FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.course_enrollments e
      WHERE e.id = lesson_progress.enrollment_id AND e.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
