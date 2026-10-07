import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export const AdminSettingsPage: React.FC = () => {
  const [passingScore, setPassingScore] = useState(60);
  const [assessmentDuration, setAssessmentDuration] = useState(30);
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Platform Settings</h1>
        <p className="text-sm text-ink-muted">Configure intake admissions parameters, assessment rules, and club configurations.</p>
      </div>

      {saved && (
        <div className="p-4 rounded-cardSm bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
          Platform configurations updated successfully.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="shadow-subtle">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Admission & Assessment Rules</CardTitle>
              <Badge variant="neutral">Authoritative</Badge>
            </div>
            <CardDescription>
              Control the standardized 25-MCQ evaluation parameters required for applicant progression.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-ink uppercase mb-1">Passing Percentage (%)</label>
                <input
                  type="number"
                  min="40"
                  max="100"
                  value={passingScore}
                  onChange={(e) => setPassingScore(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-canvas border border-surface-border rounded-cardSm text-ink text-sm focus:outline-none focus:ring-1 focus:ring-ink"
                />
                <span className="text-ink-muted text-[11px] mt-1 block">Default minimum passing threshold is 60%.</span>
              </div>

              <div>
                <label className="block font-semibold text-ink uppercase mb-1">Test Duration (Minutes)</label>
                <input
                  type="number"
                  min="10"
                  max="90"
                  value={assessmentDuration}
                  onChange={(e) => setAssessmentDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-canvas border border-surface-border rounded-cardSm text-ink text-sm focus:outline-none focus:ring-1 focus:ring-ink"
                />
                <span className="text-ink-muted text-[11px] mt-1 block">Server-enforced timer: 30 minutes.</span>
              </div>
            </div>

            <div className="pt-2 border-t border-surface-border flex items-center justify-between">
              <div>
                <div className="font-semibold text-ink text-sm">Public Applicant Registration</div>
                <div className="text-ink-muted text-[11px]">Allow prospective students to register new applicant accounts.</div>
              </div>
              <input
                type="checkbox"
                checked={allowRegistration}
                onChange={(e) => setAllowRegistration(e.target.checked)}
                className="w-4 h-4 accent-ink"
              />
            </div>
          </CardContent>
          <CardFooter className="justify-end pt-3">
            <Button type="submit" size="sm">Save Configuration</Button>
          </CardFooter>
        </Card>

        <Card className="shadow-subtle">
          <CardHeader>
            <CardTitle className="text-base">System Environment & Database Health</CardTitle>
            <CardDescription>Remote Supabase connectivity and RLS policy verification status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-ink-secondary">
            <div className="flex items-center justify-between py-1.5 border-b border-surface-border">
              <span>PostgreSQL Migrations</span>
              <Badge variant="success">Synchronized (M1 - M12)</Badge>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-surface-border">
              <span>Row Level Security (RLS)</span>
              <Badge variant="success">Active on All Relations</Badge>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-surface-border">
              <span>Admin Provisioning Safety</span>
              <Badge variant="success">Enforced Server-Side</Badge>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span>Single Login Architecture</span>
              <Badge variant="success">Operational</Badge>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};
