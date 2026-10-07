import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-8 py-16 space-y-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <Badge variant="neutral">About AI CLUB</Badge>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-ink">
          Pioneering Applied Intelligence & Engineering Excellence
        </h1>
        <p className="text-lg text-ink-secondary leading-relaxed">
          Founded as an elite technical collective, AI CLUB bridges university academic research
          and industry-scale machine learning systems through merit, rigor, and collaboration.
        </p>
      </div>

      {/* Core Mission Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="shadow-subtle">
          <CardHeader>
            <Badge variant="lavender" className="w-fit mb-2">Research</Badge>
            <CardTitle className="text-xl">Empirical Investigation</CardTitle>
            <CardDescription>
              Delving deep into model architectures, parameter-efficient fine-tuning, and alignment science.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-ink-muted leading-relaxed">
            Members participate in weekly paper clinics, reproduce seminal research papers, and author peer-reviewed submissions for global AI workshops and conferences.
          </CardContent>
        </Card>

        <Card className="shadow-subtle">
          <CardHeader>
            <Badge variant="success" className="w-fit mb-2">Engineering</Badge>
            <CardTitle className="text-xl">Production Systems</CardTitle>
            <CardDescription>
              Translating mathematical models into low-latency, scalable microservices and user applications.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-ink-muted leading-relaxed">
            From quantization and ONNX runtimes to distributed Kubernetes GPU clusters, members build software that operates reliably in real production environments.
          </CardContent>
        </Card>

        <Card className="shadow-subtle">
          <CardHeader>
            <Badge variant="orange" className="w-fit mb-2">Community</Badge>
            <CardTitle className="text-xl">Merit-Based Governance</CardTitle>
            <CardDescription>
              An inclusive, high-standard community powered by objective evaluation and mentorship.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-ink-muted leading-relaxed">
            Admission is evaluated solely on demonstrated capability via our standardized 25-MCQ assessment and portfolio review by the technical advisory committee.
          </CardContent>
        </Card>
      </div>

      {/* Charter Section */}
      <div className="rounded-card-lg bg-surface border border-surface-border p-8 sm:p-12 shadow-soft space-y-6">
        <div className="space-y-2">
          <Badge variant="neutral">The Collective Charter</Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-ink">Our Guiding Principles</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-ink-secondary leading-relaxed">
          <div className="space-y-2">
            <h3 className="font-semibold text-ink text-base">1. Code Over Claims</h3>
            <p className="text-ink-muted">
              We value working implementations, benchmarked results, and reproducible code above abstract assertions. Every project must be verifiable.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-ink text-base">2. Active Peer Review</h3>
            <p className="text-ink-muted">
              All member initiatives undergo rigorous design and code reviews. Feedback is technical, constructive, and oriented toward engineering craft.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-ink text-base">3. Continuous Learning</h3>
            <p className="text-ink-muted">
              The AI landscape evolves weekly. Members commit to continuous skill acquisition across modern frameworks, math foundations, and deployment stacks.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-ink text-base">4. Responsible Stewardship</h3>
            <p className="text-ink-muted">
              We emphasize ethical deployment, data privacy, model safety, and transparent evaluation in every system developed under the club umbrella.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-surface-border flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-ink-muted">
            Ready to contribute to groundbreaking projects?
          </div>
          <Link to="/register">
            <Button size="md">Apply for Membership</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
