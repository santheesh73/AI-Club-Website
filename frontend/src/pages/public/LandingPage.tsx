import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export const LandingPage: React.FC = () => {
  return (
    <div className="space-y-24 py-12 md:py-20">
      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-6 sm:px-8 text-center space-y-8">
        <div className="inline-flex items-center gap-2">
          <Badge variant="success">Platform Online</Badge>
          <span className="text-xs text-ink-muted">AI Innovation Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-ink max-w-4xl mx-auto leading-[1.08]">
          Where elite builders engineer the frontier of AI.
        </h1>

        <p className="max-w-2xl mx-auto text-lg sm:text-xl text-ink-secondary leading-relaxed">
          AI CLUB is a dedicated collective for students, researchers, and innovators creating production-grade artificial intelligence systems.
        </p>

        {/* STRICT REQUIREMENT: Only two CTA buttons on the entire landing page: Explore and Join Club */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link to="/register">
            <Button size="lg" className="px-8 shadow-elevated">
              Join Club
            </Button>
          </Link>
          <Link to="/learn">
            <Button variant="outline" size="lg" className="px-8">
              Explore
            </Button>
          </Link>
        </div>
      </section>

      {/* Pillars / Feature Grid */}
      <section className="mx-auto max-w-7xl px-6 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <Badge variant="neutral">The Collective Pillars</Badge>
          <h2 className="text-3xl font-bold tracking-tight text-ink">
            A comprehensive lifecycle for AI engineers
          </h2>
          <p className="text-ink-muted text-sm sm:text-base">
            From algorithmic fundamentals to collaborative open research and real-world deployment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="hover:shadow-elevated transition-shadow duration-300">
            <CardHeader>
              <Badge variant="lavender" className="w-fit mb-3">Learn</Badge>
              <CardTitle>Rigorous Curriculum</CardTitle>
              <CardDescription>
                Hands-on courses spanning modern deep learning, LLM architectures, and autonomous agent systems.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-ink-muted border-t border-surface-border pt-4">
                Structured pathways &bull; Practical labs &bull; Code reviews
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-elevated transition-shadow duration-300">
            <CardHeader>
              <Badge variant="success" className="w-fit mb-3">Build</Badge>
              <CardTitle>Production Systems</CardTitle>
              <CardDescription>
                Cross-disciplinary teams shipping full-stack machine learning applications and real user platforms.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-ink-muted border-t border-surface-border pt-4">
                Team formation &bull; Sprint cycles &bull; Project showcases
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-elevated transition-shadow duration-300">
            <CardHeader>
              <Badge variant="orange" className="w-fit mb-3">Research</Badge>
              <CardTitle>Frontier Discovery</CardTitle>
              <CardDescription>
                Reading groups, benchmark evaluations, and empirical exploration of cutting-edge AI methodologies.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-ink-muted border-t border-surface-border pt-4">
                Paper seminars &bull; Reproducibility studies &bull; Publications
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Platform Architecture & Innovation Overview */}
      <section className="mx-auto max-w-5xl px-6 sm:px-8">
        <div className="rounded-card-lg bg-surface border border-surface-border p-8 sm:p-10 shadow-soft">
          <div className="space-y-3">
            <Badge variant="neutral">Club Foundation</Badge>
            <h3 className="text-2xl font-bold text-ink">Authoritative Standards & Merit Intake</h3>
            <p className="text-sm text-ink-muted max-w-2xl leading-relaxed">
              Membership intake is guided by an objective 25-MCQ technical assessment followed by administrative review. 
              Our community is grounded in verified technical skills, active research collaboration, and peer-reviewed project delivery.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
