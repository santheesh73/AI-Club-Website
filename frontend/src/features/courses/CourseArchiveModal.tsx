import React from 'react';
import { Archive } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface CourseArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  courseTitle: string;
  isSubmitting: boolean;
}

export const CourseArchiveModal: React.FC<CourseArchiveModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  courseTitle,
  isSubmitting,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-card-lg bg-surface border border-surface-border p-6 shadow-soft space-y-4">
        <div className="flex items-center gap-3 text-accent-orange">
          <div className="h-10 w-10 rounded-xl bg-accent-orange-subtle flex items-center justify-center flex-shrink-0">
            <Archive className="h-5 w-5 text-accent-orange" />
          </div>
          <div>
            <h3 className="text-base font-bold text-ink">Archive Course?</h3>
            <p className="text-xs text-ink-muted">Transition from PUBLISHED to ARCHIVED.</p>
          </div>
        </div>

        <p className="text-xs text-ink-secondary leading-relaxed">
          Archiving <strong>{courseTitle}</strong> will hide it from the public and member catalogs. Existing enrolled learners will retain access to review materials, but new enrollments will be disabled.
        </p>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="bg-accent-orange text-white hover:bg-accent-orange/90"
          >
            <span>{isSubmitting ? 'Archiving...' : 'Confirm & Archive'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
