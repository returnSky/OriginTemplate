import {appConfig} from '@/config';
import {configureAuthAdapter} from '@/services/auth';
import {
  getAuthSessionRevision,
  notifySessionInvalidated,
} from '@/services/auth/sessionEvents';
import {sessionStorage} from '@/services/auth/sessionStorage';
import type {AuthAdapter, AuthSession, AuthUser} from '@/services/auth/types';
import {queryClient} from '@/services/query/queryClient';
import {secureStorage} from '@/services/secureStorage';
import {syncStringStorage} from '@/services/storage';
import {useAuthStore} from '@/stores/authStore';

jest.mock('@/services/secureStorage', () => ({
  secureStorage: {
    getCredentials: jest.fn(async () => null),
    setCredentials: jest.fn(),
    removeCredentials: jest.fn(),
  },
}));
jest.mock('@/utils', () => ({
  logger: {error: jest.fn(), warn: jest.fn()},
}));

const user: AuthUser = {
  id: 'user-1',
  name: 'First User',
  email: 'first@example.com',
};
const session: AuthSession = {accessToken: 'access-1'};
let credentials: {username: string; password: string; service: string} | null;
let adapter: AuthAdapter;

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(complete => {
    resolve = complete;
  });
  return {promise, resolve};
};

beforeEach(async () => {
  credentials = null;
  jest
    .mocked(secureStorage.getCredentials)
    .mockImplementation(async () => credentials);
  jest
    .mocked(secureStorage.setCredentials)
    .mockImplementation(async (service, username, password) => {
      credentials = {service, username, password};
    });
  jest.mocked(secureStorage.removeCredentials).mockImplementation(async () => {
    credentials = null;
  });
  adapter = {
    signIn: jest.fn(async () => ({user, session})),
    restoreSession: jest.fn(async () => user),
    signOut: jest.fn(async () => undefined),
  };
  configureAuthAdapter(adapter);
  await useAuthStore.getState().signOut();
  useAuthStore.setState({hydrated: false, initializing: true});
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
  queryClient.clear();
});

test('shares concurrent initialization and restores the user through the adapter', async () => {
  await sessionStorage.setSession(session);
  jest.clearAllMocks();
  const restoration = deferred<AuthUser | null>();
  jest.mocked(adapter.restoreSession).mockReturnValueOnce(restoration.promise);

  const first = useAuthStore.getState().initialize();
  const second = useAuthStore.getState().initialize();
  expect(first).toBe(second);
  restoration.resolve(user);
  await Promise.all([first, second]);

  expect(secureStorage.getCredentials).toHaveBeenCalledTimes(1);
  expect(adapter.restoreSession).toHaveBeenCalledTimes(1);
  expect(useAuthStore.getState()).toMatchObject({
    accessToken: session.accessToken,
    user,
    hydrated: true,
    initializing: false,
  });
});

test('logout wins over an in-flight hydration read', async () => {
  await sessionStorage.setSession(session);
  const read = deferred<typeof credentials>();
  jest.mocked(secureStorage.getCredentials).mockReturnValueOnce(read.promise);
  const initialization = useAuthStore.getState().initialize();
  await Promise.resolve();
  const logout = useAuthStore.getState().signOut();
  read.resolve({
    service: appConfig.auth.keychainService,
    username: 'session',
    password: JSON.stringify(session),
  });
  await Promise.all([initialization, logout]);

  expect(useAuthStore.getState()).toMatchObject({
    accessToken: null,
    user: null,
    hydrated: true,
  });
  expect(await sessionStorage.getAccessToken()).toBeNull();
});

test('logout wins while login is writing credentials and clears account cache', async () => {
  const writeStarted = deferred<void>();
  const releaseWrite = deferred<void>();
  jest
    .mocked(secureStorage.setCredentials)
    .mockImplementationOnce(async (service, username, password) => {
      writeStarted.resolve();
      await releaseWrite.promise;
      credentials = {service, username, password};
    });
  queryClient.setQueryData(['private-profile'], user);
  const loginResult = useAuthStore
    .getState()
    .signIn({email: user.email, password: 'secret'})
    .catch(error => error);
  await writeStarted.promise;
  const previousRevision = getAuthSessionRevision();
  const logout = useAuthStore.getState().signOut();

  expect(getAuthSessionRevision()).toBeGreaterThan(previousRevision);
  expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  expect(useAuthStore.getState().accessToken).toBeNull();
  releaseWrite.resolve();
  expect(await loginResult).toMatchObject({name: 'AuthOperationCanceledError'});
  await logout;
  expect(credentials).toBeNull();
  expect(await sessionStorage.getAccessToken()).toBeNull();
});

test('invalidating an old token preserves a newly signed-in session', async () => {
  await useAuthStore.getState().signIn({email: user.email, password: 'secret'});
  jest.mocked(adapter.signIn).mockResolvedValueOnce({
    user: {...user, id: 'user-2'},
    session: {accessToken: 'access-2'},
  });
  await useAuthStore
    .getState()
    .signIn({email: 'second@example.com', password: 'secret'});
  queryClient.setQueryData(['new-account'], 'current');

  await useAuthStore.getState().invalidateSession('access-1');

  expect(useAuthStore.getState().accessToken).toBe('access-2');
  expect(queryClient.getQueryData(['new-account'])).toBe('current');
});

test('a storage cleanup failure leaves local auth cleared and blocks old credentials', async () => {
  await useAuthStore.getState().signIn({email: user.email, password: 'secret'});
  queryClient.setQueryData(['private-data'], user);
  jest
    .mocked(secureStorage.removeCredentials)
    .mockRejectedValueOnce(new Error('Keychain failed'));

  await expect(useAuthStore.getState().signOut()).rejects.toThrow(
    'Keychain failed',
  );

  expect(useAuthStore.getState()).toMatchObject({
    accessToken: null,
    user: null,
  });
  expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  expect(await sessionStorage.getAccessToken()).toBeNull();
});

test('repeated logout shares a single credential removal', async () => {
  await useAuthStore.getState().signIn({email: user.email, password: 'secret'});
  jest.clearAllMocks();
  await Promise.all([
    useAuthStore.getState().signOut(),
    useAuthStore.getState().signOut(),
  ]);
  expect(secureStorage.removeCredentials).toHaveBeenCalledTimes(1);
});

test.each([
  'not-json',
  'null',
  '{"accessToken":42}',
  '{"accessToken":" "}',
  '{"accessToken":"expired","expiresAt":1}',
])(
  'rejects and removes malformed or expired persisted session: %s',
  async value => {
    await sessionStorage.setSession(session);
    credentials = {
      username: 'session',
      service: appConfig.auth.keychainService,
      password: value,
    };
    expect(await sessionStorage.getSession()).toBeNull();
    expect(credentials).toBeNull();
  },
);

test('persists only the user profile in MMKV and keeps tokens in secure storage', async () => {
  await useAuthStore.getState().signIn({email: user.email, password: 'secret'});
  const persisted = syncStringStorage.getItem(appConfig.storage.keys.authStore);
  expect(persisted).not.toBeNull();
  expect(JSON.parse(persisted!).state).toEqual({user});
  expect(persisted).not.toContain(session.accessToken);
  expect(persisted).not.toContain('secret');
});

test('initialization handles storage errors without a rejected provider effect', async () => {
  await sessionStorage.setSession(session);
  jest
    .mocked(secureStorage.getCredentials)
    .mockRejectedValueOnce(new Error('Keychain failed'));
  await expect(useAuthStore.getState().initialize()).resolves.toBeUndefined();
  expect(useAuthStore.getState()).toMatchObject({
    accessToken: null,
    hydrated: true,
    initializing: false,
  });
});

test('initialization cleanup failures do not reject the provider effect or expose tokens', async () => {
  await sessionStorage.setSession(session);
  jest
    .mocked(adapter.restoreSession)
    .mockRejectedValueOnce(new Error('Restore failed'));
  jest
    .mocked(secureStorage.removeCredentials)
    .mockRejectedValueOnce(new Error('Cleanup failed'));
  await expect(useAuthStore.getState().initialize()).resolves.toBeUndefined();
  expect(useAuthStore.getState()).toMatchObject({
    accessToken: null,
    user: null,
    hydrated: true,
  });
  expect(await sessionStorage.getAccessToken()).toBeNull();
});

test('a 401 invalidation during adapter restoration finishes without waiting on its own initialization', async () => {
  await sessionStorage.setSession(session);
  jest.mocked(adapter.restoreSession).mockImplementationOnce(async () => {
    await notifySessionInvalidated(session.accessToken);
    throw new Error('Unauthorized');
  });
  await expect(useAuthStore.getState().initialize()).resolves.toBeUndefined();
  expect(useAuthStore.getState().accessToken).toBeNull();
  expect(credentials).toBeNull();
});

test('logout aborts active queries and removes their cached state', async () => {
  await useAuthStore.getState().signIn({email: user.email, password: 'secret'});
  const started = deferred<void>();
  const aborted = jest.fn();
  const request = queryClient
    .fetchQuery({
      queryKey: ['active-private-request'],
      gcTime: Infinity,
      queryFn: ({signal}) =>
        new Promise<string>((_resolve, reject) => {
          signal.addEventListener('abort', () => {
            aborted();
            reject(new Error('Canceled'));
          });
          started.resolve();
        }),
    })
    .catch(error => error);
  await started.promise;
  await useAuthStore.getState().signOut();
  await request;
  expect(aborted).toHaveBeenCalledTimes(1);
  expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
});

test('rehydration only accepts a validated profile and cannot replace tokens or store actions', async () => {
  const signIn = useAuthStore.getState().signIn;
  syncStringStorage.setItem(
    appConfig.storage.keys.authStore,
    JSON.stringify({
      state: {
        user: {...user, accessToken: 'nested-token'},
        accessToken: 'injected-token',
        hydrated: true,
        signIn: 'replaced-action',
      },
      version: 0,
    }),
  );
  await useAuthStore.persist.rehydrate();
  expect(useAuthStore.getState().user).toEqual(user);
  expect(useAuthStore.getState().accessToken).toBeNull();
  expect(useAuthStore.getState().hydrated).toBe(false);
  expect(useAuthStore.getState().signIn).toBe(signIn);

  syncStringStorage.setItem(
    appConfig.storage.keys.authStore,
    JSON.stringify({
      state: {user: {id: 123, name: 'Corrupt', email: user.email}},
      version: 0,
    }),
  );
  await useAuthStore.persist.rehydrate();
  expect(useAuthStore.getState().user).toBeNull();
});

test('a stale 401 cannot clear a new session even if the backend reused the same token', async () => {
  await useAuthStore.getState().signIn({email: user.email, password: 'secret'});
  const previousRevision = getAuthSessionRevision();
  await useAuthStore.getState().signIn({email: user.email, password: 'secret'});
  await notifySessionInvalidated(session.accessToken, previousRevision);
  expect(useAuthStore.getState().accessToken).toBe(session.accessToken);
});

test('a current-session 401 still remains the original HTTP error when storage removal fails', async () => {
  await useAuthStore.getState().signIn({email: user.email, password: 'secret'});
  const revision = getAuthSessionRevision();
  jest
    .mocked(secureStorage.removeCredentials)
    .mockRejectedValueOnce(new Error('Keychain failed'));
  await expect(
    notifySessionInvalidated(session.accessToken, revision),
  ).resolves.toBeUndefined();
  expect(useAuthStore.getState().accessToken).toBeNull();
  expect(await sessionStorage.getAccessToken()).toBeNull();
});

test('runtime expiry clears the signed-in UI state and account cache without deadlocking', async () => {
  const now = Date.now();
  jest.mocked(adapter.signIn).mockResolvedValueOnce({
    user,
    session: {...session, expiresAt: now + 1000},
  });
  await useAuthStore.getState().signIn({email: user.email, password: 'secret'});
  queryClient.setQueryData(['private-runtime-data'], user);
  jest.spyOn(Date, 'now').mockReturnValue(now + 2000);

  expect(await sessionStorage.getAccessToken()).toBeNull();
  expect(useAuthStore.getState()).toMatchObject({
    user: null,
    accessToken: null,
    hydrated: true,
  });
  expect(Boolean(useAuthStore.getState().accessToken)).toBe(false);
  expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  expect(credentials).toBeNull();
});

test.each([null, 'invalid-json'])(
  'runtime missing or malformed credentials invalidate the known signed-in identity: %p',
  async value => {
    await useAuthStore
      .getState()
      .signIn({email: user.email, password: 'secret'});
    queryClient.setQueryData(['private-runtime-data'], user);
    credentials =
      value === null
        ? null
        : {
            service: appConfig.auth.keychainService,
            username: 'session',
            password: value,
          };
    expect(await sessionStorage.getAccessToken()).toBeNull();
    expect(useAuthStore.getState()).toMatchObject({
      accessToken: null,
      user: null,
    });
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  },
);

test('runtime expiry still clears identity when native credential removal fails', async () => {
  const now = Date.now();
  jest.mocked(adapter.signIn).mockResolvedValueOnce({
    user,
    session: {...session, expiresAt: now + 1000},
  });
  await useAuthStore.getState().signIn({email: user.email, password: 'secret'});
  queryClient.setQueryData(['private-runtime-data'], user);
  jest.spyOn(Date, 'now').mockReturnValue(now + 2000);
  jest
    .mocked(secureStorage.removeCredentials)
    .mockRejectedValueOnce(new Error('Expired credential deletion failed'))
    .mockRejectedValueOnce(new Error('Retried deletion failed'));

  await expect(sessionStorage.getAccessToken()).rejects.toThrow(
    'Expired credential deletion failed',
  );
  expect(useAuthStore.getState()).toMatchObject({
    accessToken: null,
    user: null,
  });
  expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  expect(await sessionStorage.getAccessToken()).toBeNull();
});

test('runtime expiry notification cannot clear a new login started during native cleanup', async () => {
  const now = Date.now();
  jest.mocked(adapter.signIn).mockResolvedValueOnce({
    user,
    session: {...session, expiresAt: now + 1000},
  });
  await useAuthStore.getState().signIn({email: user.email, password: 'secret'});
  jest.spyOn(Date, 'now').mockReturnValue(now + 2000);
  jest.mocked(adapter.signIn).mockResolvedValueOnce({
    user: {...user, id: 'user-2'},
    session: {accessToken: 'new-runtime-session'},
  });
  let newLogin: Promise<void> | undefined;
  jest
    .mocked(secureStorage.removeCredentials)
    .mockImplementationOnce(async () => {
      credentials = null;
      newLogin = useAuthStore
        .getState()
        .signIn({email: 'new@example.com', password: 'secret'});
    });

  expect(await sessionStorage.getAccessToken()).toBeNull();
  await newLogin;
  expect(useAuthStore.getState().accessToken).toBe('new-runtime-session');
  expect(await sessionStorage.getAccessToken()).toBe('new-runtime-session');
});

test('discarded native writes remain blocked and are removed when identity commit is rejected', async () => {
  await sessionStorage.setSession(
    {accessToken: 'uncommitted-token'},
    () => false,
  );
  expect(credentials).toBeNull();
  expect(await sessionStorage.getAccessToken()).toBeNull();
});

test('anonymous default HTTP requests work with no native credentials and do not invalidate auth', async () => {
  let storage!: typeof import('@/services/auth/sessionStorage');
  let events!: typeof import('@/services/auth/sessionEvents');
  let httpModule!: typeof import('@/services/http');
  jest.isolateModules(() => {
    storage = require('@/services/auth/sessionStorage');
    events = require('@/services/auth/sessionEvents');
    httpModule = require('@/services/http');
  });
  const notify = jest.spyOn(events, 'notifySessionInvalidated');
  expect(await storage.sessionStorage.getAccessToken()).toBeNull();
  expect(
    await httpModule.http.get('/anonymous', {
      adapter: async config => ({
        config,
        status: 200,
        statusText: 'OK',
        headers: {},
        data: {code: 200, data: 'anonymous-data', message: ''},
      }),
    }),
  ).toBe('anonymous-data');
  expect(notify).not.toHaveBeenCalled();
  expect(events.getAuthSessionRevision()).toBe(0);
});

test('direct session reads invalidate an active expired identity before token reads become suppressed', async () => {
  const now = Date.now();
  jest.mocked(adapter.signIn).mockResolvedValueOnce({
    user,
    session: {...session, expiresAt: now + 1000},
  });
  await useAuthStore.getState().signIn({email: user.email, password: 'secret'});
  queryClient.setQueryData(['private-direct-session-read'], user);
  jest.spyOn(Date, 'now').mockReturnValue(now + 2000);

  expect(await sessionStorage.getSession()).toBeNull();
  expect(useAuthStore.getState()).toMatchObject({
    user: null,
    accessToken: null,
    hydrated: true,
  });
  expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  expect(credentials).toBeNull();
  expect(await sessionStorage.getAccessToken()).toBeNull();
});
