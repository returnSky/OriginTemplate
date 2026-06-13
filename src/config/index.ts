import {Platform} from 'react-native';

export type AppEnv = 'development' | 'staging' | 'production';

const localApiURL =
  Platform.select({
    android: 'http://10.0.2.2:3000',
    ios: 'http://localhost:3000',
    default: 'http://localhost:3000',
  }) ?? 'http://localhost:3000';

export const appConfig = {
  appName: 'OriginTemplate',
  env: (__DEV__ ? 'development' : 'production') as AppEnv,
  supportEmail: 'support@example.com',
  api: {
    baseURL: localApiURL,
    timeout: 10 * 1000,
    successCode: 200,
  },
  query: {
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  },
  storage: {
    mmkv: {
      id: 'origin-template.storage',
      compareBeforeSet: true,
    },
    keys: {
      authStore: 'store.auth',
      preferencesStore: 'store.preferences',
    },
  },
  auth: {
    keychainService: 'com.origintemplate.auth',
    keychainAccount: 'origin-template-session',
  },
};

export const platformApiBaseURL = Platform.select({
  android: 'http://10.0.2.2:3000',
  ios: 'http://localhost:3000',
  default: 'http://localhost:3000',
});

export const apiBaseURL = appConfig.api.baseURL;
export const requestTimeout = appConfig.api.timeout;
