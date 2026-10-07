import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface WaitlistConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (notes?: string) => Promise<boolean>;
  studentName: string;
  applicationNumber: string;
  isSubmitting: boolean;
}

export const WaitlistConfirmModal: React.FC<WaitlistConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  studentName,
  applicationNumber,
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
      title="Waitlist Application?"
      description={`Place ${studentName} (${applicationNumber}) on the admissions waitlist.`}
    >
      <div className="space-y-4">
        <div className="p-4 rounded-card-sm bg-accent-orange-subtle/50 border border-accent-orange/20 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-semibold text-accent-orange-dark">
            <Clock className="h-4 w-4" />
            <span>Waitlist Pool</span>
          </div>
          <p className="text-ink-secondary leading-relaxed">
            The candidate will remain eligible for subsequent intake allocations. The applicant portal will display their status as <strong>WAITLISTED</strong>.
          </p>
        </div>

        <div className="space-y-1.5 pt-1">
          <label htmlFor="waitlist-notes" className="text-xs font-semibold text-ink">
            Internal Committee Notes (Optional)
          </label>
          <textarea
            id="waitlist-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isSubmitting}
            placeholder="e.g., Solid test score, cohort currently at capacity for CSE year 3..."
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
            Confirm Waitlist
          </Button>
        </div>
      </div>
    </Modal>
  );
};
