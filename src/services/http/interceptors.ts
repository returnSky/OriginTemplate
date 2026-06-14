import {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios';

import {appConfig} from '@/config';
import {sessionStorage} from '@/services/auth/sessionStorage';
import {logger} from '@/utils/logger';

import {ApiError, ApiResponse} from './types';

export const requestInterceptor = (instance: AxiosInstance) => {
  instance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const token = await sessionStorage.getAccessToken();

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error: AxiosError) => {
      logger.error('[http] request error', error);
      return Promise.reject(error);
    },
  );
};

export const responseInterceptor = (instance: AxiosInstance) => {
  instance.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
      const {data} = response;

      if (data.code === appConfig.api.successCode) {
        return response;
      }

      const error: ApiError = {
        code: data.code,
        message: data.message,
        details: data.data,
      };
      return Promise.reject(error);
    },
    (error: AxiosError) => {
      const apiError: ApiError = {
        code: error.response?.status || 500,
        message: error.message || '网络请求失败',
        details: error.response?.data,
      };
      logger.error('[http] response error', apiError);
      return Promise.reject(apiError);
    },
  );
};
