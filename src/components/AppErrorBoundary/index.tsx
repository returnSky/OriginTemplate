import type {ErrorInfo} from 'react';
import type {ErrorBoundaryProps} from 'react-error-boundary';

import React from 'react';
import {ErrorBoundary} from 'react-error-boundary';

import DefaultFallback from './DefaultFallback';

const AppErrorBoundary = ({
  fallback = null,
  onError,
  ...props
}: Partial<ErrorBoundaryProps>) => {
  function handleError(error: Error, info: ErrorInfo) {
    onError && onError(error, info);
  }

  return (
    <ErrorBoundary
      fallback={fallback ?? <DefaultFallback />}
      onError={handleError}>
      {props.children}
    </ErrorBoundary>
  );
};

export default AppErrorBoundary;
