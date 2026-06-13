import http from '@/services/http';

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
  getUserInfo: (userId: string) => {
    return http.get<UserInfo>(`/user/${userId}`);
  },

  updateUserInfo: (userId: string, data: UpdateUserInfoPayload) => {
    return http.put<UserInfo, UpdateUserInfoPayload>(`/user/${userId}`, data);
  },
};
