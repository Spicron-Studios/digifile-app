'use client';
import { getLogger } from '@/app/lib/logger';

import React from 'react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (_error: Error, _errorInfo: React.ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  hasRetried: boolean;
}

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
  hasRetried,
}) => (
  <Card className="p-6 m-4 border-red-200 bg-red-50">
    <div className="text-center">
      <h2 className="text-lg font-semibold text-red-800 mb-2">
        Something went wrong
      </h2>
      <p className="text-red-600 mb-4">
        {error.message || 'An unexpected error occurred'}
      </p>
      <div className="space-y-2">
        <Button
          onClick={resetErrorBoundary}
          variant="outline"
          className="border-red-300 text-red-700 hover:bg-red-100"
        >
          {hasRetried ? 'Try Again' : 'Retry'}
        </Button>
        <p className="text-sm text-red-500">
          If this problem persists, please contact support.
        </p>
      </div>
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-4 text-left">
          <summary className="cursor-pointer text-sm text-red-700 mb-2">
            Error Details (Development Only)
          </summary>
          <pre className="text-xs bg-red-100 p-2 rounded border overflow-auto">
            {error.stack}
          </pre>
        </details>
      )}
    </div>
  </Card>
);

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private retryCount = 0;
  private readonly maxRetries = 3;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({
      error,
      errorInfo,
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error via centralized logger
    {
      const logger = getLogger();
      // Fire-and-forget; avoid blocking error boundary
      void logger.error(
        'app/components/ErrorBoundary.tsx',
        `ErrorBoundary caught an error: ${error.message} | info: ${JSON.stringify(
          errorInfo
        )}`
      );
    }

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error reporting service
      // errorReportingService.captureException(error, { extra: errorInfo });
    }
  }

  componentDidUpdate(
    prevProps: ErrorBoundaryProps,
    prevState: ErrorBoundaryState
  ): void {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    if (hasError && !prevState.hasError) {
      // Error boundary just caught an error
      return;
    }

    if (hasError && resetOnPropsChange) {
      // Reset on any prop change
      this.resetErrorBoundary();
      return;
    }

    if (hasError && resetKeys) {
      const prevResetKeys = prevProps.resetKeys || [];
      const hasResetKeyChanged = resetKeys.some(
        (resetKey, idx) => prevResetKeys[idx] !== resetKey
      );

      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }
  }

  resetErrorBoundary = (): void => {
    this.retryCount += 1;
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): React.ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback: Fallback = DefaultErrorFallback } = this.props;

    if (hasError && error) {
      // Prevent infinite retry loops
      if (this.retryCount >= this.maxRetries) {
        return (
          <Card className="p-6 m-4 border-red-200 bg-red-50">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-red-800 mb-2">
                Application Error
              </h2>
              <p className="text-red-600 mb-4">
                The application encountered a persistent error. Please refresh
                the page.
              </p>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Refresh Page
              </Button>
            </div>
          </Card>
        );
      }

      return (
        <Fallback
          error={error}
          resetErrorBoundary={this.resetErrorBoundary}
          hasRetried={this.retryCount > 0}
        />
      );
    }

    return children;
  }
}

/**
 * Hook for using error boundary in functional components
 */
export function useErrorHandler(): (_error: Error) => void {
  return React.useCallback((_error: Error) => {
    throw _error;
  }, []);
}

/**
 * Higher-order component for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

export default ErrorBoundary;
