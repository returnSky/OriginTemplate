import axios from 'axios';

import type {ApiError, HttpErrorKind} from './types';

interface HttpErrorOptions {
  kind: HttpErrorKind;
  code?: number;
  status?: number;
  details?: unknown;
  cause?: unknown;
}

export class HttpError extends Error implements ApiError {
  readonly kind: HttpErrorKind;
  readonly code: number;
  readonly status?: number;
  readonly details?: unknown;
  readonly __CANCEL__: boolean;

  constructor(message: string, options: HttpErrorOptions) {
    super(message, {cause: options.cause});
    this.name = 'HttpError';
    this.kind = options.kind;
    this.code = options.code ?? options.status ?? 0;
    this.status = options.status;
    this.details = options.details;
    this.__CANCEL__ = options.kind === 'canceled';
  }
}

export const isHttpError = (error: unknown): error is HttpError =>
  error instanceof HttpError;

export const isCanceledError = (error: unknown) =>
  axios.isCancel(error) ||
  (isHttpError(error) && error.kind === 'canceled') ||
  (error instanceof Error && error.name === 'AbortError');

export const normalizeHttpError = (error: unknown): HttpError => {
  if (isHttpError(error)) {
    return error;
  }

  if (isCanceledError(error)) {
    return new HttpError('Request canceled.', {
      kind: 'canceled',
      cause: error,
    });
  }

  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const kind: HttpErrorKind =
      error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
        ? 'timeout'
        : status !== undefined
          ? 'http'
          : error.code === 'ERR_NETWORK' || error.request
            ? 'network'
            : 'unknown';

    return new HttpError(error.message || 'Request failed.', {
      kind,
      status,
      details: error.response?.data,
      cause: error,
    });
  }

  return new HttpError(
    error instanceof Error ? error.message : 'Request failed.',
    {kind: 'unknown', cause: error},
  );
};
