import React from 'react';
import { CheckCircle2, Clock, AlertCircle, CircleDashed } from 'lucide-react';
import type { ApplicationStatus } from '@/types/application';

interface ApplicationTimelineProps {
  profileComplete?: boolean;
  hasApplication: boolean;
  applicationStatus?: ApplicationStatus;
  assessmentStatus?: 'not_started' | 'in_progress' | 'completed' | 'expired';
}

interface Step {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'pending' | 'warning';
}

export const ApplicationTimeline: React.FC<ApplicationTimelineProps> = ({
  hasApplication,
  applicationStatus,
  assessmentStatus = 'not_started',
}) => {
  const steps: Step[] = [
    {
      id: 'account',
      title: '1. Account & Candidate Record',
      description: hasApplication
        ? 'Candidate account and application generated'
        : 'Candidate account registered',
      status: 'completed',
    },
    {
      id: 'assessment',
      title: '2. 25-MCQ Technical Assessment',
      description:
        assessmentStatus === 'completed'
          ? 'Exam evaluated & score authoritatively recorded'
          : assessmentStatus === 'in_progress'
          ? 'Timed assessment in progress'
          : '30-minute timed entrance examination',
      status:
        assessmentStatus === 'completed'
          ? 'completed'
          : 'current',
    },
    {
      id: 'under_review',
      title: '3. Under Committee Review',
      description:
        applicationStatus === 'under_review' || assessmentStatus === 'completed'
          ? 'Submission queued for admissions evaluation'
          : 'Awaiting assessment completion',
      status:
        applicationStatus === 'under_review' || assessmentStatus === 'completed'
          ? 'current'
          : 'pending',
    },
    {
      id: 'admin_decision',
      title: '4. Admissions Decision',
      description:
        applicationStatus === 'accepted'
          ? 'Application Accepted into AI CLUB'
          : applicationStatus === 'rejected'
          ? 'Application Decision Released'
          : applicationStatus === 'waitlisted'
          ? 'Candidate Waitlisted'
          : 'Admissions committee cohort evaluation',
      status:
        applicationStatus === 'accepted' ||
        applicationStatus === 'rejected' ||
        applicationStatus === 'waitlisted'
          ? 'completed'
          : 'pending',
    },
    {
      id: 'membership',
      title: '5. Member Induction & Full Profile Setup',
      description:
        applicationStatus === 'accepted'
          ? 'Complete member credentials, portfolio, and project showcase'
          : 'Unlocked upon cohort selection as official club member',
      status: applicationStatus === 'accepted' ? 'current' : 'pending',
    },
  ];

  return (
    <div className="w-full bg-surface border border-surface-border rounded-card p-6 shadow-soft">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-ink">Admission Pipeline</h3>
          <p className="text-xs text-ink-muted">
            Track your progression from registration to member induction.
          </p>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded-pill bg-canvas-alt text-ink-secondary border border-surface-border">
          5-Stage Progression
        </span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-surface-border">
        {steps.map((step) => {
          return (
            <div key={step.id} className="relative flex items-start gap-4">
              <div className="absolute -left-6 mt-0.5">
                {step.status === 'completed' && (
                  <div className="h-5 w-5 rounded-full bg-accent-green text-surface flex items-center justify-center ring-4 ring-canvas">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                )}
                {step.status === 'current' && (
                  <div className="h-5 w-5 rounded-full bg-ink text-canvas flex items-center justify-center ring-4 ring-canvas animate-pulse">
                    <Clock className="h-3.5 w-3.5" />
                  </div>
                )}
                {step.status === 'warning' && (
                  <div className="h-5 w-5 rounded-full bg-accent-orange text-surface flex items-center justify-center ring-4 ring-canvas">
                    <AlertCircle className="h-3.5 w-3.5" />
                  </div>
                )}
                {step.status === 'pending' && (
                  <div className="h-5 w-5 rounded-full bg-surface-muted border border-surface-border text-ink-faint flex items-center justify-center ring-4 ring-canvas">
                    <CircleDashed className="h-3 w-3" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-semibold ${
                      step.status === 'completed'
                        ? 'text-ink'
                        : step.status === 'current'
                        ? 'text-ink'
                        : 'text-ink-muted'
                    }`}
                  >
                    {step.title}
                  </span>
                  {step.status === 'current' && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-ink text-canvas">
                      Current Stage
                    </span>
                  )}
                  {step.status === 'completed' && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-accent-green-subtle text-accent-green-dark">
                      Completed
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink-muted mt-0.5">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
