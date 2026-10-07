-- ==============================================================================
-- AI CLUB - Migration 12: Community, Learning, Project Ideas & Leaderboard
-- File: 20261007000012_community_learning_leaderboard.sql
-- Description: Adds schema extensions for:
--              1. Assessment questions lifecycle (draft/published/archived) + seed bank
--              2. Announcements system with audience filtering
--              3. Admin-curated Project Ideas (separate from member projects)
--              4. External course recommendations with verified URLs
--              5. Authoritative database contribution rules, points & leaderboard
-- ==============================================================================

-- 1. Assessment Questions Enhancements & Status
DO $$ BEGIN
    ALTER TABLE public.assessment_questions 
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published' 
    CHECK (status IN ('draft', 'published', 'archived'));

    ALTER TABLE public.assessment_questions 
    ADD COLUMN IF NOT EXISTS explanation TEXT;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- 2. Announcements Table
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    audience TEXT NOT NULL DEFAULT 'all' CHECK (audience IN ('all', 'applicants', 'members', 'admins')),
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_audience_status ON public.announcements(audience, status);
CREATE INDEX IF NOT EXISTS idx_announcements_published_at ON public.announcements(published_at DESC);

-- Trigger for announcements updated_at
DROP TRIGGER IF EXISTS set_announcements_updated_at ON public.announcements;
CREATE TRIGGER set_announcements_updated_at
    BEFORE UPDATE ON public.announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS for Announcements
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins full management on announcements" ON public.announcements;
CREATE POLICY "Admins full management on announcements"
    ON public.announcements FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Members can view relevant announcements" ON public.announcements;
CREATE POLICY "Members can view relevant announcements"
    ON public.announcements FOR SELECT
    TO authenticated
    USING (
        status = 'published' AND
        (audience IN ('all', 'members') OR public.is_admin())
    );

DROP POLICY IF EXISTS "Public and applicants can view public announcements" ON public.announcements;
CREATE POLICY "Public and applicants can view public announcements"
    ON public.announcements FOR SELECT
    TO anon, authenticated
    USING (
        status = 'published' AND audience = 'all'
    );

-- 3. Project Ideas Table (Admin Curated Inspiration)
CREATE TABLE IF NOT EXISTS public.project_ideas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    problem_statement TEXT,
    difficulty TEXT NOT NULL DEFAULT 'intermediate' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    category TEXT NOT NULL,
    technologies TEXT[] DEFAULT '{}',
    skills TEXT[] DEFAULT '{}',
    expected_outcome TEXT,
    reference_links JSONB DEFAULT '[]'::jsonb,
    media_url TEXT,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_ideas_status ON public.project_ideas(status);
CREATE INDEX IF NOT EXISTS idx_project_ideas_category ON public.project_ideas(category);

-- Trigger for project_ideas updated_at
DROP TRIGGER IF EXISTS set_project_ideas_updated_at ON public.project_ideas;
CREATE TRIGGER set_project_ideas_updated_at
    BEFORE UPDATE ON public.project_ideas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS for Project Ideas
ALTER TABLE public.project_ideas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins full management on project ideas" ON public.project_ideas;
CREATE POLICY "Admins full management on project ideas"
    ON public.project_ideas FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Members can view published project ideas" ON public.project_ideas;
CREATE POLICY "Members can view published project ideas"
    ON public.project_ideas FOR SELECT
    TO authenticated
    USING (
        (status = 'published' AND public.is_member_or_admin()) OR public.is_admin()
    );

-- 4. External Course Recommendations Table
CREATE TABLE IF NOT EXISTS public.external_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    provider TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    skills TEXT[] DEFAULT '{}',
    difficulty TEXT NOT NULL DEFAULT 'all_levels' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'all_levels')),
    official_url TEXT NOT NULL,
    image_url TEXT,
    source TEXT NOT NULL DEFAULT 'curated',
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    last_verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_external_courses_category ON public.external_courses(category);
CREATE INDEX IF NOT EXISTS idx_external_courses_status ON public.external_courses(status);

-- Trigger for external_courses updated_at
DROP TRIGGER IF EXISTS set_external_courses_updated_at ON public.external_courses;
CREATE TRIGGER set_external_courses_updated_at
    BEFORE UPDATE ON public.external_courses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS for External Courses
ALTER TABLE public.external_courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins full management on external courses" ON public.external_courses;
CREATE POLICY "Admins full management on external courses"
    ON public.external_courses FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Members can view published external courses" ON public.external_courses;
CREATE POLICY "Members can view published external courses"
    ON public.external_courses FOR SELECT
    TO authenticated
    USING (
        (status = 'published' AND public.is_member_or_admin()) OR public.is_admin()
    );

-- 5. Leaderboard Contribution Rules & Points Ledger
CREATE TABLE IF NOT EXISTS public.contribution_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_type TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    points INT NOT NULL CHECK (points >= 0),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Baseline Contribution Rules
INSERT INTO public.contribution_rules (activity_type, display_name, points, description)
VALUES
    ('course_completion', 'Course Completion', 100, 'Awarded upon finishing all lessons in a course'),
    ('lesson_completion', 'Lesson Completion', 10, 'Awarded for each individual lesson completed'),
    ('project_creation', 'Project Creation', 100, 'Awarded upon launching a verified community project'),
    ('project_milestone', 'Project Milestone', 50, 'Awarded for achieving verified milestone delivery'),
    ('project_contribution', 'Project Contribution', 25, 'Awarded for approved code/research contributions'),
    ('event_participation', 'Event Participation', 30, 'Awarded for verified attendance at a club event'),
    ('hackathon_participation', 'Hackathon Participation', 100, 'Awarded for competing in club-sponsored hackathons'),
    ('achievement', 'Achievement Unlocked', 50, 'Awarded when earning milestone badges'),
    ('community_contribution', 'Community Contribution', 25, 'Awarded for mentoring, paper summaries, or code reviews')
ON CONFLICT (activity_type) DO UPDATE SET
    points = EXCLUDED.points,
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description;

-- Member Contributions Ledger (Idempotent points transaction log)
CREATE TABLE IF NOT EXISTS public.member_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL REFERENCES public.contribution_rules(activity_type),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    points INT NOT NULL CHECK (points >= 0),
    idempotency_key TEXT UNIQUE, -- Strictly prevents duplicate point awards
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_member_contributions_user_id ON public.member_contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_member_contributions_created_at ON public.member_contributions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_member_contributions_activity ON public.member_contributions(activity_type);

-- RLS for Contribution Rules & Ledger
ALTER TABLE public.contribution_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_contributions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage contribution rules" ON public.contribution_rules;
CREATE POLICY "Admins manage contribution rules"
    ON public.contribution_rules FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Anyone can view active contribution rules" ON public.contribution_rules;
CREATE POLICY "Anyone can view active contribution rules"
    ON public.contribution_rules FOR SELECT
    TO authenticated
    USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins full management on member contributions" ON public.member_contributions;
CREATE POLICY "Admins full management on member contributions"
    ON public.member_contributions FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Members view their own contributions" ON public.member_contributions;
CREATE POLICY "Members view their own contributions"
    ON public.member_contributions FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id OR public.is_admin()
    );

-- Leaderboard Aggregate View (Public to members)
CREATE OR REPLACE VIEW public.leaderboard_view AS
SELECT
    p.id AS user_id,
    p.full_name,
    p.avatar_url,
    p.department,
    p.role,
    COALESCE(SUM(c.points), 0)::BIGINT AS total_points,
    COUNT(c.id)::BIGINT AS contribution_count,
    MAX(c.created_at) AS last_active_at,
    DENSE_RANK() OVER (ORDER BY COALESCE(SUM(c.points), 0) DESC) AS rank
FROM public.profiles p
LEFT JOIN public.member_contributions c ON c.user_id = p.id
WHERE p.role IN ('member', 'admin')
GROUP BY p.id, p.full_name, p.avatar_url, p.department, p.role;

-- Grant permissions on leaderboard view
GRANT SELECT ON public.leaderboard_view TO anon, authenticated, service_role;

-- 6. Seed Assessment Question Bank (30 High-Quality Technical MCQs across Core Disciplines)
INSERT INTO public.assessment_questions (
    question_text, category, difficulty, option_a, option_b, option_c, option_d, correct_option, marks, status, explanation
) VALUES
-- AI Fundamentals
('What fundamental search algorithm guarantees finding the shortest path on graphs with non-negative edge costs?', 'AI Fundamentals', 'medium', 'Breadth-First Search', 'Depth-First Search', 'Dijkstra / Uniform Cost Search', 'Depth-Limited Search', 'C', 1.0, 'published', 'Dijkstra and Uniform Cost Search expand the lowest cumulative path cost node first, guaranteeing optimality with non-negative edge costs.'),
('In heuristic search, what condition must an admissible heuristic h(n) satisfy relative to the true optimal cost h*(n)?', 'AI Fundamentals', 'medium', 'h(n) > h*(n) for all nodes', '0 <= h(n) <= h*(n) (never overestimates)', 'h(n) must equal h*(n) exactly', 'h(n) must strictly decrease along every path', 'B', 1.0, 'published', 'Admissibility requires that the heuristic never overestimates the true remaining cost to the goal.'),
('What is the exploration vs. exploitation dilemma primarily studied in?', 'AI Fundamentals', 'easy', 'Supervised Learning', 'Reinforcement Learning', 'Unsupervised Dimensionality Reduction', 'Relational Database Optimization', 'B', 1.0, 'published', 'Reinforcement learning agents must balance exploring unknown actions with exploiting currently known rewarding actions.'),
('Which theorem states that no single machine learning algorithm is universally superior across all possible problem distributions?', 'AI Fundamentals', 'medium', 'Central Limit Theorem', 'No Free Lunch Theorem', 'Universal Approximation Theorem', 'Bayes Optimal Classifier Theorem', 'B', 1.0, 'published', 'The No Free Lunch Theorem proves that all optimization/learning algorithms perform identically when averaged across all objective functions.'),

-- Machine Learning
('What phenomenon occurs when a model achieves near-zero training error but performs poorly on unseen validation data?', 'Machine Learning', 'easy', 'Underfitting', 'High Bias', 'Overfitting', 'Data Drift', 'C', 1.0, 'published', 'Overfitting happens when a model learns training noise and specific details rather than generalizable underlying patterns.'),
('Which regularization technique penalizes the L1-norm of the weight vector, thereby promoting sparsity?', 'Machine Learning', 'medium', 'Ridge Regression', 'Lasso Regression', 'Elastic Net with alpha=0', 'Dropout', 'B', 1.0, 'published', 'L1 regularization (Lasso) drives coefficients of irrelevant features precisely to zero, creating sparse models.'),
('In binary classification with severe class imbalance (e.g., 99% negative, 1% positive), which metric is LEAST informative?', 'Machine Learning', 'easy', 'Area under the ROC curve (AUC-ROC)', 'Precision-Recall AUC', 'Standard Accuracy', 'F1-Score', 'C', 1.0, 'published', 'A trivial classifier predicting the majority class achieves 99% accuracy while having zero utility for the positive class.'),
('What does the receiver operating characteristic (ROC) curve plot on its respective axes?', 'Machine Learning', 'medium', 'Precision vs. Recall', 'True Positive Rate vs. False Positive Rate', 'Accuracy vs. Loss', 'Specificity vs. F1-Score', 'B', 1.0, 'published', 'The ROC curve displays True Positive Rate (Sensitivity) against False Positive Rate (1 - Specificity) across decision thresholds.'),

-- Deep Learning
('Which activation function mitigates the vanishing gradient problem in deep feedforward networks compared to Sigmoid?', 'Deep Learning', 'easy', 'Tanh', 'Rectified Linear Unit (ReLU)', 'Softmax', 'Linear Step', 'B', 1.0, 'published', 'ReLU provides a constant gradient of 1 for all positive inputs, preventing exponential gradient attenuation through deep layers.'),
('What mechanism allows the Transformer architecture to attend to interactions between all token positions in parallel?', 'Deep Learning', 'medium', 'Recurrent Hidden States', 'Multi-Head Self-Attention', 'Residual Pooling', '1D Dilated Convolutions', 'B', 1.0, 'published', 'Multi-Head Self-Attention computes dot-product query-key affinity matrices across all tokens concurrently without recurrent loops.'),
('In backpropagation, what calculus rule is fundamentally applied to compute the gradient of loss with respect to early layer weights?', 'Deep Learning', 'easy', 'Quotient Rule', 'Product Rule', 'Chain Rule', 'LHopitals Rule', 'C', 1.0, 'published', 'Backpropagation is the recursive application of the multivariate chain rule from the output layer back to input weights.'),
('Why is Layer Normalization generally preferred over Batch Normalization in Transformer language models?', 'Deep Learning', 'hard', 'It depends on large batch sizes across GPUs', 'It computes statistics across features within each token, independent of batch size and sequence length', 'It eliminates all non-linear activation functions', 'It requires zero learnable affine parameters', 'B', 1.0, 'published', 'LayerNorm computes mean and variance across the feature dimension for individual tokens, making it stable for varying sequence lengths.'),

-- Generative AI & LLMs
('In Large Language Models, what does temperature parameter scaling during softmax token sampling control?', 'Generative AI', 'medium', 'The learning rate during backpropagation', 'The sharpness of the probability distribution over vocabulary tokens', 'The maximum context window size in tokens', 'The weight decay coefficient of the AdamW optimizer', 'B', 1.0, 'published', 'Lower temperatures make high-probability tokens more dominant (deterministic), while higher temperatures flatten the distribution (creative/diverse).'),
('What does RLHF stand for in modern foundation model post-training alignment pipelines?', 'Generative AI', 'easy', 'Recursive Logic with Heuristic Filters', 'Reinforcement Learning from Human Feedback', 'Real-time Latent Hashing Functions', 'Representation Learning for Heterogeneous Features', 'B', 1.0, 'published', 'RLHF aligns pre-trained base models with human preferences using reward models trained on human comparative judgements.'),
('What is the primary purpose of Retrieval-Augmented Generation (RAG)?', 'Generative AI', 'medium', 'To permanently retrain LLM parameters with new corpora', 'To ground LLM outputs by retrieving relevant factual documents into the prompt context at inference time', 'To compress the model weights into 4-bit integers', 'To generate synthetic training datasets automatically', 'B', 1.0, 'published', 'RAG fetches external, authoritative documents based on query embeddings and provides them to the LLM context to reduce hallucinations.'),
('Which technique fine-tunes foundation models by freezing base weights and training low-rank decomposition matrices?', 'Generative AI', 'medium', 'Full Parameter Fine-Tuning', 'LoRA (Low-Rank Adaptation)', 'Quantization-Aware Training', 'Knowledge Distillation', 'B', 1.0, 'published', 'LoRA decomposes weight updates into two low-rank matrices (A and B), drastically reducing trainable parameter counts and GPU memory requirements.'),

-- Python & Programming
('In Python, what is the time complexity of looking up a key in a standard dictionary with well-distributed hash values?', 'Python', 'easy', 'O(1) average time', 'O(log n) time', 'O(n) time', 'O(n log n) time', 'A', 1.0, 'published', 'Python dictionaries are hash tables offering O(1) expected lookup, insertion, and deletion complexity.'),
('What Python construct allows a function to produce an iterable stream of values lazily on demand using the yield keyword?', 'Python', 'easy', 'Decorator', 'Generator', 'Context Manager', 'Metaclass', 'B', 1.0, 'published', 'Generators maintain internal state across calls and yield values sequentially without computing the entire collection into memory at once.'),
('Which Python library provides optimized N-dimensional arrays implemented in C for scientific computing?', 'Python', 'easy', 'NumPy', 'Requests', 'Flask', 'BeautifulSoup', 'A', 1.0, 'published', 'NumPy provides memory-contiguous ndarray structures with vectorized SIMD operations for high-performance numerical computing.'),
('In Python, what does the Global Interpreter Lock (GIL) primarily restrict in the standard CPython implementation?', 'Python', 'medium', 'Asynchronous I/O execution with asyncio', 'Execution of multiple native CPU-bound Python bytecode threads simultaneously on multiple cores', 'Memory allocation for variables exceeding 2GB', 'Importing external shared C libraries', 'B', 1.0, 'published', 'The CPython GIL ensures thread safety by permitting only one native thread to execute Python bytecode at a time.'),

-- Data Science
('What dimensionality reduction technique finds orthogonal axes that maximize the variance of projected high-dimensional data?', 'Data Science', 'medium', 't-SNE', 'Principal Component Analysis (PCA)', 'UMAP', 'Linear Discriminant Analysis (LDA)', 'B', 1.0, 'published', 'PCA computes the eigenvectors of the data covariance matrix to identify orthogonal principal components maximizing explained variance.'),
('In hypothesis testing, what is a Type I error?', 'Data Science', 'medium', 'Failing to reject a false null hypothesis', 'Incorrectly rejecting a true null hypothesis (False Positive)', 'Selecting too small of a sample size', 'Calculating an incorrect p-value', 'B', 1.0, 'published', 'A Type I error occurs when a true null hypothesis is mistakenly rejected (a false positive conclusion).'),
('Which imputation method replaces missing values in a feature with the most frequently occurring value in categorical variables?', 'Data Science', 'easy', 'Mean Imputation', 'Median Imputation', 'Mode Imputation', 'K-Nearest Neighbors Regression', 'C', 1.0, 'published', 'The mode represents the most frequent value and is the standard baseline imputation for categorical variables.'),
('What is the key difference between supervised dimensionality reduction (LDA) and unsupervised reduction (PCA)?', 'Data Science', 'medium', 'LDA utilizes class labels to maximize class separability; PCA ignores labels and maximizes total variance', 'PCA requires class labels while LDA does not', 'LDA can only be applied to text datasets', 'PCA is strictly non-linear while LDA is linear', 'A', 1.0, 'published', 'LDA is a supervised technique maximizing between-class scatter over within-class scatter, while PCA is unsupervised.'),

-- Logical Reasoning & Problem Solving
('A model has 90% precision and 80% recall on 100 positive cases out of 1000 total cases. How many true positive predictions did it make?', 'Logical Reasoning', 'medium', '72', '80', '90', '100', 'B', 1.0, 'published', 'Recall = TP / (Total True Positives) -> 0.80 = TP / 100 -> TP = 80.'),
('If all Artificial Neural Networks are function approximators, and some function approximators are non-linear, which statement MUST logically follow?', 'Logical Reasoning', 'easy', 'All function approximators are neural networks', 'Neural networks are capable of function approximation', 'No neural network can be linear', 'All non-linear systems are neural networks', 'B', 1.0, 'published', 'Given that all ANNs belong to the set of function approximators, it directly follows that neural networks are capable of function approximation.'),
('In asymptotic analysis, if algorithm X takes O(N log N) time and algorithm Y takes O(N^2) time, what is true for sufficiently large N?', 'Problem Solving', 'easy', 'Algorithm Y will execute strictly faster than X', 'Algorithm X will perform fewer fundamental operations than Y', 'Both algorithms will perform identical operations', 'The relative speed depends only on hardware clock frequency', 'B', 1.0, 'published', 'N log N grows substantially slower than N^2, meaning Algorithm X will require fewer operations as N becomes large.'),
('In a relational database, what normal form requires that all non-key attributes are fully functionally dependent on the entire primary key, eliminating partial dependencies?', 'Problem Solving', 'medium', 'First Normal Form (1NF)', 'Second Normal Form (2NF)', 'Third Normal Form (3NF)', 'Boyce-Codd Normal Form (BCNF)', 'B', 1.0, 'published', 'Second Normal Form (2NF) mandates 1NF compliance and that no non-prime attribute is partially dependent on any candidate key candidate.'),
('What data structure is optimal for implementing an LRU (Least Recently Used) cache with O(1) get and put operations?', 'Problem Solving', 'medium', 'Binary Search Tree + Array', 'Hash Map + Doubly Linked List', 'Min-Heap + Stack', 'Single Linked List + Queue', 'B', 1.0, 'published', 'A Hash Map provides O(1) node lookup by key, and a Doubly Linked List allows O(1) removal and insertion to the front/back.'),
('What distributed consensus algorithm is designed to be easier to understand than Paxos while maintaining safety across leader election and log replication?', 'Problem Solving', 'hard', 'Two-Phase Commit (2PC)', 'Raft', 'Gossip Protocol', 'Vector Clocks', 'B', 1.0, 'published', 'Raft decomposes consensus into explicit leader election, log replication, and safety guarantees, offering equivalent robustness to Multi-Paxos.')
ON CONFLICT DO NOTHING;

-- 7. Seed Sample Club Announcements
INSERT INTO public.announcements (title, content, priority, audience, status)
VALUES
    ('Welcome to AI CLUB — 2026 Innovation Intake Open', 'Welcome all researchers, developers, and builders! Applications for the 2026 AI cohort are now open. Complete your profile and attempt the 25-MCQ technical assessment.', 'high', 'all', 'published'),
    ('Hands-on Workshop: Building Autonomous Agents with LangGraph & Gemini', 'Join us this Saturday for a live architecture session on multi-agent collaboration, memory persistence, and tool invocation.', 'normal', 'members', 'published'),
    ('Fall 2026 Club Hackathon: Agentic Intelligence Challenge', 'Submissions open next month. Teams of 2-4 members will build real-world AI applications judged by industry engineers.', 'high', 'members', 'published')
ON CONFLICT DO NOTHING;

-- 8. Seed Sample Project Ideas
INSERT INTO public.project_ideas (title, description, problem_statement, difficulty, category, technologies, skills, expected_outcome, status)
VALUES
    ('Autonomous Multimodal Meeting Copilot', 'A local-first assistant that records audio, transcribes speaker diarization, and generates action items using local LLMs.', 'Students and researchers spend hours manually summarizing technical presentations and engineering scrums.', 'advanced', 'Generative AI', ARRAY['Python', 'Whisper', 'FastAPI', 'Gemini API', 'React'], ARRAY['Audio Processing', 'RAG', 'Agentic Workflows'], 'Working electron desktop app with automated meeting briefing exports.', 'published'),
    ('Graph-RAG Medical Literature Explorer', 'Construct knowledge graphs from PubMed medical abstracts to answer multi-hop diagnostic and research queries.', 'Traditional vector RAG struggles with multi-hop factual reasoning across interconnected biomedical papers.', 'advanced', 'Natural Language Processing', ARRAY['Python', 'Neo4j', 'LlamaIndex', 'LangChain'], ARRAY['Knowledge Graphs', 'Vector Embeddings', 'Graph Algorithms'], 'Web dashboard querying interconnected medical entities with citation verification.', 'published'),
    ('Autonomous Edge Vision Drone Detection', 'Low-latency computer vision pipeline running on embedded edge hardware (Raspberry Pi / Jetson) for drone localization.', 'Perception pipelines on resource-constrained embedded systems suffer from thermal throttling and latency bottlenecks.', 'intermediate', 'Computer Vision', ARRAY['C++', 'Python', 'OpenCV', 'YOLOv11', 'TensorRT'], ARRAY['Model Quantization', 'Edge Deployment', 'Real-time Video'], 'Sub-30ms detection pipeline on embedded hardware benchmarked against edge benchmarks.', 'published'),
    ('Real-Time Code Security Vulnerability Scanner', 'An AST-aware AI linting tool that identifies CWE security vulnerabilities in pull requests before merge.', 'Static linters miss contextual logic flaws and authorization bypasses in modern web applications.', 'intermediate', 'DevSecOps & AI', ARRAY['TypeScript', 'Python', 'Tree-sitter', 'Docker'], ARRAY['Static Analysis', 'AST Parsing', 'Security Engineering'], 'GitHub Action bot providing inline code reviews with remediation diffs.', 'published')
ON CONFLICT DO NOTHING;

-- 9. Seed Curated Official External Course Recommendations (Verified Official Domains)
INSERT INTO public.external_courses (title, provider, description, category, skills, difficulty, official_url, status)
VALUES
    ('Deep Learning Specialization', 'Coursera (DeepLearning.AI)', 'Master the fundamentals of deep learning, convolutional neural networks, and sequence models taught by Andrew Ng.', 'Deep Learning', ARRAY['Neural Networks', 'TensorFlow', 'Python', 'Hyperparameter Tuning'], 'intermediate', 'https://www.coursera.org/specializations/deep-learning', 'published'),
    ('Machine Learning Specialization', 'Coursera (Stanford Online)', 'Foundational machine learning program covering supervised algorithms, unsupervised learning, and best practices in modern AI.', 'Machine Learning', ARRAY['Supervised Learning', 'Logistic Regression', 'Decision Trees', 'Unsupervised Learning'], 'beginner', 'https://www.coursera.org/specializations/machine-learning-introduction', 'published'),
    ('CS50: Introduction to Artificial Intelligence with Python', 'edX (Harvard University)', 'Explore the concepts and algorithms at the foundation of modern artificial intelligence, dive into search algorithms and neural networks.', 'AI Fundamentals', ARRAY['Python', 'Search Algorithms', 'Knowledge Representation', 'Optimization'], 'intermediate', 'https://www.edx.org/learn/artificial-intelligence/harvard-university-cs50-s-introduction-to-artificial-intelligence-with-python', 'published'),
    ('Scientific Computing with Python Certification', 'freeCodeCamp', 'Learn Python fundamentals, data structures, algorithms, and build scientific computing projects from scratch.', 'Programming', ARRAY['Python', 'Algorithms', 'Data Structures', 'OOP'], 'beginner', 'https://www.freecodecamp.org/learn/scientific-computing-with-python/', 'published'),
    ('Practical Deep Learning for Coders', 'Fast.ai', 'A hands-on, top-down deep learning course teaching modern neural network architectures and practical model training.', 'Deep Learning', ARRAY['PyTorch', 'Fastai', 'Computer Vision', 'NLP'], 'intermediate', 'https://course.fast.ai/', 'published'),
    ('Generative AI for Everyone', 'Coursera (DeepLearning.AI)', 'Understand generative AI capabilities, operational limitations, and business engineering applications.', 'Generative AI', ARRAY['LLMs', 'Prompt Engineering', 'Generative Workflows'], 'all_levels', 'https://www.coursera.org/learn/generative-ai-for-everyone', 'published')
ON CONFLICT DO NOTHING;

-- 10. Verification Notice
DO $$
BEGIN
    RAISE NOTICE 'AI CLUB Migration 12 applied successfully: Community, Learning, Project Ideas & Leaderboard ledger operational.';
END $$;
