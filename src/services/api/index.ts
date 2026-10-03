import http, {type RequestConfig} from '@/services/http';

export interface UserInfo {
  id: string;
  username: string;
  email: string;
}

export interface UpdateUserInfoPayload {
  username?: string;
  email?: string;
}

export const userApi = {
  getUserInfo: (userId: string, config?: RequestConfig) => {
    return http.get<UserInfo>(`/user/${encodeURIComponent(userId)}`, config);
  },

  updateUserInfo: (
    userId: string,
    data: UpdateUserInfoPayload,
    config?: RequestConfig<UpdateUserInfoPayload>,
  ) => {
    return http.put<UserInfo, UpdateUserInfoPayload>(
      `/user/${encodeURIComponent(userId)}`,
      data,
      config,
    );
  },
};
