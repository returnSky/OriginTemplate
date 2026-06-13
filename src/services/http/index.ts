import axios, {AxiosInstance, AxiosResponse} from 'axios';

import {appConfig} from '@/config';

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

const unwrapResponse = <T>(response: AxiosResponse<ApiResponse<T>>) => {
  return response.data.data;
};

export const http = {
  request: async <T = unknown, TData = unknown>(
    config: RequestConfig<TData>,
  ) => {
    const response = await instance.request<ApiResponse<T>>(config);
    return unwrapResponse(response);
  },

  get: async <T = unknown>(url: string, config?: RequestConfig) => {
    const response = await instance.get<ApiResponse<T>>(url, config);
    return unwrapResponse(response);
  },

  post: async <T = unknown, TData = unknown>(
    url: string,
    data?: TData,
    config?: RequestConfig<TData>,
  ) => {
    const response = await instance.post<ApiResponse<T>>(url, data, config);
    return unwrapResponse(response);
  },

  put: async <T = unknown, TData = unknown>(
    url: string,
    data?: TData,
    config?: RequestConfig<TData>,
  ) => {
    const response = await instance.put<ApiResponse<T>>(url, data, config);
    return unwrapResponse(response);
  },

  delete: async <T = unknown>(url: string, config?: RequestConfig) => {
    const response = await instance.delete<ApiResponse<T>>(url, config);
    return unwrapResponse(response);
  },

  patch: async <T = unknown, TData = unknown>(
    url: string,
    data?: TData,
    config?: RequestConfig<TData>,
  ) => {
    const response = await instance.patch<ApiResponse<T>>(url, data, config);
    return unwrapResponse(response);
  },
};

export default http;
export type {ApiError, ApiResponse, RequestConfig} from './types';
