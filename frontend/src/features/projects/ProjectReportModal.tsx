import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { communityApi } from '@/services/communityApi';
import type { ReportReason, ReportTargetType } from '@/types/community';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface ProjectReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  targetTitle: string;
  targetType?: ReportTargetType;
  onReportSubmitted?: () => void;
}

export const ProjectReportModal: React.FC<ProjectReportModalProps> = ({
  isOpen,
  onClose,
  targetId,
  targetTitle,
  targetType = 'project',
  onReportSubmitted,
}) => {
  const [reason, setReason] = useState<ReportReason>('inappropriate');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (description.trim().length < 5) {
      setError('Please provide at least 5 characters explaining your report.');
      return;
    }

    setLoading(true);
    try {
      const res = await communityApi.createReport({
        targetType,
        targetId,
        reason,
        description: description.trim(),
      });

      if (res.success) {
        setSuccess(true);
        if (onReportSubmitted) onReportSubmitted();
        setTimeout(() => {
          setSuccess(false);
          setDescription('');
          onClose();
        }, 1500);
      } else {
        setError(res.error?.message || 'Failed to submit report. Please try again.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Report ${targetType === 'project' ? 'Project' : 'Item'}`}>
      <div className="space-y-4">
        <p className="text-sm text-ink-muted leading-relaxed">
          You are reporting <span className="font-semibold text-ink">"{targetTitle}"</span>. All reports are confidential and reviewed by the AI CLUB administrative review committee.
        </p>

        {error && (
          <div className="flex items-center gap-2 p-3 text-xs rounded-card bg-red-50 text-red-700 border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="py-6 flex flex-col items-center justify-center text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-accent-green" />
            <h4 className="font-semibold text-ink">Report Submitted</h4>
            <p className="text-xs text-ink-muted">Thank you for helping maintain community guidelines.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                Reason for report
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as ReportReason)}
                className="w-full px-3 py-2 text-sm bg-surface rounded-card border border-surface-border text-ink focus:outline-none focus:ring-1 focus:ring-ink"
              >
                <option value="inappropriate">Inappropriate or offensive content</option>
                <option value="spam">Spam or low-quality promotional content</option>
                <option value="copyright">Plagiarism or copyright infringement</option>
                <option value="misleading">Misleading or false claims</option>
                <option value="abuse">Harassment or abusive conduct</option>
                <option value="other">Other policy violation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                Explanation & Context
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe why this content violates community guidelines..."
                rows={4}
                className="w-full px-3 py-2 text-sm bg-surface rounded-card border border-surface-border text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-ink"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" variant="danger" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Report'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
