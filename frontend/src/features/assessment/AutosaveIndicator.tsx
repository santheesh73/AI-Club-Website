import React from 'react';
import { Check, Loader2, AlertCircle } from 'lucide-react';

export type AutosaveStatus = 'idle' | 'saving' | 'error';

interface AutosaveIndicatorProps {
  status: AutosaveStatus;
  lastSavedAt?: Date | null;
}

export const AutosaveIndicator: React.FC<AutosaveIndicatorProps> = ({
  status,
  lastSavedAt,
}) => {
  return (
    <div className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
      {status === 'saving' && (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin text-ink" />
          <span>Saving answer...</span>
        </>
      )}

      {status === 'idle' && (
        <>
          <Check className="h-3.5 w-3.5 text-accent-green" />
          <span>
            {lastSavedAt ? `Saved ${lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'All changes saved'}
          </span>
        </>
      )}

      {status === 'error' && (
        <>
          <AlertCircle className="h-3.5 w-3.5 text-red-500" />
          <span className="text-red-500">Sync error. Retrying...</span>
        </>
      )}
    </div>
  );
};
