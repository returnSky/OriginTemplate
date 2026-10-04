import {QueryClient, QueryObserver} from '@tanstack/react-query';

import {appConfig} from '@/config';
import {userApi, type UserInfo} from '@/services/api';
import {advanceAuthSessionRevision} from '@/services/auth/sessionEvents';
import {HttpError} from '@/services/http/errors';
import {queryKeys} from '@/services/query/queryKeys';
import {shouldRetryQuery} from '@/services/query/retry';
import {
  updateUserMutationOptions,
  userQueryOptions,
} from '@/services/query/userQueries';

jest.mock('@/services/api', () => ({
  userApi: {
    getUserInfo: jest.fn(),
    updateUserInfo: jest.fn(),
  },
}));

const getUserInfo = jest.mocked(userApi.getUserInfo);
const updateUserInfo = jest.mocked(userApi.updateUserInfo);
const savedUser: UserInfo = {
  id: '1',
  username: 'Updated',
  email: 'updated@example.com',
};

const clients: QueryClient[] = [];
const createClient = () => {
  const client = new QueryClient({
    defaultOptions: {
      queries: {retry: false, gcTime: Infinity},
      mutations: {retry: false, gcTime: Infinity},
    },
  });
  clients.push(client);
  return client;
};

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(resolvePromise => {
    resolve = resolvePromise;
  });

  return {promise, resolve};
};

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  clients.forEach(client => client.clear());
  clients.length = 0;
});

test.each([
  ['network', undefined, true],
  ['timeout', undefined, true],
  ['http', 408, true],
  ['http', 429, true],
  ['http', 503, true],
  ['http', 401, false],
  ['http', 404, false],
  ['business', 500, false],
  ['invalid-response', 200, false],
  ['canceled', undefined, false],
] as const)('retry policy for %s (%s)', (kind, status, expected) => {
  expect(shouldRetryQuery(0, new HttpError('Failure', {kind, status}))).toBe(
    expected,
  );
});

test('bounds retries and does not retry programming errors', () => {
  const error = new HttpError('Offline', {kind: 'network'});
  expect(shouldRetryQuery(appConfig.query.retry, error)).toBe(false);
  expect(shouldRetryQuery(0, new TypeError('Invalid app data'))).toBe(false);
});

test('a missing user ID does not issue a request', () => {
  const client = createClient();
  const observer = new QueryObserver(client, userQueryOptions(undefined));
  const unsubscribe = observer.subscribe(() => {});

  expect(getUserInfo).not.toHaveBeenCalled();
  expect(observer.getCurrentResult().fetchStatus).toBe('idle');
  unsubscribe();
});

test('canceling a detail query aborts the HTTP signal', async () => {
  const client = createClient();
  let signal: AbortSignal | undefined;
  getUserInfo.mockImplementation((_userId, config) => {
    signal = config?.signal as AbortSignal;
    return new Promise<UserInfo>(() => {});
  });

  const result = client.fetchQuery(userQueryOptions('1')).catch(error => error);
  expect(getUserInfo).toHaveBeenCalledWith('1', {
    signal: expect.any(AbortSignal),
  });
  await client.cancelQueries({queryKey: queryKeys.user.detail('1')});

  expect(signal?.aborted).toBe(true);
  expect(await result).toMatchObject({message: 'CancelledError'});
});

test('an update fills the detail cache and marks it for server refresh', async () => {
  const client = createClient();
  const mutation = client
    .getMutationCache()
    .build(client, updateUserMutationOptions(client, '1'));
  updateUserInfo.mockResolvedValue(savedUser);

  await mutation.execute({username: 'Updated'});

  expect(updateUserInfo).toHaveBeenCalledWith('1', {username: 'Updated'});
  expect(client.getQueryData(userQueryOptions('1').queryKey)).toEqual(
    savedUser,
  );
  expect(client.getQueryState(queryKeys.user.detail('1'))?.isInvalidated).toBe(
    true,
  );
});

test('overlapping update responses settle on authoritative server data', async () => {
  const client = createClient();
  const olderUpdate = deferred<UserInfo>();
  const newerUpdate = deferred<UserInfo>();
  updateUserInfo
    .mockReturnValueOnce(olderUpdate.promise)
    .mockReturnValueOnce(newerUpdate.promise);
  getUserInfo.mockResolvedValue(savedUser);
  client.setQueryData(userQueryOptions('1').queryKey, savedUser);
  const observer = new QueryObserver(client, {
    ...userQueryOptions('1'),
    staleTime: Infinity,
  });
  const unsubscribe = observer.subscribe(() => {});
  const olderMutation = client
    .getMutationCache()
    .build(client, updateUserMutationOptions(client, '1'));
  const newerMutation = client
    .getMutationCache()
    .build(client, updateUserMutationOptions(client, '1'));

  const olderResult = olderMutation.execute({username: 'Older'});
  const newerResult = newerMutation.execute({username: 'Updated'});
  await new Promise<void>(resolve => setImmediate(resolve));
  newerUpdate.resolve(savedUser);
  await newerResult;
  olderUpdate.resolve({...savedUser, username: 'Older'});
  await olderResult;

  expect(client.getQueryData(userQueryOptions('1').queryKey)).toEqual(
    savedUser,
  );
  expect(getUserInfo).toHaveBeenCalled();
  unsubscribe();
});

test('an old session response cannot repopulate cleared cache', async () => {
  const client = createClient();
  const response = deferred<UserInfo>();
  updateUserInfo.mockReturnValue(response.promise);
  const mutation = client
    .getMutationCache()
    .build(client, updateUserMutationOptions(client, '1'));
  const result = mutation.execute({username: 'Updated'});
  await new Promise<void>(resolve => setImmediate(resolve));
  expect(updateUserInfo).toHaveBeenCalledTimes(1);

  advanceAuthSessionRevision();
  client.clear();
  response.resolve(savedUser);
  await result;

  expect(client.getQueryData(queryKeys.user.detail('1'))).toBeUndefined();
});

test('mutation options from an old session never start a request', async () => {
  const client = createClient();
  const options = updateUserMutationOptions(client, '1');
  advanceAuthSessionRevision();
  const mutation = client.getMutationCache().build(client, options);

  await expect(mutation.execute({username: 'Updated'})).rejects.toMatchObject({
    kind: 'canceled',
  });
  expect(updateUserInfo).not.toHaveBeenCalled();
});
