import {AxiosRequestConfig} from 'axios';

/**
 * 请求配置接口
 * 继承自 AxiosRequestConfig，但排除了 url 和 method 属性
 * @property {boolean} [showLoading] - 是否显示加载提示
 * @property {boolean} [showError] - 是否显示错误提示
 */
export interface RequestConfig
  extends Omit<AxiosRequestConfig, 'url' | 'method'> {
  showLoading?: boolean;
  showError?: boolean;
}

/**
 * 响应数据接口
 * @template T - 响应数据的类型
 * @property {number} code - 响应状态码
 * @property {T} data - 响应数据
 * @property {string} message - 响应消息
 */
export interface ResponseData<T = any> {
  code: number;
  data: T;
  message: string;
}

/**
 * API 错误接口
 * @property {number} code - 错误状态码
 * @property {string} message - 错误信息
 */
export interface ApiError {
  code: number;
  message: string;
}

/**
 * API 响应类型
 * @template T - 响应数据的类型
 * @description 继承自 ResponseData 接口，用于统一处理 API 响应
 */
export type ApiResponse<T = any> = ResponseData<T>;
