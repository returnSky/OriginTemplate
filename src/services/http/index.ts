import axios, {AxiosInstance, AxiosResponse} from 'axios';

import {appConfig} from '@/config';
import {getAuthSessionRevision} from '@/services/auth/sessionEvents';

import {requestInterceptor, responseInterceptor} from './interceptors';
import {ApiResponse, RequestConfig} from './types';

const instance: AxiosInstance = axios.create({
  baseURL: appConfig.api.baseURL,
  timeout: appConfig.api.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

requestInterceptor(instance);
responseInterceptor(instance);

const unwrapResponse = <T>(response: AxiosResponse<ApiResponse<T>>) =>
  response.data.data;

const request = async <T = unknown, TData = unknown>(
  config: RequestConfig<TData>,
): Promise<T> => {
  const requestConfig = {
    ...config,
    __authSessionRevision: config.skipAuth
      ? undefined
      : getAuthSessionRevision(),
  };
  const response = await instance.request<ApiResponse<T>>(requestConfig);
  return unwrapResponse(response);
};

export const http = {
  request,

  get: <T = unknown>(url: string, config?: RequestConfig) =>
    request<T>({...config, url, method: 'GET'}),

  post: <T = unknown, TData = unknown>(
    url: string,
    data?: TData,
    config?: RequestConfig<TData>,
  ) => request<T, TData>({...config, url, method: 'POST', data}),

  put: <T = unknown, TData = unknown>(
    url: string,
    data?: TData,
    config?: RequestConfig<TData>,
  ) => request<T, TData>({...config, url, method: 'PUT', data}),

  delete: <T = unknown>(url: string, config?: RequestConfig) =>
    request<T>({...config, url, method: 'DELETE'}),

  patch: <T = unknown, TData = unknown>(
    url: string,
    data?: TData,
    config?: RequestConfig<TData>,
  ) => request<T, TData>({...config, url, method: 'PATCH', data}),
};

export default http;
export type {
  ApiError,
  ApiResponse,
  HttpErrorKind,
  RequestConfig,
} from './types';
export {
  HttpError,
  isHttpError,
  isCanceledError,
  normalizeHttpError,
} from './errors';
