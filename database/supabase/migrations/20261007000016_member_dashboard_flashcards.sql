-- ============================================================================
-- Migration: 20261007000016_member_dashboard_flashcards.sql
-- Module: Dashboard / Spotlight Flashcard Engine
-- Ensures authoritative published data and performance indexes across
-- Announcements, Events, Achievements, and Project Ideas
-- ============================================================================

-- 1. Performance indexes for flashcard candidate retrieval
CREATE INDEX IF NOT EXISTS idx_announcements_flashcard 
    ON public.announcements(status, published_at, expires_at);

CREATE INDEX IF NOT EXISTS idx_events_flashcard 
    ON public.events(status, start_at, end_at);

CREATE INDEX IF NOT EXISTS idx_achievements_flashcard 
    ON public.achievements(status, created_at);

CREATE INDEX IF NOT EXISTS idx_project_ideas_flashcard 
    ON public.project_ideas(status, created_at);

-- 2. Seed verified upcoming events for Member Spotlight
INSERT INTO public.events (
    id, title, slug, short_description, description, category, event_mode,
    location, is_online, meeting_url, cover_image_url,
    start_at, end_at, registration_open_at, registration_close_at,
    capacity, eligibility, status, speaker, organizer, requirements, tags,
    published_at
) VALUES (
    'e8179244-11fa-4c4e-b53d-24957e841001',
    'AI CLUB Fall 2026 Hackathon: Autonomous Agents Challenge',
    'ai-club-fall-2026-hackathon',
    'Registrations are open! Team up to build production-grade agentic AI systems judged by frontier engineers.',
    'Join our flagship 48-hour sprint building real-world AI applications, autonomous agents, and multimodal reasoning systems. Open exclusively to verified AI CLUB members.',
    'hackathon',
    'hybrid',
    'SIET Campus AI Innovation Lab & Discord',
    true,
    'https://meet.google.com/aiclub-hackathon-2026',
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
    NOW() + INTERVAL '10 days',
    NOW() + INTERVAL '12 days',
    NOW() - INTERVAL '2 days',
    NOW() + INTERVAL '9 days',
    100,
    'members_only',
    'published',
    'Industry Guest Architects',
    'AI CLUB Technical Committee',
    'Laptops, GitHub account, Python / TypeScript proficiency',
    ARRAY['Hackathon', 'Agents', 'LLMs', 'Competition'],
    NOW() - INTERVAL '1 day'
) ON CONFLICT (id) DO UPDATE SET
    status = 'published',
    end_at = NOW() + INTERVAL '12 days';

INSERT INTO public.events (
    id, title, slug, short_description, description, category, event_mode,
    location, is_online, meeting_url, cover_image_url,
    start_at, end_at, registration_open_at, registration_close_at,
    capacity, eligibility, status, speaker, organizer, requirements, tags,
    published_at
) VALUES (
    'e8179244-11fa-4c4e-b53d-24957e841002',
    'Hands-on Masterclass: Transformer Architecture & Inference Optimization',
    'masterclass-transformer-architecture-2026',
    'Deep dive into self-attention, KV-caching, FlashAttention, and TensorRT-LLM quantization.',
    'A technical architecture masterclass exploring the inner workings of decoder-only transformers with GPU benchmarks.',
    'workshop',
    'online',
    'Virtual Google Meet Hub',
    true,
    'https://meet.google.com/aiclub-transformers-2026',
    'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=1200&q=80',
    NOW() + INTERVAL '4 days',
    NOW() + INTERVAL '4 days 3 hours',
    NOW() - INTERVAL '5 days',
    NOW() + INTERVAL '3 days',
    150,
    'members_only',
    'published',
    'Dr. Aris Thorne',
    'AI CLUB Academic Wing',
    'Basic PyTorch knowledge',
    ARRAY['Transformers', 'Deep Learning', 'PyTorch', 'GPU'],
    NOW() - INTERVAL '2 days'
) ON CONFLICT (id) DO UPDATE SET
    status = 'published',
    end_at = NOW() + INTERVAL '4 days 3 hours';
