import {resolveEnvironment} from '@/config/environment';

const localURL = 'http://10.0.2.2:3000';

describe('native build environment', () => {
  test('uses the platform API when DEV provides an empty URL', () => {
    expect(
      resolveEnvironment(
        {env: 'dev', apiBaseURL: '', authMode: 'demo'},
        true,
        localURL,
      ),
    ).toEqual({env: 'dev', apiBaseURL: localURL, authMode: 'demo'});
  });

  test.each([true, false])(
    'supports UAT with __DEV__=%s and real adapter auth',
    development => {
      expect(
        resolveEnvironment(
          {env: 'uat', apiBaseURL: 'https://uat.example.com/api/'},
          development,
          localURL,
        ),
      ).toEqual({
        env: 'uat',
        apiBaseURL: 'https://uat.example.com/api',
        authMode: 'adapter',
      });
    },
  );

  test.each([true, false])(
    'fails when native APP_ENV is missing (__DEV__=%s)',
    development => {
      expect(() => resolveEnvironment({}, development, localURL)).toThrow(
        'Rebuild the native app',
      );
    },
  );

  test.each(['uat', 'prod'])('requires an explicit HTTPS API for %s', env => {
    expect(() => resolveEnvironment({env}, false, localURL)).toThrow(
      'API_BASE_URL is required',
    );
    expect(() =>
      resolveEnvironment({env, apiBaseURL: localURL}, false, localURL),
    ).toThrow('must use HTTPS');
  });

  test.each([
    {env: 'unknown'},
    {env: 'prod', apiBaseURL: 'https://example.com', authMode: 'demo'},
    {env: 'uat', apiBaseURL: 'https://example.com', authMode: 'demo'},
    {env: 'dev', apiBaseURL: 'https://user:password@example.com'},
    {env: 'dev', apiBaseURL: 'https://example.com?token=secret'},
    {env: 'dev', apiBaseURL: 'https://example.com#'},
    {env: 'dev', apiBaseURL: 'ftp://example.com'},
    {env: 'dev', apiBaseURL: '/api'},
    {env: 'dev', apiBaseURL: 'https:example.com'},
    {env: 'dev', authMode: 'unknown'},
  ])('rejects invalid native configuration: %j', values => {
    expect(() => resolveEnvironment(values, true, localURL)).toThrow();
  });

  test('rejects DEV even when AUTH_MODE is adapter in a Release bundle', () => {
    expect(() =>
      resolveEnvironment({env: 'dev', authMode: 'adapter'}, false, localURL),
    ).toThrow('Release bundles cannot use');
  });
});

describe('native config integration', () => {
  afterEach(() => {
    jest.dontMock('react-native-config');
  });

  test.each(['dev', 'uat', 'prod'])(
    'reads %s native values and scopes persisted data',
    env => {
      jest.doMock('react-native-config', () => ({
        __esModule: true,
        default: {
          APP_ENV: env,
          API_BASE_URL: 'https://' + env + '.example.com/api/',
          AUTH_MODE: 'adapter',
        },
      }));
      jest.isolateModules(() => {
        const {appConfig} = require('@/config');
        expect(appConfig.env).toBe(env);
        expect(appConfig.api.baseURL).toBe(
          'https://' + env + '.example.com/api',
        );
        expect(appConfig.auth.mode).toBe('adapter');
        expect(appConfig.storage.mmkv.id).toBe(
          'origin-template.storage.' + env,
        );
        expect(appConfig.auth.keychainService).toBe(
          'com.origintemplate.auth.' + env,
        );
        expect(appConfig.auth.keychainAccount).toBe(
          'origin-template-session-' + env,
        );
      });
    },
  );

  test('does not silently start DEV when the native config is empty', () => {
    jest.doMock('react-native-config', () => ({__esModule: true, default: {}}));
    expect(() =>
      jest.isolateModules(() => {
        require('@/config');
      }),
    ).toThrow('APP_ENV must be');
  });
});

test('validates Config values using the React Native URL parser', () => {
  // Exercise the parser used on device rather than only Node's URL.
  // eslint-disable-next-line @react-native/no-deep-imports
  const {URL: NativeURL} = require('react-native/Libraries/Blob/URL');
  const descriptor = Object.getOwnPropertyDescriptor(global, 'URL')!;

  try {
    Object.defineProperty(global, 'URL', {
      configurable: true,
      writable: true,
      value: NativeURL,
    });
    expect(
      resolveEnvironment(
        {env: 'prod', apiBaseURL: 'HTTPS://Example.COM/api/'},
        false,
        localURL,
      ),
    ).toEqual({
      env: 'prod',
      apiBaseURL: 'https://example.com/api',
      authMode: 'adapter',
    });
    expect(() =>
      resolveEnvironment(
        {env: 'prod', apiBaseURL: 'https:example.com'},
        false,
        localURL,
      ),
    ).toThrow('absolute HTTP(S) URL');
  } finally {
    Object.defineProperty(global, 'URL', descriptor);
  }
});
