import type {AxiosRequestConfig} from 'axios';

export interface RequestConfig<
  TData = unknown,
> extends AxiosRequestConfig<TData> {
  /** Do not attach the app session or invalidate it on a public endpoint's 401. */
  skipAuth?: boolean;
}

export interface ApiResponse<T = unknown> {
  code: number;
  data: T;
  message: string;
}

export type HttpErrorKind =
  | 'http'
  | 'business'
  | 'network'
  | 'timeout'
  | 'canceled'
  | 'invalid-response'
  | 'unknown';

export interface ApiError extends Error {
  kind: HttpErrorKind;
  code: number;
  status?: number;
  details?: unknown;
}
