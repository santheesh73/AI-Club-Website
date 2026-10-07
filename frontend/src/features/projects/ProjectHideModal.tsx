import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { communityApi } from '@/services/communityApi';
import { AlertTriangle, AlertCircle } from 'lucide-react';

interface ProjectHideModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
  onProjectHidden?: () => void;
}

export const ProjectHideModal: React.FC<ProjectHideModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectTitle,
  onProjectHidden,
}) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 3) {
      setError('Please provide a reason with at least 3 characters.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await communityApi.hideProject(projectId, reason.trim());
      if (res.success) {
        if (onProjectHidden) onProjectHidden();
        setReason('');
        onClose();
      } else {
        setError(res.error?.message || 'Failed to hide project.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to hide project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Hide Project from Community">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 text-xs rounded-card bg-accent-orange-subtle text-accent-orange-dark border border-accent-orange/20">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>
            Hiding <span className="font-semibold text-ink">"{projectTitle}"</span> will immediately remove it from public discovery, unfeature it if featured, and prevent owner modifications until restored.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 text-xs rounded-card bg-red-50 text-red-700 border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
              Moderation Reason & Notes
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State the violation or rationale for hiding this project..."
              rows={3}
              className="w-full px-3 py-2 text-sm bg-surface rounded-card border border-surface-border text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-ink"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" disabled={loading}>
              {loading ? 'Hiding Project...' : 'Confirm Hide'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
