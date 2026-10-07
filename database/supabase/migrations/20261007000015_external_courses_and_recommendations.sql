-- ==============================================================================
-- AI CLUB - Migration 15: External Course AI Recommendation Engine
-- File: 20261007000015_external_courses_and_recommendations.sql
-- Description:
--   1. Extends public.external_courses with metadata, slug, duration, rating, price_type.
--   2. Adds unique indexes to prevent duplicate courses per provider.
--   3. Creates public.course_recommendations cache table with TTL and RLS.
--   4. Seeds verified catalog of external courses for Coursera, freeCodeCamp, Udemy, and Unstop.
-- ==============================================================================

-- 1. Extend external_courses table
DO $$ BEGIN
    ALTER TABLE public.external_courses 
    ADD COLUMN IF NOT EXISTS slug TEXT;

    ALTER TABLE public.external_courses 
    ADD COLUMN IF NOT EXISTS external_course_id TEXT;

    ALTER TABLE public.external_courses 
    ADD COLUMN IF NOT EXISTS duration TEXT;

    ALTER TABLE public.external_courses 
    ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'English';

    ALTER TABLE public.external_courses 
    ADD COLUMN IF NOT EXISTS price_type TEXT DEFAULT 'free' CHECK (price_type IN ('free', 'paid', 'freemium', 'subscription'));

    ALTER TABLE public.external_courses 
    ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 2);

    ALTER TABLE public.external_courses 
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

    ALTER TABLE public.external_courses 
    ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'curated';

    ALTER TABLE public.external_courses 
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

    ALTER TABLE public.external_courses 
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

    ALTER TABLE public.external_courses 
    ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- 2. Indexes and Uniqueness Guards for External Courses
CREATE UNIQUE INDEX IF NOT EXISTS idx_external_courses_provider_url 
    ON public.external_courses(provider, official_url);

CREATE UNIQUE INDEX IF NOT EXISTS idx_external_courses_slug 
    ON public.external_courses(slug) 
    WHERE slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_external_courses_is_active 
    ON public.external_courses(is_active);

-- 3. Cache Table: course_recommendations
CREATE TABLE IF NOT EXISTS public.course_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.external_courses(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    match_score NUMERIC(5, 2) NOT NULL,
    skill_gap TEXT,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_course_recommendations_user_course UNIQUE (user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_course_recommendations_user_id 
    ON public.course_recommendations(user_id);

CREATE INDEX IF NOT EXISTS idx_course_recommendations_expires_at 
    ON public.course_recommendations(expires_at);

-- Trigger for course_recommendations updated_at
DROP TRIGGER IF EXISTS set_course_recommendations_updated_at ON public.course_recommendations;
CREATE TRIGGER set_course_recommendations_updated_at
    BEFORE UPDATE ON public.course_recommendations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS for course_recommendations
ALTER TABLE public.course_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins full management on course recommendations" ON public.course_recommendations;
CREATE POLICY "Admins full management on course recommendations"
    ON public.course_recommendations FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Members can view own recommendations" ON public.course_recommendations;
CREATE POLICY "Members can view own recommendations"
    ON public.course_recommendations FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() OR public.is_admin()
    );

-- 4. Seed Verified External Courses
INSERT INTO public.external_courses (
    title, provider, description, category, skills, difficulty, official_url, price_type, rating, is_active, status, last_verified_at
) VALUES
-- Coursera
(
    'Machine Learning Specialization',
    'Coursera',
    'Break into AI with the foundational machine learning specialization created by Andrew Ng and Stanford Online.',
    'Machine Learning',
    ARRAY['Python', 'Machine Learning', 'Linear Regression', 'Logistic Regression', 'Supervised Learning', 'Decision Trees'],
    'beginner',
    'https://www.coursera.org/specializations/machine-learning-introduction',
    'freemium',
    4.9,
    true,
    'published',
    NOW()
),
(
    'Deep Learning Specialization',
    'Coursera',
    'Master the fundamentals of deep learning, convolutional neural networks, and sequence models taught by DeepLearning.AI.',
    'Deep Learning',
    ARRAY['Deep Learning', 'Neural Networks', 'TensorFlow', 'Python', 'CNN', 'RNN', 'Transformers'],
    'intermediate',
    'https://www.coursera.org/specializations/deep-learning',
    'freemium',
    4.9,
    true,
    'published',
    NOW()
),
(
    'Generative AI with Large Language Models',
    'Coursera',
    'Learn foundational gen AI principles, instruction tuning, RLHF, and fine-tuning LLMs with AWS and DeepLearning.AI.',
    'Generative AI',
    ARRAY['Generative AI', 'LLMs', 'Prompt Engineering', 'LangChain', 'Python', 'Transformers', 'Fine-Tuning'],
    'intermediate',
    'https://www.coursera.org/learn/generative-ai-with-llms',
    'freemium',
    4.8,
    true,
    'published',
    NOW()
),
(
    'Python for Everybody Specialization',
    'Coursera',
    'Learn to program and analyze data with Python, developing programs to gather, clean, analyze, and visualize data.',
    'Python',
    ARRAY['Python', 'Data Structures', 'Web Scraping', 'SQL', 'Databases'],
    'beginner',
    'https://www.coursera.org/specializations/python',
    'freemium',
    4.8,
    true,
    'published',
    NOW()
),
(
    'Google Data Analytics Professional Certificate',
    'Coursera',
    'Gain an immersive understanding of the practices and processes used by junior data analysts in their day-to-day job.',
    'Data Science',
    ARRAY['Data Analysis', 'SQL', 'R', 'Tableau', 'Spreadsheets', 'Data Visualization'],
    'beginner',
    'https://www.coursera.org/professional-certificates/google-data-analytics',
    'subscription',
    4.8,
    true,
    'published',
    NOW()
),
-- freeCodeCamp
(
    'Scientific Computing with Python',
    'freeCodeCamp',
    'Master Python fundamentals, algorithms, data structures, and scientific calculation through 5 hands-on projects.',
    'Python',
    ARRAY['Python', 'Algorithms', 'Scientific Computing', 'Data Structures'],
    'beginner',
    'https://www.freecodecamp.org/learn/scientific-computing-with-python/',
    'free',
    4.9,
    true,
    'published',
    NOW()
),
(
    'Machine Learning with Python Certification',
    'freeCodeCamp',
    'Build neural networks and implement TensorFlow models for computer vision and natural language processing.',
    'Machine Learning',
    ARRAY['Machine Learning', 'TensorFlow', 'Neural Networks', 'Python', 'Computer Vision'],
    'intermediate',
    'https://www.freecodecamp.org/learn/machine-learning-with-python/',
    'free',
    4.9,
    true,
    'published',
    NOW()
),
(
    'Data Analysis with Python Certification',
    'freeCodeCamp',
    'Learn the fundamentals of data analysis with Python, NumPy, Pandas, Matplotlib, and Seaborn.',
    'Data Science',
    ARRAY['Data Science', 'Pandas', 'NumPy', 'Matplotlib', 'Data Cleaning', 'Python'],
    'beginner',
    'https://www.freecodecamp.org/learn/data-analysis-with-python/',
    'free',
    4.9,
    true,
    'published',
    NOW()
),
(
    'Full Stack Developer Curriculum',
    'freeCodeCamp',
    'Comprehensive full stack web development path covering HTML5, CSS3, modern JavaScript, React, Node.js, and APIs.',
    'Web Development',
    ARRAY['JavaScript', 'React', 'Node.js', 'Express', 'HTML', 'CSS', 'REST APIs'],
    'beginner',
    'https://www.freecodecamp.org/learn/full-stack-developer/',
    'free',
    4.9,
    true,
    'published',
    NOW()
),
-- Udemy
(
    'Python for Data Science and Machine Learning Bootcamp',
    'Udemy',
    'Comprehensive guide to NumPy, Pandas, Seaborn, Matplotlib, Plotly, Scikit-Learn, Machine Learning, and Spark.',
    'Machine Learning',
    ARRAY['Python', 'Data Science', 'Machine Learning', 'Scikit-Learn', 'Pandas', 'NumPy'],
    'all_levels',
    'https://www.udemy.com/course/python-for-data-science-and-machine-learning-bootcamp/',
    'paid',
    4.7,
    true,
    'published',
    NOW()
),
(
    '2026 Complete Python Bootcamp From Zero to Hero',
    'Udemy',
    'Master Python 3 by building professional applications, object-oriented systems, and web automations.',
    'Python',
    ARRAY['Python', 'OOP', 'Automation', 'Decorators', 'Generators'],
    'beginner',
    'https://www.udemy.com/course/complete-python-bootcamp/',
    'paid',
    4.8,
    true,
    'published',
    NOW()
),
(
    'Artificial Intelligence A-Z: Build 7 AI Models',
    'Udemy',
    'Combine the power of Data Science, Machine Learning and Deep Learning to build powerful AI applications for real-world applications.',
    'AI',
    ARRAY['Artificial Intelligence', 'Reinforcement Learning', 'Deep Q-Learning', 'PyTorch', 'Python'],
    'intermediate',
    'https://www.udemy.com/course/artificial-intelligence-az/',
    'paid',
    4.6,
    true,
    'published',
    NOW()
),
-- Unstop
(
    'Artificial Intelligence & Machine Learning Track',
    'Unstop',
    'Industry-aligned competitive AI/ML learning track with hands-on hackathon preparation and problem statements.',
    'AI',
    ARRAY['AI', 'Machine Learning', 'Python', 'Competitive Coding', 'Hackathons'],
    'intermediate',
    'https://unstop.com/courses/artificial-intelligence-machine-learning-course',
    'freemium',
    4.7,
    true,
    'published',
    NOW()
),
(
    'Data Science & Analytics Master Series',
    'Unstop',
    'Hands-on analytics track designed for students preparing for tech competitions and hiring assessments.',
    'Data Science',
    ARRAY['Data Analytics', 'Python', 'SQL', 'Predictive Modeling', 'Tableau'],
    'beginner',
    'https://unstop.com/courses/data-science-course',
    'freemium',
    4.7,
    true,
    'published',
    NOW()
),
(
    'Full Stack Web Development Certification Track',
    'Unstop',
    'Project-centric web development roadmap emphasizing TypeScript, React, Node.js, and cloud deployments.',
    'Web Development',
    ARRAY['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Tailwind CSS'],
    'intermediate',
    'https://unstop.com/courses/full-stack-web-development-course',
    'freemium',
    4.6,
    true,
    'published',
    NOW()
)
ON CONFLICT (provider, official_url) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    skills = EXCLUDED.skills,
    difficulty = EXCLUDED.difficulty,
    price_type = EXCLUDED.price_type,
    rating = EXCLUDED.rating,
    is_active = EXCLUDED.is_active,
    status = EXCLUDED.status,
    last_verified_at = EXCLUDED.last_verified_at,
    updated_at = NOW();
