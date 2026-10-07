import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface RejectReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<boolean>;
  studentName: string;
  applicationNumber: string;
  isSubmitting: boolean;
}

export const RejectReasonModal: React.FC<RejectReasonModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  studentName,
  applicationNumber,
  isSubmitting,
}) => {
  const [reason, setReason] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const trimmed = reason.trim();
  const isValid = trimmed.length >= 3;

  const handleConfirm = async () => {
    if (!isValid) {
      setValidationError('Please enter a valid rejection reason (minimum 3 characters).');
      return;
    }

    setValidationError(null);
    const success = await onConfirm(trimmed);
    if (success) {
      setReason('');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      title="Reject Application"
      description={`Record official rejection determination for ${studentName} (${applicationNumber}).`}
    >
      <div className="space-y-4">
        <div className="p-4 rounded-card-sm bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="font-semibold">A documented rejection reason is mandatory.</p>
            <p className="text-red-700 leading-relaxed">
              This determination is recorded into the authoritative audit trail. The student will see their status updated to DECLINED.
            </p>
          </div>
        </div>

        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <label htmlFor="rejection-reason" className="text-xs font-semibold text-ink">
              Official Rejection Reason <span className="text-red-600">*</span>
            </label>
            <span
              className={`text-[10px] font-mono ${
                trimmed.length < 3 ? 'text-ink-muted' : 'text-accent-green-dark'
              }`}
            >
              {trimmed.length} chars
            </span>
          </div>
          <textarea
            id="rejection-reason"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (validationError && e.target.value.trim().length >= 3) {
                setValidationError(null);
              }
            }}
            disabled={isSubmitting}
            placeholder="e.g., Prerequisites in core linear algebra not satisfied; assessment score fell below departmental admission threshold..."
            rows={4}
            className={`w-full text-xs p-3 rounded-card-sm border bg-surface text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 ${
              validationError
                ? 'border-red-400 focus:ring-red-500'
                : 'border-surface-border focus:ring-ink'
            }`}
          />
          {validationError && (
            <p className="text-[11px] text-red-600 font-medium">{validationError}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-border">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleConfirm}
            isLoading={isSubmitting}
            disabled={!isValid || isSubmitting}
          >
            Confirm Rejection
          </Button>
        </div>
      </div>
    </Modal>
  );
};
