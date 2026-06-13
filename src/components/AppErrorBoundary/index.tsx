import type {ErrorInfo, PropsWithChildren, ReactNode} from 'react';

import React from 'react';
import {ErrorBoundary} from 'react-error-boundary';

import DefaultFallback from './DefaultFallback';

interface AppErrorBoundaryProps extends PropsWithChildren {
  fallback?: ReactNode;
  onError?: (error: unknown, info: ErrorInfo) => void;
}

const AppErrorBoundary = ({
  fallback = null,
  onError,
  children,
}: AppErrorBoundaryProps) => {
  function handleError(error: unknown, info: ErrorInfo) {
    onError?.(error, info);
  }

  if (fallback) {
    return (
      <ErrorBoundary fallback={fallback} onError={handleError}>
        {children}
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={DefaultFallback} onError={handleError}>
      {children}
    </ErrorBoundary>
  );
};

export default AppErrorBoundary;
