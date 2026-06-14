import {appConfig} from '@/config';
import {secureStorage} from '@/services/secureStorage';

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

const emptySession: AuthSession | null = null;

const parseSession = (value: string) => {
  try {
    return JSON.parse(value) as AuthSession;
  } catch {
    return emptySession;
  }
};

export const sessionStorage = {
  async getSession() {
    const credentials = await secureStorage.getCredentials(
      appConfig.auth.keychainService,
    );

    if (!credentials) {
      return emptySession;
    }

    return parseSession(credentials.password);
  },

  async getAccessToken() {
    const session = await this.getSession();
    return session?.accessToken ?? null;
  },

  setSession(session: AuthSession) {
    return secureStorage.setCredentials(
      appConfig.auth.keychainService,
      appConfig.auth.keychainAccount,
      JSON.stringify(session),
    );
  },

  clearSession() {
    return secureStorage.removeCredentials(appConfig.auth.keychainService);
  },
};
