import {Platform} from 'react-native';
import Config from 'react-native-config';

import {resolveEnvironment} from './environment';

export type {AppEnv, AuthMode} from './environment';
export const appLanguages = ['en-US', 'zh-CN'] as const;
export type AppLanguage = (typeof appLanguages)[number];
export type AppLanguagePreference = AppLanguage | 'system';
export const appLanguagePreferences = [...appLanguages, 'system'] as const;

const localApiURL =
  Platform.select({
    android: 'http://10.0.2.2:3000',
    ios: 'http://localhost:3000',
    default: 'http://localhost:3000',
  }) ?? 'http://localhost:3000';

export const buildEnvironment = resolveEnvironment(
  {
    env: Config.APP_ENV,
    apiBaseURL: Config.API_BASE_URL,
    authMode: Config.AUTH_MODE,
  },
  __DEV__,
  localApiURL,
);

export const appConfig = {
  appName: 'OriginTemplate',
  env: buildEnvironment.env,
  supportEmail: 'support@example.com',
  api: {
    baseURL: buildEnvironment.apiBaseURL,
    timeout: 10 * 1000,
    successCode: 200,
  },
  query: {
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  },
  i18n: {
    defaultLanguage: 'en-US' as AppLanguage,
    supportedLanguages: appLanguages,
    languagePreferences: appLanguagePreferences,
  },
  storage: {
    mmkv: {
      id: 'origin-template.storage.' + buildEnvironment.env,
      compareBeforeSet: true,
    },
    keys: {
      authStore: 'store.auth',
      preferencesStore: 'store.preferences',
    },
  },
  auth: {
    mode: buildEnvironment.authMode,
    keychainService: 'com.origintemplate.auth.' + buildEnvironment.env,
    keychainAccount: 'origin-template-session-' + buildEnvironment.env,
  },
};

export const platformApiBaseURL = Platform.select({
  android: 'http://10.0.2.2:3000',
  ios: 'http://localhost:3000',
  default: 'http://localhost:3000',
});

export const apiBaseURL = appConfig.api.baseURL;
export const requestTimeout = appConfig.api.timeout;
