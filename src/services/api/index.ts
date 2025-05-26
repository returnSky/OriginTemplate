import http from '@/services/http';
import {ApiResponse} from '@/services/http/types';

// 用户相关接口
export interface UserInfo {
  id: number;
  username: string;
  email: string;
}

export const userApi = {
  // 获取用户信息
  getUserInfo: (userId: number) => {
    return http.get<ApiResponse<UserInfo>>(`/user/${userId}`);
  },

  // 更新用户信息
  updateUserInfo: (userId: number, data: Partial<UserInfo>) => {
    return http.put<ApiResponse<UserInfo>>(`/user/${userId}`, data);
  },
};

// 示例：如何使用
/*
  import { userApi } from '@/services/api';

  // 在组件中使用
  const fetchUserInfo = async () => {
    try {
      const response = await userApi.getUserInfo(1);
      const userData = response.data.data;
      console.log('用户信息：', userData);
    } catch (error) {
      console.error('获取用户信息失败：', error);
    }
  };
  */
