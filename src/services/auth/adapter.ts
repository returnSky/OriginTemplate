import {appConfig} from '@/config';

import type {AuthAdapter} from './types';

let configuredAdapter: AuthAdapter | null = null;
let demoSessionSequence = 0;

const assertDemoEnabled = () => {
  if (!__DEV__ || appConfig.env !== 'dev') {
    throw new Error('Demo authentication is only available in development.');
  }
};

/** Local UI demonstration only. These tokens cannot authenticate API requests. */
export const demoAuthAdapter: AuthAdapter = {
  async signIn(payload) {
    assertDemoEnabled();

    if (!payload.email.trim() || !payload.password.trim()) {
      throw new Error('Email and password are required.');
    }

    demoSessionSequence += 1;

    return {
      user: {
        id: 'demo-user',
        name: 'Demo User',
        email: payload.email.trim(),
      },
      session: {
        accessToken: `demo-token-${Date.now()}-${demoSessionSequence}`,
      },
    };
  },

  async restoreSession(session, cachedUser) {
    assertDemoEnabled();
    return session.accessToken.startsWith('demo-token-') ? cachedUser : null;
  },
};

/** Configure your backend implementation before mounting App. */
export const configureAuthAdapter = (adapter: AuthAdapter) => {
  configuredAdapter = adapter;
};

export const getAuthAdapter = (): AuthAdapter => {
  if (configuredAdapter) {
    return configuredAdapter;
  }

  if (appConfig.auth.mode === 'demo') {
    assertDemoEnabled();
    return demoAuthAdapter;
  }

  throw new Error(
    'Authentication adapter is not configured. Call configureAuthAdapter before mounting App.',
  );
};
