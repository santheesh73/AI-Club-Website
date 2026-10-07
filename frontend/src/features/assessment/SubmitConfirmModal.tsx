import React from 'react';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface SubmitConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  totalQuestions: number;
  answeredCount: number;
  isSubmitting: boolean;
}

export const SubmitConfirmModal: React.FC<SubmitConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  totalQuestions,
  answeredCount,
  isSubmitting,
}) => {
  const unansweredCount = totalQuestions - answeredCount;
  const isComplete = unansweredCount === 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      title="Submit Assessment?"
      description="Please verify your completion status before final submission."
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="p-3.5 rounded-card-sm bg-accent-green-subtle/50 border border-accent-green/20">
            <div className="flex items-center gap-1.5 text-xs text-accent-green-dark font-medium">
              <CheckCircle2 className="h-4 w-4" />
              <span>Answered</span>
            </div>
            <p className="mt-1 text-2xl font-bold font-mono text-accent-green-dark">
              {answeredCount} / {totalQuestions}
            </p>
          </div>

          <div
            className={`p-3.5 rounded-card-sm border ${
              isComplete
                ? 'bg-canvas-alt border-surface-border'
                : 'bg-accent-orange-subtle/50 border-accent-orange/20'
            }`}
          >
            <div
              className={`flex items-center gap-1.5 text-xs font-medium ${
                isComplete ? 'text-ink-muted' : 'text-accent-orange-dark'
              }`}
            >
              <AlertCircle className="h-4 w-4" />
              <span>Unanswered</span>
            </div>
            <p
              className={`mt-1 text-2xl font-bold font-mono ${
                isComplete ? 'text-ink-muted' : 'text-accent-orange-dark'
              }`}
            >
              {unansweredCount}
            </p>
          </div>
        </div>

        {!isComplete && (
          <div className="p-3.5 rounded-card-sm bg-accent-orange-subtle/40 border border-accent-orange/30 text-xs text-accent-orange-dark space-y-1">
            <p className="font-semibold">You have unanswered questions remaining.</p>
            <p className="text-ink-secondary">
              Unanswered questions receive 0 marks. You can still return to the test and answer them before submitting or before the timer expires.
            </p>
          </div>
        )}

        <div className="p-3.5 rounded-card-sm bg-canvas-alt border border-surface-border text-xs text-ink-muted flex items-start gap-2.5">
          <Clock className="h-4 w-4 text-ink-muted mt-0.5 flex-shrink-0" />
          <p>
            Once confirmed, your submission is final and will be graded authoritatively by the evaluation server.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-border">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Return to Questions
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            isLoading={isSubmitting}
          >
            Confirm & Submit
          </Button>
        </div>
      </div>
    </Modal>
  );
};
