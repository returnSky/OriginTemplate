import {appConfig} from '@/config';
import {isCanceledError, isHttpError} from '@/services/http/errors';

/** Retry transient transport failures only; business failures need user action. */
export const shouldRetryQuery = (failureCount: number, error: unknown) => {
  if (failureCount >= appConfig.query.retry || isCanceledError(error)) {
    return false;
  }

  if (!isHttpError(error)) {
    return false;
  }

  if (error.kind === 'network' || error.kind === 'timeout') {
    return true;
  }

  if (error.kind !== 'http') {
    return false;
  }

  const status = error.status ?? error.code;

  return status === 408 || status === 429 || (status >= 500 && status < 600);
};
