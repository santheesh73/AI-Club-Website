import React, { useState } from 'react';
import { CheckCircle2, ShieldAlert } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface ApproveConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (notes?: string) => Promise<boolean>;
  studentName: string;
  applicationNumber: string;
  assessmentScore?: number | null;
  isSubmitting: boolean;
}

export const ApproveConfirmModal: React.FC<ApproveConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  studentName,
  applicationNumber,
  assessmentScore,
  isSubmitting,
}) => {
  const [notes, setNotes] = useState('');

  const handleConfirm = async () => {
    const success = await onConfirm(notes.trim() || undefined);
    if (success) {
      setNotes('');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      title="Approve Candidate Application?"
      description={`Confirm admissions selection for ${studentName} (${applicationNumber}).`}
    >
      <div className="space-y-4">
        <div className="p-4 rounded-card-sm bg-accent-green-subtle/50 border border-accent-green/20 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-semibold text-accent-green-dark">
            <CheckCircle2 className="h-4 w-4" />
            <span>Admissions Confirmation</span>
          </div>
          <p className="text-ink-secondary leading-relaxed">
            Approving this application marks the applicant as officially selected for AI CLUB.
            {assessmentScore !== null && assessmentScore !== undefined && (
              <span className="block mt-1 font-mono font-medium text-ink">
                Verified Exam Score: {assessmentScore} / 25
              </span>
            )}
          </p>
        </div>

        <div className="p-3.5 rounded-card-sm bg-canvas-alt border border-surface-border flex items-start gap-2.5 text-xs text-ink-muted">
          <ShieldAlert className="h-4 w-4 text-ink-muted mt-0.5 flex-shrink-0" />
          <p>
            Membership induction, role elevation, and onboarding access will be activated in <strong>Milestone 5</strong>. This action transitions the dossier to <strong>APPROVED</strong>.
          </p>
        </div>

        <div className="space-y-1.5 pt-1">
          <label htmlFor="approve-notes" className="text-xs font-semibold text-ink">
            Administrative Review Notes (Optional / Internal)
          </label>
          <textarea
            id="approve-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isSubmitting}
            placeholder="e.g., Selected for exceptional research paper discussion during review..."
            rows={3}
            className="w-full text-xs p-3 rounded-card-sm border border-surface-border bg-surface text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-ink"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-border">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleConfirm}
            isLoading={isSubmitting}
          >
            Confirm Approval
          </Button>
        </div>
      </div>
    </Modal>
  );
};
