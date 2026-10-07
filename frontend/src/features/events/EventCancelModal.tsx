import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface EventCancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  eventTitle: string;
  isSubmitting: boolean;
}

export const EventCancelModal: React.FC<EventCancelModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  eventTitle,
  isSubmitting,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 3) {
      setError('Cancellation rationale is required (minimum 3 characters).');
      return;
    }
    setError(null);
    await onConfirm(reason.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-card-lg bg-surface border border-surface-border p-6 shadow-soft space-y-4">
        <div className="flex items-center gap-3 text-red-600">
          <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-ink">Cancel Event?</h3>
            <p className="text-xs text-ink-muted">This action transitions the event to CANCELLED.</p>
          </div>
        </div>

        <p className="text-xs text-ink-secondary leading-relaxed">
          Are you sure you want to cancel <strong>{eventTitle}</strong>? Registered members will no longer be able to attend and registration will be terminated.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Cancellation Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Inclement weather or speaker scheduling conflict."
              rows={3}
              className="w-full px-3 py-2 text-xs rounded-card-sm border border-surface-border bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-ink"
              disabled={isSubmitting}
            />
            {error && <p className="text-[11px] text-red-600 mt-1">{error}</p>}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
              Keep Event Active
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              disabled={isSubmitting || reason.trim().length < 3}
            >
              <span>{isSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
