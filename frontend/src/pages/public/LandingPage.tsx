import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export const LandingPage: React.FC = () => {
  const heroTrackRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (heroTrackRef.current) {
            const rect = heroTrackRef.current.getBoundingClientRect();
            const totalScrollable = rect.height - window.innerHeight;
            if (totalScrollable > 0) {
              const currentScroll = -rect.top;
              const progress = Math.max(0, Math.min(1, currentScroll / totalScrollable));
              setScrollProgress(progress);
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Phase 1: SIET zooms out into the distance (scale 1.0 -> 0.28, opacity 1.0 -> 0)
  const pSiet = Math.min(1, scrollProgress / 0.45);
  const sietScale = 1 - pSiet * 0.72;
  const sietOpacity = scrollProgress < 0.18 ? 1 : Math.max(0, 1 - (scrollProgress - 0.18) / 0.25);
  const sietBlur = pSiet * 5;

  // Phase 2: Current Hero Section appears (scale 0.88 -> 1.0, translateY 32 -> 0, opacity 0 -> 1)
  const pHero = Math.min(1, Math.max(0, (scrollProgress - 0.32) / 0.48));
  const heroOpacity = pHero;
  const heroScale = 0.88 + pHero * 0.12;
  const heroTranslateY = 32 * (1 - pHero);
  const heroPointerEvents = pHero > 0.6 ? 'auto' : 'none';

  return (
    <div className="w-full">
      {/* Scroll-Driven Hero Sequence Track */}
      <div ref={heroTrackRef} className="relative h-[220vh] w-full">
        <div className="sticky top-20 h-[calc(100vh-5rem)] min-h-[580px] w-full flex items-center justify-center overflow-hidden">
          {/* Layer 1: SIET Alone */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none transition-transform duration-75 ease-out"
            style={{
              transform: `scale(${sietScale}) translateZ(0)`,
              opacity: sietOpacity,
              filter: `blur(${sietBlur}px)`,
              willChange: 'transform, opacity, filter',
            }}
          >
            <div className="relative flex flex-col items-center justify-center px-4">
              {/* Subtle ambient radial glow */}
              <div className="absolute -inset-20 bg-gradient-to-tr from-accent-blue/15 via-lavender/20 to-accent-green/15 blur-3xl rounded-full opacity-70 pointer-events-none" />

              <h1 className="relative text-7xl sm:text-9xl md:text-[13rem] lg:text-[17rem] font-black tracking-[0.2em] uppercase text-ink leading-none font-sans drop-shadow-sm">
                SIET
              </h1>

              {/* Minimal Scroll Cue */}
              <div
                className="mt-10 sm:mt-12 flex flex-col items-center gap-2 transition-opacity duration-300"
                style={{ opacity: Math.max(0, 1 - scrollProgress * 6) }}
              >
                <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.3em] uppercase text-ink-muted">
                  Scroll to explore
                </span>
                <ChevronDown className="h-4 w-4 text-ink-muted animate-bounce" />
              </div>
            </div>
          </div>

          {/* Layer 2: Current Hero Section */}
          <div
            className="w-full max-w-7xl px-6 sm:px-8 text-center space-y-8 transition-all duration-75 ease-out"
            style={{
              transform: `scale(${heroScale}) translateY(${heroTranslateY}px) translateZ(0)`,
              opacity: heroOpacity,
              pointerEvents: heroPointerEvents as React.CSSProperties['pointerEvents'],
              willChange: 'transform, opacity',
            }}
          >
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
          </div>
        </div>
      </div>

      {/* Main Page Content */}
      <div className="space-y-24 py-16 md:py-24">
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
    </div>
  );
};
