import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Link } from 'react-router-dom';

export const LearnPage: React.FC = () => {
  const learningTracks = [
    {
      title: 'Track 1: Mathematical & Algorithmic Foundations',
      description: 'Master linear algebra, multivariate calculus, probability distributions, and core optimization routines for machine learning.',
      topics: ['Matrix Decomposition & SVD', 'Gradient Descent Variants', 'Convex Optimization', 'Statistical Estimation & MLE'],
      level: 'Foundational',
    },
    {
      title: 'Track 2: Deep Learning & Computer Vision',
      description: 'Architect, train, and validate convolutional networks, vision transformers, and multimodal perception pipelines.',
      topics: ['CNN Architectures (ResNet, ConvNeXt)', 'Vision Transformers (ViT)', 'Object Detection (YOLOv8)', 'Segmentation & Latent Models'],
      level: 'Intermediate',
    },
    {
      title: 'Track 3: Generative AI & Large Language Models',
      description: 'Understand attention mechanisms, autoregressive generation, parameter-efficient fine-tuning (LoRA), and retrieval-augmented generation (RAG).',
      topics: ['Scaled Dot-Product Attention', 'Hugging Face & PyTorch Ecosystem', 'LoRA & QLoRA Quantization', 'Vector Databases & LangChain'],
      level: 'Advanced',
    },
    {
      title: 'Track 4: Production MLOps & Autonomous Agents',
      description: 'Deploy models into high-throughput production infrastructure, implement telemetry, and orchestrate multi-agent workflows.',
      topics: ['FastAPI & Triton Inference Server', 'Docker & GPU Containerization', 'LangGraph Multi-Agent Systems', 'Model Monitoring & Drift Detection'],
      level: 'Advanced',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-8 py-16 space-y-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <Badge variant="neutral">Curriculum Overview</Badge>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-ink">
          The AI CLUB Learning Tracks
        </h1>
        <p className="text-lg text-ink-secondary leading-relaxed">
          Our internal curriculum takes students from core algorithmic principles to deploying frontier models in production.
          Active members receive access to full interactive lessons, code laboratories, and compute environments.
        </p>
      </div>

      {/* Tracks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {learningTracks.map((track) => (
          <Card key={track.title} className="shadow-subtle hover:shadow-elevated transition-shadow flex flex-col justify-between">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge variant={track.level === 'Foundational' ? 'neutral' : track.level === 'Intermediate' ? 'lavender' : 'orange'}>
                  {track.level}
                </Badge>
              </div>
              <CardTitle className="text-xl">{track.title}</CardTitle>
              <CardDescription className="text-sm leading-relaxed mt-2">
                {track.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-t border-surface-border pt-3">
                <div className="text-xs font-semibold text-ink uppercase tracking-wider mb-2">Key Modules</div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-ink-muted">
                  {track.topics.map((t) => (
                    <li key={t} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-ink/40" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CTA Box */}
      <div className="rounded-card-lg bg-surface border border-surface-border p-8 sm:p-10 shadow-soft text-center space-y-4">
        <h2 className="text-2xl font-bold text-ink">Unlock Member Learning Workspaces</h2>
        <p className="text-sm text-ink-muted max-w-xl mx-auto">
          Pass the 25-MCQ admission assessment to join AI CLUB cohorts, collaborate with peer engineering teams, and earn verified certifications.
        </p>
        <div className="pt-2 flex justify-center gap-4">
          <Link to="/register">
            <Button size="lg" className="shadow-elevated">Apply to AI CLUB</Button>
          </Link>
          <Link to="/projects">
            <Button variant="outline" size="lg">Explore Member Projects</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
