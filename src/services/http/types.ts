import {AxiosRequestConfig} from 'axios';

export interface RequestConfig<TData = unknown> extends Omit<
  AxiosRequestConfig<TData>,
  'url' | 'method'
> {
  showLoading?: boolean;
  showError?: boolean;
}

export interface ApiResponse<T = unknown> {
  code: number;
  data: T;
  message: string;
}

export interface ApiError {
  code: number;
  message: string;
  details?: unknown;
}
