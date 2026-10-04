import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';

import {appConfig} from '@/config';
import {getAuthAdapter} from '@/services/auth/adapter';
import {
  advanceAuthSessionRevision,
  getAuthSessionRevision,
  subscribeToSessionInvalidation,
} from '@/services/auth/sessionEvents';
import {
  isValidAuthSession,
  sessionStorage,
} from '@/services/auth/sessionStorage';
import type {AuthSession, AuthUser, SignInPayload} from '@/services/auth/types';
import {queryClient} from '@/services/query/queryClient';
import {syncStringStorage} from '@/services/storage';
import {logger} from '@/utils';

export type {AuthUser, SignInPayload} from '@/services/auth/types';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  initializing: boolean;
  signingIn: boolean;
  hydrated: boolean;
  initialize: () => Promise<void>;
  signIn: (payload: SignInPayload) => Promise<void>;
  signOut: () => Promise<void>;
  invalidateSession: (
    expectedToken?: string,
    expectedRevision?: number,
  ) => Promise<void>;
}

let operationVersion = 0;
let initializePromise: Promise<void> | null = null;
let clearPromise: Promise<void> | null = null;
let clearVersion = -1;
let currentSession: AuthSession | null = null;

const readAuthUser = (value: unknown): AuthUser | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const user = value as Partial<AuthUser>;
  if (
    typeof user.id !== 'string' ||
    !user.id.trim() ||
    typeof user.name !== 'string' ||
    !user.name.trim() ||
    typeof user.email !== 'string' ||
    !user.email.trim()
  ) {
    return null;
  }
  return {id: user.id, name: user.name, email: user.email};
};

const clearAuthCache = () => {
  const cancellation = queryClient.cancelQueries();
  queryClient.clear();
  return cancellation;
};

const supersededError = () => {
  const error = new Error('Authentication operation was superseded.');
  error.name = 'AuthOperationCanceledError';
  return error;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      const clearLocalSession = (): Promise<void> => {
        if (clearPromise && clearVersion === operationVersion) {
          return clearPromise;
        }

        clearVersion = ++operationVersion;
        advanceAuthSessionRevision();
        currentSession = null;
        set({
          accessToken: null,
          user: null,
          initializing: false,
          signingIn: false,
          hydrated: true,
        });

        const cancellation = clearAuthCache();
        const removal = sessionStorage.clearSession();
        const operation = Promise.all([cancellation, removal]).then(
          () => undefined,
        );
        const pendingClear = operation.finally(() => {
          if (clearPromise === pendingClear) {
            clearPromise = null;
          }
        });
        clearPromise = pendingClear;
        return pendingClear;
      };

      return {
        user: null,
        accessToken: null,
        initializing: true,
        signingIn: false,
        hydrated: false,

        initialize: () => {
          if (get().hydrated) {
            return Promise.resolve();
          }
          if (initializePromise) {
            return initializePromise;
          }

          const version = operationVersion;
          set({initializing: true});
          initializePromise = (async () => {
            try {
              const session = await sessionStorage.getSession();
              if (version !== operationVersion) {
                return;
              }

              currentSession = session;
              const user = session
                ? readAuthUser(
                    await getAuthAdapter().restoreSession(session, get().user),
                  )
                : null;
              if (version !== operationVersion) {
                return;
              }
              if (session && !user) {
                await clearLocalSession();
                return;
              }
              if (session) {
                advanceAuthSessionRevision();
              }

              set({
                accessToken: session?.accessToken ?? null,
                user,
                initializing: false,
                hydrated: true,
              });
            } catch (error) {
              if (version === operationVersion) {
                try {
                  await clearLocalSession();
                } catch {
                  logger.error(
                    '[auth] failed to remove credentials during initialization',
                  );
                }
                logger.error(
                  '[auth] failed to initialize session',
                  error instanceof Error
                    ? {name: error.name, message: error.message}
                    : undefined,
                );
              }
            }
          })().finally(() => {
            initializePromise = null;
          });

          return initializePromise;
        },

        signIn: async payload => {
          const version = ++operationVersion;
          advanceAuthSessionRevision();
          currentSession = null;
          set({
            accessToken: null,
            user: null,
            signingIn: true,
            initializing: false,
            hydrated: true,
          });
          const removal = sessionStorage.clearSession();
          const cancellation = clearAuthCache();

          try {
            await Promise.all([removal, cancellation]);
            if (version !== operationVersion) {
              throw supersededError();
            }

            const result = await getAuthAdapter().signIn(payload);
            const user = readAuthUser(result.user);
            if (!isValidAuthSession(result.session) || !user) {
              throw new Error(
                'Authentication adapter returned an invalid session.',
              );
            }
            if (version !== operationVersion) {
              throw supersededError();
            }

            await clearAuthCache();
            if (version !== operationVersion) {
              throw supersededError();
            }

            // Commit identity and revision before requests can read the new token.
            await sessionStorage.setSession(result.session, () => {
              if (version !== operationVersion) {
                return false;
              }
              queryClient.clear();
              advanceAuthSessionRevision();
              currentSession = result.session;
              set({
                accessToken: result.session.accessToken,
                user,
                signingIn: false,
                initializing: false,
                hydrated: true,
              });
              return true;
            });

            if (version !== operationVersion) {
              throw supersededError();
            }
          } catch (error) {
            if (version === operationVersion) {
              set({signingIn: false});
            }
            throw error;
          }
        },

        signOut: async () => {
          const session = currentSession;
          const cleanup = clearLocalSession();
          try {
            await cleanup;
          } finally {
            if (session) {
              try {
                await getAuthAdapter().signOut?.(session);
              } catch {
                logger.warn(
                  '[auth] remote sign-out failed after local cleanup',
                );
              }
            }
          }
        },

        invalidateSession: (expectedToken, expectedRevision) => {
          if (
            expectedRevision !== undefined &&
            expectedRevision !== getAuthSessionRevision()
          ) {
            return Promise.resolve();
          }
          if (
            expectedToken &&
            expectedToken !== currentSession?.accessToken &&
            expectedToken !== get().accessToken
          ) {
            return Promise.resolve();
          }
          return clearLocalSession();
        },
      };
    },
    {
      name: appConfig.storage.keys.authStore,
      storage: createJSONStorage(() => syncStringStorage),
      partialize: state => ({user: state.user}),
      merge: (persisted, current) => ({
        ...current,
        user: readAuthUser(
          persisted && typeof persisted === 'object'
            ? (persisted as {user?: unknown}).user
            : null,
        ),
      }),
    },
  ),
);

subscribeToSessionInvalidation((accessToken, revision) =>
  useAuthStore.getState().invalidateSession(accessToken, revision),
);
