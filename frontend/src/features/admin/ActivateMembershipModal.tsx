import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Award, AlertCircle } from 'lucide-react';

interface ActivateMembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (notes?: string) => Promise<void>;
  studentName: string;
  applicationNumber: string;
  isSubmitting: boolean;
}

export const ActivateMembershipModal: React.FC<ActivateMembershipModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  studentName,
  applicationNumber,
  isSubmitting,
}) => {
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm(notes.trim() || undefined);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="activate-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="w-full max-w-lg rounded-card-lg bg-surface border border-surface-border shadow-soft p-6 sm:p-8 space-y-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-accent-green-subtle text-accent-green flex items-center justify-center flex-shrink-0">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <h3 id="activate-modal-title" className="text-lg font-bold text-ink">
              Activate Club Membership
            </h3>
            <p className="text-xs text-ink-muted mt-1 leading-relaxed">
              Confirm membership induction for this approved candidate. This will issue a unique official member number and activate member dashboard access.
            </p>
          </div>
        </div>

        {/* Candidate Details Card */}
        <div className="p-4 rounded-card-sm bg-canvas-alt border border-surface-border space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-ink-muted">Candidate:</span>
            <span className="font-semibold text-ink">{studentName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-muted">Application #:</span>
            <span className="font-mono font-semibold text-ink">{applicationNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-muted">Application Status:</span>
            <span className="font-semibold text-accent-green">APPROVED</span>
          </div>
        </div>

        {/* Informational Notice */}
        <div className="p-3.5 rounded-card-sm bg-canvas border border-surface-border text-xs text-ink-secondary flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-ink-muted flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            The server will transactionally generate an authoritative member number (`AIC-YYYY-XXXX`), upgrade the student's permissions, and record an immutable audit entry.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Induction Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Admitted to 2026 Core AI cohort. Outstanding machine learning capstone submission."
              rows={3}
              className="w-full px-3 py-2 text-xs rounded-card-sm border border-surface-border bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-ink"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              className="bg-accent-green text-ink font-semibold hover:bg-accent-green/90"
            >
              <span>{isSubmitting ? 'Activating Membership...' : 'Confirm Activation'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
