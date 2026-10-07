import React from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface CoursePublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  courseTitle: string;
  isSubmitting: boolean;
}

export const CoursePublishModal: React.FC<CoursePublishModalProps> = ({
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
        <div className="flex items-center gap-3 text-accent-green">
          <div className="h-10 w-10 rounded-xl bg-accent-green-subtle flex items-center justify-center flex-shrink-0">
            <Send className="h-5 w-5 text-accent-green" />
          </div>
          <div>
            <h3 className="text-base font-bold text-ink">Publish Course?</h3>
            <p className="text-xs text-ink-muted">Transition from DRAFT to PUBLISHED.</p>
          </div>
        </div>

        <p className="text-xs text-ink-secondary leading-relaxed">
          Publishing <strong>{courseTitle}</strong> will make it visible to all active club members in the learning catalog and allow enrollment and lesson access.
        </p>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Keep as Draft
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="bg-accent-green text-ink font-semibold hover:bg-accent-green/90"
          >
            <span>{isSubmitting ? 'Publishing...' : 'Confirm & Publish'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
