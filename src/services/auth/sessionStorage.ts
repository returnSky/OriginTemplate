import {appConfig} from '@/config';
import {secureStorage} from '@/services/secureStorage';

import {
  getAuthSessionRevision,
  notifySessionInvalidated,
} from './sessionEvents';
import type {AuthSession} from './types';

export type {AuthSession} from './types';

interface SessionReadResult {
  session: AuthSession | null;
  invalidation?: {accessToken: string; revision: number};
  cleanupError?: unknown;
}

let pendingOperation: Promise<unknown> = Promise.resolve();
let storageRevision = 0;
let suppressed = false;
let lastKnownSessionToken: string | null = null;

const serialize = <T>(operation: () => Promise<T>): Promise<T> => {
  const result = pendingOperation.then(operation);
  pendingOperation = result.catch(() => undefined);
  return result;
};

export const isValidAuthSession = (value: unknown): value is AuthSession => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const session = value as Partial<AuthSession>;
  return (
    typeof session.accessToken === 'string' &&
    session.accessToken.trim().length > 0 &&
    (session.refreshToken === undefined ||
      (typeof session.refreshToken === 'string' &&
        session.refreshToken.trim().length > 0)) &&
    (session.expiresAt === undefined ||
      (typeof session.expiresAt === 'number' &&
        Number.isFinite(session.expiresAt) &&
        session.expiresAt > Date.now()))
  );
};

const readSession = async (): Promise<SessionReadResult> => {
  if (suppressed) {
    return {session: null};
  }

  const revision = storageRevision;
  const authRevision = getAuthSessionRevision();
  const knownToken = lastKnownSessionToken;
  const credentials = await secureStorage.getCredentials(
    appConfig.auth.keychainService,
  );

  if (suppressed || revision !== storageRevision) {
    return {session: null};
  }

  if (!credentials) {
    if (!knownToken) {
      return {session: null};
    }
    suppressed = true;
    storageRevision += 1;
    lastKnownSessionToken = null;
    return {
      session: null,
      invalidation: {accessToken: knownToken, revision: authRevision},
    };
  }

  let session: unknown;

  try {
    session = JSON.parse(credentials.password);
  } catch {
    session = null;
  }

  if (isValidAuthSession(session)) {
    lastKnownSessionToken = session.accessToken;
    return {session};
  }

  const persistedToken =
    session &&
    typeof session === 'object' &&
    typeof (session as Partial<AuthSession>).accessToken === 'string'
      ? (session as AuthSession).accessToken.trim()
      : null;
  const invalidToken = knownToken ?? persistedToken;
  const result: SessionReadResult = {
    session: null,
    invalidation: invalidToken
      ? {accessToken: invalidToken, revision: authRevision}
      : undefined,
  };

  suppressed = true;
  storageRevision += 1;
  lastKnownSessionToken = null;
  try {
    await secureStorage.removeCredentials(appConfig.auth.keychainService);
  } catch (error) {
    result.cleanupError = error;
  }
  return result;
};

const readAndNotifySession = async (): Promise<AuthSession | null> => {
  const result = await serialize(readSession);
  // Listeners may enqueue Keychain cleanup, so notify only after releasing the lock.
  if (result.invalidation) {
    await notifySessionInvalidated(
      result.invalidation.accessToken,
      result.invalidation.revision,
    );
  }
  if ('cleanupError' in result) {
    throw result.cleanupError;
  }
  return result.session;
};

export const sessionStorage = {
  getSession: readAndNotifySession,

  async getAccessToken() {
    const session = await readAndNotifySession();
    return session?.accessToken ?? null;
  },

  setSession(session: AuthSession, onCommit?: () => boolean) {
    if (!isValidAuthSession(session)) {
      return Promise.reject(
        new Error('Invalid or expired authentication session.'),
      );
    }

    const revision = ++storageRevision;
    return serialize(async () => {
      await secureStorage.setCredentials(
        appConfig.auth.keychainService,
        appConfig.auth.keychainAccount,
        JSON.stringify(session),
      );

      if (revision === storageRevision) {
        const activate = onCommit?.() ?? true;
        if (activate && revision === storageRevision) {
          lastKnownSessionToken = session.accessToken;
          suppressed = false;
        } else if (!activate && revision === storageRevision) {
          suppressed = true;
          lastKnownSessionToken = null;
          await secureStorage.removeCredentials(appConfig.auth.keychainService);
        }
      }
    });
  },

  clearSession() {
    // Block new requests immediately, even if removing native credentials fails.
    suppressed = true;
    lastKnownSessionToken = null;
    storageRevision += 1;
    return serialize(() =>
      secureStorage.removeCredentials(appConfig.auth.keychainService),
    );
  },
};
