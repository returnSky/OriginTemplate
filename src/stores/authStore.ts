import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';

import {appConfig} from '@/config';
import {AuthSession, sessionStorage} from '@/services/auth/sessionStorage';
import {syncStringStorage} from '@/services/storage';
import {logger} from '@/utils';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface SignInPayload {
  email: string;
  password: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  initializing: boolean;
  hydrated: boolean;
  initialize: () => Promise<void>;
  signIn: (payload: SignInPayload) => Promise<void>;
  signOut: () => Promise<void>;
}

const createTemplateSession = (): AuthSession => ({
  accessToken: `template-token-${Date.now()}`,
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      initializing: true,
      hydrated: false,

      initialize: async () => {
        if (get().hydrated) {
          return;
        }

        set({initializing: true});

        try {
          const session = await sessionStorage.getSession();

          set(state => ({
            accessToken: session?.accessToken ?? null,
            user: session?.accessToken ? state.user : null,
            initializing: false,
            hydrated: true,
          }));
        } catch (error) {
          logger.error('[auth] failed to hydrate session', error);
          set({
            accessToken: null,
            user: null,
            initializing: false,
            hydrated: true,
          });
        }
      },

      signIn: async payload => {
        const session = createTemplateSession();

        await sessionStorage.setSession(session);
        set({
          accessToken: session.accessToken,
          user: {
            id: 'template-user',
            name: 'Template User',
            email: payload.email,
          },
        });
      },

      signOut: async () => {
        await sessionStorage.clearSession();
        set({
          accessToken: null,
          user: null,
          initializing: false,
        });
      },
    }),
    {
      name: appConfig.storage.keys.authStore,
      storage: createJSONStorage(() => syncStringStorage),
      partialize: state => ({user: state.user}),
    },
  ),
);
