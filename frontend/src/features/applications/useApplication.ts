import { useState, useEffect, useCallback } from 'react';
import { applicationApi } from '@/services/applicationApi';
import type { Application, ApplicationStatusResponse } from '@/types/application';

export function useApplication() {
  const [application, setApplication] = useState<Application | null>(null);
  const [statusData, setStatusData] = useState<ApplicationStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await applicationApi.getApplicationStatus();
      if (response.success && response.data) {
        setStatusData(response.data);
        if (response.data.application) {
          setApplication(response.data.application);
        } else if (response.data.hasApplication) {
          const myApp = await applicationApi.getMyApplication();
          if (myApp.success && myApp.data) {
            setApplication(myApp.data);
          }
        } else {
          setApplication(null);
        }
      } else if (!response.success) {
        setError(response.error.message || 'Failed to load application status');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error fetching application';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const createApplication = async (): Promise<{ success: boolean; data?: Application; error?: string }> => {
    setError(null);
    try {
      const res = await applicationApi.createApplication();
      if (res.success && res.data) {
        setApplication(res.data);
        await fetchStatus();
        return { success: true, data: res.data };
      }
      const errMsg = !res.success ? res.error.message : 'Could not create application';
      setError(errMsg);
      return { success: false, error: errMsg };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to create application';
      setError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  return {
    application,
    statusData,
    isLoading,
    error,
    refreshStatus: fetchStatus,
    createApplication,
  };
}
