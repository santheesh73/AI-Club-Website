import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '@/services/adminApi';
import type { AdminApplicationDetail } from '@/types/admin';

export function useAdminApplicationDetail(applicationId?: string) {
  const [detail, setDetail] = useState<AdminApplicationDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [decisionSuccessMessage, setDecisionSuccessMessage] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!applicationId) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await adminApi.getApplicationDetail(applicationId);
      if (res.success && res.data) {
        setDetail(res.data);
      } else if (!res.success) {
        setError(res.error.message || 'Failed to load applicant detail');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error retrieving applicant dossier';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const approve = async (reviewerNotes?: string): Promise<boolean> => {
    if (!applicationId) return false;
    setIsSubmitting(true);
    setError(null);
    setDecisionSuccessMessage(null);

    try {
      const res = await adminApi.approveApplication(applicationId, reviewerNotes);
      if (res.success && res.data) {
        setDecisionSuccessMessage('Application successfully approved! Candidate is queued for Milestone 5 induction.');
        await fetchDetail();
        return true;
      } else if (!res.success) {
        setError(res.error.message || 'Approval action failed');
        return false;
      }
      return false;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error approving application';
      setError(msg);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const waitlist = async (reviewerNotes?: string): Promise<boolean> => {
    if (!applicationId) return false;
    setIsSubmitting(true);
    setError(null);
    setDecisionSuccessMessage(null);

    try {
      const res = await adminApi.waitlistApplication(applicationId, reviewerNotes);
      if (res.success && res.data) {
        setDecisionSuccessMessage('Application successfully moved to WAITLISTED status.');
        await fetchDetail();
        return true;
      } else if (!res.success) {
        setError(res.error.message || 'Waitlist action failed');
        return false;
      }
      return false;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error waitlisting application';
      setError(msg);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const reject = async (reason: string): Promise<boolean> => {
    if (!applicationId) return false;
    if (!reason || reason.trim().length < 3) {
      setError('Rejection reason is required (minimum 3 characters).');
      return false;
    }

    setIsSubmitting(true);
    setError(null);
    setDecisionSuccessMessage(null);

    try {
      const res = await adminApi.rejectApplication(applicationId, reason.trim());
      if (res.success && res.data) {
        setDecisionSuccessMessage('Application marked as REJECTED. Rejection reason has been recorded.');
        await fetchDetail();
        return true;
      } else if (!res.success) {
        setError(res.error.message || 'Rejection action failed');
        return false;
      }
      return false;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error rejecting application';
      setError(msg);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    detail,
    isLoading,
    isSubmitting,
    error,
    decisionSuccessMessage,
    approve,
    waitlist,
    reject,
    refresh: fetchDetail,
    clearMessages: () => {
      setError(null);
      setDecisionSuccessMessage(null);
    },
  };
}
