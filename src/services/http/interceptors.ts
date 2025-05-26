import {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import {ApiError, ApiResponse} from './types';

// 请求拦截器
export const requestInterceptor = (instance: AxiosInstance) => {
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // 在这里可以添加token等认证信息
      const token = ''; // 从存储中获取token
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: AxiosError) => {
      return Promise.reject(error);
    },
  );
};

// 响应拦截器
export const responseInterceptor = (instance: AxiosInstance) => {
  instance.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
      const {data} = response;

      // 这里可以根据后端的响应结构进行统一处理
      if (data.code === 200) {
        return response;
      }

      // 处理业务错误
      const error: ApiError = {
        code: data.code,
        message: data.message,
      };
      return Promise.reject(error);
    },
    (error: AxiosError) => {
      // 处理 HTTP 错误
      const apiError: ApiError = {
        code: error.response?.status || 500,
        message: error.message || '网络请求失败',
      };
      return Promise.reject(apiError);
    },
  );
};
