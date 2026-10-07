import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth';

export const MemberAiPage: React.FC = () => {
  const { profile } = useAuth();
  const [query, setQuery] = useState('');
  const [responses, setResponses] = useState<Array<{ q: string; a: string; time: string }>>([
    {
      q: 'How does Scaled Dot-Product Attention prevent vanishing gradients compared to standard dot products?',
      a: 'Dividing Q * K^T by sqrt(d_k) stabilizes the dot product magnitude as dimension d_k grows large. Without scaling, large dot products push the softmax activation function into regions with extremely small gradients, impeding backpropagation during deep transformer training.',
      time: 'Recently',
    },
    {
      q: 'Which project sprint would best fit my profile interests?',
      a: `Based on your department (${profile?.department || 'AI/CS'}) and focus areas (${(profile?.interests || ['Deep Learning']).join(', ')}), we recommend collaborating on "Vision Transformer for Satellite Land-Cover Classification" or exploring the newly published "Autonomous Multi-Agent Orchestration" sprint in the Project Ideas board.`,
      time: 'Yesterday',
    },
  ]);
  const [isAsking, setIsAsking] = useState(false);

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsAsking(true);
    const userQ = query;
    setQuery('');

    setTimeout(() => {
      setResponses((prev) => [
        {
          q: userQ,
          a: `Analysis for "${userQ}": In the context of AI CLUB's curriculum, review the Deep Learning & Transformer architecture lessons in Track 3. Ensure parameter bounds and learning rates are configured via cosine decay schedules to achieve robust convergence.`,
          time: 'Just now',
        },
        ...prev,
      ]);
      setIsAsking(false);
    }, 700);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="lavender">Member Intelligence</Badge>
          <span className="text-xs text-ink-muted">AI Research Companion</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">AI Learning Assistant</h1>
        <p className="text-sm text-ink-muted">
          Ask architectural questions, get explainers on complex research papers, or receive personalized project recommendations.
        </p>
      </div>

      <Card className="shadow-subtle">
        <CardContent className="pt-6">
          <form onSubmit={handleAsk} className="space-y-3">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything about AI theory, PyTorch implementations, or project sprint guidance..."
              rows={3}
              className="w-full px-3.5 py-2.5 text-sm bg-canvas border border-surface-border rounded-cardSm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-ink"
              required
            />
            <div className="flex justify-between items-center pt-1">
              <span className="text-[11px] text-ink-muted">
                Deterministic academic fallback engine enabled for active members.
              </span>
              <Button type="submit" size="sm" isLoading={isAsking}>
                Consult Assistant
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-ink uppercase tracking-wider">Consultation History</h2>
        {responses.map((item, idx) => (
          <Card key={idx} className="shadow-subtle border-surface-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                  <span className="text-amber-600">Q:</span> {item.q}
                </span>
                <span className="text-[11px] text-ink-muted">{item.time}</span>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-ink-secondary leading-relaxed bg-surface-muted/30 pt-3 border-t border-surface-border">
              <div className="flex items-start gap-2">
                <Badge variant="neutral" className="text-[10px] shrink-0 mt-0.5">AI</Badge>
                <div>{item.a}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
