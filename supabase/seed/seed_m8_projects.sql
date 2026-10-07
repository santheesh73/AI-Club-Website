-- ==============================================================================
-- AI CLUB - Local Development Seed Script (Milestone 8)
-- Projects, Technologies, Contributors, Links, Media, and Achievements
-- ==============================================================================

-- 1. Project Categories
INSERT INTO public.project_categories (id, name, slug, description, icon)
VALUES
  ('c8111000-0000-0000-0000-000000000001', 'AI & Machine Learning', 'ai-machine-learning', 'Foundational neural networks, computer vision, NLP, and agentic LLMs.', 'Brain'),
  ('c8111000-0000-0000-0000-000000000002', 'Web & Full-Stack Systems', 'web-full-stack', 'High-performance cloud architectures, APIs, and modern web applications.', 'Globe'),
  ('c8111000-0000-0000-0000-000000000003', 'Data Science & Analytics', 'data-science-analytics', 'Predictive modeling, distributed data processing, and statistical engineering.', 'Database'),
  ('c8111000-0000-0000-0000-000000000004', 'Robotics & Autonomous Systems', 'robotics-autonomous', 'Perception pipelines, embedded robotics, SLAM, and autonomous decision agents.', 'Cpu'),
  ('c8111000-0000-0000-0000-000000000005', 'Cybersecurity & AI Safety', 'cybersecurity-ai-safety', 'Model robustness, red-teaming, adversarial defense, and secure platform engineering.', 'Shield')
ON CONFLICT (slug) DO NOTHING;

-- 2. Technologies
INSERT INTO public.technologies (id, name, slug, category)
VALUES
  ('t8111000-0000-0000-0000-000000000001', 'Python', 'python', 'Languages'),
  ('t8111000-0000-0000-0000-000000000002', 'PyTorch', 'pytorch', 'AI/ML'),
  ('t8111000-0000-0000-0000-000000000003', 'TensorFlow', 'tensorflow', 'AI/ML'),
  ('t8111000-0000-0000-0000-000000000004', 'TypeScript', 'typescript', 'Languages'),
  ('t8111000-0000-0000-0000-000000000005', 'React', 'react', 'Frameworks'),
  ('t8111000-0000-0000-0000-000000000006', 'Next.js', 'nextjs', 'Frameworks'),
  ('t8111000-0000-0000-0000-000000000007', 'FastAPI', 'fastapi', 'Frameworks'),
  ('t8111000-0000-0000-0000-000000000008', 'PostgreSQL', 'postgresql', 'Databases'),
  ('t8111000-0000-0000-0000-000000000009', 'Supabase', 'supabase', 'Cloud/DevOps'),
  ('t8111000-0000-0000-0000-000000000010', 'Docker', 'docker', 'Cloud/DevOps'),
  ('t8111000-0000-0000-0000-000000000011', 'LangChain', 'langchain', 'AI/ML'),
  ('t8111000-0000-0000-0000-000000000012', 'HuggingFace', 'huggingface', 'AI/ML'),
  ('t8111000-0000-0000-0000-000000000013', 'ROS2', 'ros2', 'Robotics'),
  ('t8111000-0000-0000-0000-000000000014', 'CUDA', 'cuda', 'AI/ML'),
  ('t8111000-0000-0000-0000-000000000015', 'Tailwind CSS', 'tailwindcss', 'Frameworks')
ON CONFLICT (slug) DO NOTHING;

-- 3. Achievement Categories
INSERT INTO public.achievement_categories (id, name, slug, description)
VALUES
  ('a8111000-0000-0000-0000-000000000001', 'Hackathons & Competitions', 'hackathons-competitions', 'Winning podiums, finalists, and hackathon recognitions.'),
  ('a8111000-0000-0000-0000-000000000002', 'Research & Publications', 'research-publications', 'Peer-reviewed academic papers, preprints, and symposium presentations.'),
  ('a8111000-0000-0000-0000-000000000003', 'Open Source & Contributions', 'open-source-contributions', 'Core maintainership, upstream pull requests, and public software releases.'),
  ('a8111000-0000-0000-0000-000000000004', 'Certifications & Honors', 'certifications-honors', 'Professional technical certifications and departmental fellowships.')
ON CONFLICT (slug) DO NOTHING;

-- 4. Sample Projects (Owner: admin-01 or member from M5 if exists)
DO $$
DECLARE
  v_owner_id UUID;
BEGIN
  -- Resolve active member profile or fallback to admin
  SELECT id INTO v_owner_id FROM public.profiles WHERE role = 'member' LIMIT 1;
  IF v_owner_id IS NULL THEN
    SELECT id INTO v_owner_id FROM public.profiles WHERE role = 'admin' LIMIT 1;
  END IF;

  IF v_owner_id IS NOT NULL THEN
    -- Project 1: Autonomous Vision Inspector
    INSERT INTO public.projects (
      id, owner_id, title, slug, short_description, description, category_id,
      status, visibility, cover_image_url, published_at
    ) VALUES (
      'p8111000-0000-0000-0000-000000000001',
      v_owner_id,
      'DeepInspect: Edge AI Defect Detection',
      'deepinspect-edge-ai-defect-detection',
      'Real-time industrial anomaly detection using quantized Vision Transformers and TensorRT on Jetson Orin.',
      'DeepInspect is an end-to-end edge computer vision inspection platform engineered for industrial micro-defect classification on high-speed assembly lines. Utilizes knowledge distillation from a Swin Transformer backbone to a MobileViT edge runner achieving 120 FPS latency at 99.4% precision.',
      'c8111000-0000-0000-0000-000000000001',
      'published',
      'public',
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
      NOW() - INTERVAL '14 days'
    ) ON CONFLICT (slug) DO NOTHING;

    -- Project 2: Agentic Knowledge Graph Engine
    INSERT INTO public.projects (
      id, owner_id, title, slug, short_description, description, category_id,
      status, visibility, cover_image_url, published_at
    ) VALUES (
      'p8111000-0000-0000-0000-000000000002',
      v_owner_id,
      'NexusGraph: Multi-Agent RAG Orchestrator',
      'nexusgraph-multi-agent-rag-orchestrator',
      'Distributed knowledge graph RAG platform connecting unstructured research corpuses with self-correcting agent swarms.',
      'NexusGraph bridges unstructured technical documentation with hybrid vector and graph queries. Agents execute hierarchical reasoning over Neo4j knowledge topologies with automated hallucination reflection loops powered by LangGraph and FastAPI.',
      'c8111000-0000-0000-0000-000000000001',
      'published',
      'public',
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
      NOW() - INTERVAL '7 days'
    ) ON CONFLICT (slug) DO NOTHING;

    -- Project 3: Autonomous Rover SLAM
    INSERT INTO public.projects (
      id, owner_id, title, slug, short_description, description, category_id,
      status, visibility, cover_image_url, published_at
    ) VALUES (
      'p8111000-0000-0000-0000-000000000003',
      v_owner_id,
      'AeroNav: LiDAR-Inertial SLAM & Trajectory Planner',
      'aeronav-lidar-inertial-slam',
      'Complete autonomous navigation stack utilizing 3D LiDAR, Kalman filter sensor fusion, and dynamic obstacle replanning in ROS2.',
      'Developed for subterranean inspection rovers. AeroNav implements fast LiDAR odometry (FAST-LIO2) integrated with a bespoke A* path replanner running in a ROS2 Humble ecosystem with micro-ROS microcontroller integration.',
      'c8111000-0000-0000-0000-000000000004',
      'published',
      'members_only',
      'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80',
      NOW() - INTERVAL '3 days'
    ) ON CONFLICT (slug) DO NOTHING;

    -- Attach Technologies
    INSERT INTO public.project_technologies (project_id, technology_id)
    VALUES
      ('p8111000-0000-0000-0000-000000000001', 't8111000-0000-0000-0000-000000000001'), -- Python
      ('p8111000-0000-0000-0000-000000000001', 't8111000-0000-0000-0000-000000000002'), -- PyTorch
      ('p8111000-0000-0000-0000-000000000001', 't8111000-0000-0000-0000-000000000014'), -- CUDA
      ('p8111000-0000-0000-0000-000000000002', 't8111000-0000-0000-0000-000000000001'), -- Python
      ('p8111000-0000-0000-0000-000000000002', 't8111000-0000-0000-0000-000000000007'), -- FastAPI
      ('p8111000-0000-0000-0000-000000000002', 't8111000-0000-0000-0000-000000000011'), -- LangChain
      ('p8111000-0000-0000-0000-000000000003', 't8111000-0000-0000-0000-000000000001'), -- Python
      ('p8111000-0000-0000-0000-000000000003', 't8111000-0000-0000-0000-000000000013')  -- ROS2
    ON CONFLICT DO NOTHING;

    -- Attach Project Links
    INSERT INTO public.project_links (project_id, label, url, link_type, position)
    VALUES
      ('p8111000-0000-0000-0000-000000000001', 'GitHub Repository', 'https://github.com/aiclub/deepinspect-core', 'github', 0),
      ('p8111000-0000-0000-0000-000000000001', 'Model Benchmark Paper', 'https://arxiv.org/abs/2401.00001', 'paper', 1),
      ('p8111000-0000-0000-0000-000000000002', 'GitHub Source', 'https://github.com/aiclub/nexusgraph-rag', 'github', 0),
      ('p8111000-0000-0000-0000-000000000002', 'Interactive Live Demo', 'https://nexusgraph.aiclub.dev', 'demo', 1)
    ON CONFLICT DO NOTHING;

    -- Attach Contributors
    INSERT INTO public.project_contributors (project_id, user_id, role)
    VALUES
      ('p8111000-0000-0000-0000-000000000001', v_owner_id, 'Project Lead'),
      ('p8111000-0000-0000-0000-000000000002', v_owner_id, 'Core Architect')
    ON CONFLICT DO NOTHING;

    -- Feature Project 1
    INSERT INTO public.featured_projects (project_id, position, created_by)
    VALUES
      ('p8111000-0000-0000-0000-000000000001', 0, v_owner_id)
    ON CONFLICT DO NOTHING;

    -- Seed Sample Achievement
    INSERT INTO public.achievements (
      id, user_id, category_id, title, description, issuing_organization,
      achievement_date, credential_url, status
    ) VALUES (
      'ach-8111000-0000-0000-0000-000000000001',
      v_owner_id,
      'a8111000-0000-0000-0000-000000000001',
      'First Place — National Autonomous AI Hackathon 2026',
      'Awarded first place among 64 collegiate engineering teams for developing real-time edge defect inspection system DeepInspect.',
      'National AI Innovations Consortium',
      '2026-03-20',
      'https://credentials.aiconsortium.org/verify/AIC-WIN-2026',
      'published'
    ) ON CONFLICT DO NOTHING;

  END IF;
END $$;
