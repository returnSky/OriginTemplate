import axios, {AxiosError} from 'axios';
import type {AxiosAdapter, InternalAxiosRequestConfig} from 'axios';

import {
  getAuthSessionRevision,
  notifySessionInvalidated,
} from '@/services/auth/sessionEvents';
import {sessionStorage} from '@/services/auth/sessionStorage';
import {
  http,
  HttpError,
  isCanceledError,
  isHttpError,
  normalizeHttpError,
} from '@/services/http';
import type {RequestConfig} from '@/services/http';

jest.mock('@/services/auth/sessionStorage', () => ({
  sessionStorage: {getAccessToken: jest.fn(async () => 'session-token')},
}));
jest.mock('@/services/auth/sessionEvents', () => ({
  notifySessionInvalidated: jest.fn(async () => undefined),
  getAuthSessionRevision: jest.fn(() => 0),
}));
jest.mock('@/utils/logger', () => ({
  logger: {error: jest.fn()},
}));

const respond =
  (data: unknown, status = 200): AxiosAdapter =>
  async config => ({
    config,
    data,
    status,
    statusText: 'OK',
    headers: {},
  });

const unauthorized: AxiosAdapter = async config => {
  throw new AxiosError(
    'Unauthorized',
    'ERR_BAD_REQUEST',
    config,
    {},
    {
      config,
      data: {message: 'expired'},
      status: 401,
      statusText: 'Unauthorized',
      headers: {},
    },
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(getAuthSessionRevision).mockReturnValue(0);
  jest.mocked(sessionStorage.getAccessToken).mockResolvedValue('session-token');
});

test('request accepts URL and method, attaches session auth, and unwraps data', async () => {
  let received!: InternalAxiosRequestConfig;
  const adapter: AxiosAdapter = async config => {
    received = config;
    return respond({code: 200, data: {id: '1'}, message: 'ok'})(config);
  };
  const config: RequestConfig = {url: '/users/1', method: 'GET', adapter};
  expect(await http.request(config)).toEqual({id: '1'});
  expect(received.url).toBe('/users/1');
  expect(received.headers.get('Authorization')).toBe('Bearer session-token');
});

test('skipAuth public requests never read or invalidate the app session', async () => {
  await expect(
    http.post('/login', {}, {skipAuth: true, adapter: unauthorized}),
  ).rejects.toMatchObject({kind: 'http', status: 401});
  expect(sessionStorage.getAccessToken).not.toHaveBeenCalled();
  expect(notifySessionInvalidated).not.toHaveBeenCalled();
});

test('keeps caller-supplied authorization and does not invalidate an unrelated session', async () => {
  await expect(
    http.get('/external', {
      headers: {Authorization: 'Basic custom'},
      adapter: unauthorized,
    }),
  ).rejects.toMatchObject({kind: 'http', status: 401});
  expect(sessionStorage.getAccessToken).not.toHaveBeenCalled();
  expect(notifySessionInvalidated).not.toHaveBeenCalled();
});

test('401 invalidates the exact attached session and preserves HTTP error details', async () => {
  const result = await http
    .get('/private', {adapter: unauthorized})
    .catch(error => error);
  expect(notifySessionInvalidated).toHaveBeenCalledWith('session-token', 0);
  expect(result).toBeInstanceOf(HttpError);
  expect(result).toMatchObject({
    kind: 'http',
    code: 401,
    status: 401,
    details: {message: 'expired'},
  });
  if (!isHttpError(result)) {
    throw new Error('Expected HttpError');
  }
  expect(result.cause).toBeInstanceOf(AxiosError);
});

test('accepted HTTP 401 statuses still invalidate the app session', async () => {
  await expect(
    http.get('/private', {
      validateStatus: () => true,
      adapter: respond({}, 401),
    }),
  ).rejects.toMatchObject({kind: 'http', status: 401});
  expect(notifySessionInvalidated).toHaveBeenCalledWith('session-token', 0);
});

test('business failures stay distinct from retryable server failures', async () => {
  const result = await http
    .get('/private', {
      adapter: respond({
        code: 500,
        data: {reason: 'validation'},
        message: 'Invalid input',
      }),
    })
    .catch(error => error);
  expect(isHttpError(result)).toBe(true);
  expect(result).toMatchObject({
    kind: 'business',
    code: 500,
    status: 200,
    message: 'Invalid input',
  });
});

test.each([null, 'not-an-envelope', {}, {code: 200, message: 'missing data'}])(
  'rejects invalid API envelopes: %p',
  async data => {
    await expect(
      http.get('/private', {adapter: respond(data)}),
    ).rejects.toMatchObject({kind: 'invalid-response', status: 200});
  },
);

test('AbortController cancellation retains axios compatibility and never invalidates auth', async () => {
  const controller = new AbortController();
  controller.abort();
  const adapter = jest.fn(respond({code: 200, data: null, message: ''}));
  const result = await http
    .get('/private', {signal: controller.signal, adapter})
    .catch(error => error);
  expect(result).toMatchObject({kind: 'canceled', code: 0});
  expect(isCanceledError(result)).toBe(true);
  expect(axios.isCancel(result)).toBe(true);
  expect(adapter).not.toHaveBeenCalled();
  expect(notifySessionInvalidated).not.toHaveBeenCalled();
});

test.each([
  ['ECONNABORTED', 'timeout'],
  ['ETIMEDOUT', 'timeout'],
  ['ERR_NETWORK', 'network'],
])('classifies %s as %s', (code, kind) => {
  expect(
    normalizeHttpError(new AxiosError('Request failed', code)),
  ).toMatchObject({kind, code: 0});
});

test('local setup errors have a non-network classification', () => {
  expect(normalizeHttpError(new Error('Keychain unavailable'))).toMatchObject({
    kind: 'unknown',
  });
});

test('uses a request-time token when a 401 arrives after token storage changes', async () => {
  let release!: () => void;
  let requestStarted!: () => void;
  const started = new Promise<void>(resolve => {
    requestStarted = resolve;
  });
  const gate = new Promise<void>(resolve => {
    release = resolve;
  });
  const result = http
    .get('/private', {
      adapter: async config => {
        requestStarted();
        await gate;
        return unauthorized(config);
      },
    })
    .catch(error => error);
  await started;
  jest
    .mocked(sessionStorage.getAccessToken)
    .mockResolvedValue('new-session-token');
  release();
  await result;
  expect(notifySessionInvalidated).toHaveBeenCalledWith('session-token', 0);
});

test('normalizing a typed HTTP error preserves its identity', () => {
  const error = new HttpError('Failure', {kind: 'http', status: 503});
  expect(normalizeHttpError(error)).toBe(error);
});

test('cancels a queued protected write if auth changes before Axios starts dispatching', async () => {
  const adapter = jest.fn(respond({code: 200, data: null, message: ''}));
  const result = http
    .post('/private', {name: 'Old account payload'}, {adapter})
    .catch(error => error);
  jest.mocked(getAuthSessionRevision).mockReturnValue(1);
  expect(await result).toMatchObject({kind: 'canceled'});
  expect(adapter).not.toHaveBeenCalled();
  expect(sessionStorage.getAccessToken).not.toHaveBeenCalled();
});

test('cancels an old write when token retrieval crosses into another session', async () => {
  let resolveToken!: (token: string) => void;
  let readStarted!: () => void;
  const started = new Promise<void>(resolve => {
    readStarted = resolve;
  });
  const token = new Promise<string>(resolve => {
    resolveToken = resolve;
  });
  jest.mocked(sessionStorage.getAccessToken).mockImplementationOnce(() => {
    readStarted();
    return token;
  });
  const adapter = jest.fn(respond({code: 200, data: null, message: ''}));
  const result = http
    .post('/private', {name: 'Old account payload'}, {adapter})
    .catch(error => error);
  await started;
  jest.mocked(getAuthSessionRevision).mockReturnValue(1);
  resolveToken('new-account-token');
  expect(await result).toMatchObject({kind: 'canceled'});
  expect(adapter).not.toHaveBeenCalled();
});

test('does not expose a successful response from a session that has since changed', async () => {
  const result = http
    .get('/private', {
      adapter: async config => {
        jest.mocked(getAuthSessionRevision).mockReturnValue(1);
        return respond({code: 200, data: {private: 'old-user'}, message: ''})(
          config,
        );
      },
    })
    .catch(error => error);
  expect(await result).toMatchObject({kind: 'canceled'});
});

test('public endpoint responses remain available across local auth changes', async () => {
  expect(
    await http.get('/public', {
      skipAuth: true,
      adapter: async config => {
        jest.mocked(getAuthSessionRevision).mockReturnValue(1);
        return respond({code: 200, data: 'public-data', message: ''})(config);
      },
    }),
  ).toBe('public-data');
});
