import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-canvas">
          <div className="max-w-md w-full bg-surface border border-surface-border rounded-card p-8 text-center shadow-soft">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-ink mb-2">Something went wrong</h2>
            <p className="text-sm text-ink-muted mb-4">
              An unexpected error occurred while rendering this interface.
            </p>
            {this.state.error && (
              <div className="mb-4 p-3 rounded bg-red-50 text-red-800 text-xs font-mono text-left overflow-auto max-h-32 border border-red-200">
                {this.state.error.message}
              </div>
            )}
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={this.handleReset} variant="primary" size="sm">
                Try Again
              </Button>
              <Button onClick={() => window.location.reload()} variant="outline" size="sm">
                Reload Page
              </Button>
              <Button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/admin';
                }}
                variant="ghost"
                size="sm"
              >
                Dashboard
              </Button>
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
