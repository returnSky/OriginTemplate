import axios, {AxiosInstance} from 'axios';
import {requestInterceptor, responseInterceptor} from './interceptors';
import {RequestConfig} from './types';

// 创建 axios 实例
const instance: AxiosInstance = axios.create({
  baseURL: 'http://localhost:3000', // 替换为实际的 API 地址
  timeout: 10 * 1000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 添加拦截器
requestInterceptor(instance);
responseInterceptor(instance);

// 封装请求方法
export const http = {
  get: <T = any>(url: string, config?: RequestConfig) => {
    return instance.get<T>(url, config);
  },

  post: <T = any>(url: string, data?: any, config?: RequestConfig) => {
    return instance.post<T>(url, data, config);
  },

  put: <T = any>(url: string, data?: any, config?: RequestConfig) => {
    return instance.put<T>(url, data, config);
  },

  delete: <T = any>(url: string, config?: RequestConfig) => {
    return instance.delete<T>(url, config);
  },

  patch: <T = any>(url: string, data?: any, config?: RequestConfig) => {
    return instance.patch<T>(url, data, config);
  },
};

export default http;
