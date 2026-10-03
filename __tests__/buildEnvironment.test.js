const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  loadEnvironment,
  parseArguments,
  parseEnvironmentFile,
  validateEnvironment,
} = require('../scripts/check-environment');
const {runNative} = require('../scripts/run-native');

test.each([
  ['dev', false],
  ['uat', true],
  ['prod', true],
])(
  'validates the checked-in %s file for its intended build',
  (env, release) => {
    // Template adopters may replace the sample endpoints without editing tests.
    expect(
      loadEnvironment({envFile: '.env.' + env, expectedEnv: env, release})
        .environment,
    ).toMatchObject({env});
  },
);
test('does not fall back to .env when an explicitly requested file is missing', () => {
  expect(() => loadEnvironment({envFile: '.env.missing'})).toThrow(
    'Environment file does not exist',
  );
});

test('reads a supplied environment file before starting the CLI', () => {
  const filename = path.join(
    os.tmpdir(),
    'origin-template-env-' + process.pid + '-' + Date.now(),
  );
  try {
    fs.writeFileSync(
      filename,
      'APP_ENV=uat\nAPI_BASE_URL=https://custom.example.com\nAUTH_MODE=adapter\n',
    );
    expect(
      loadEnvironment({envFile: filename, expectedEnv: 'uat', release: true})
        .environment,
    ).toMatchObject({env: 'uat', apiBaseURL: 'https://custom.example.com'});
  } finally {
    fs.unlinkSync(filename);
  }
});

test('rejects a command whose selected file belongs to another environment', () => {
  expect(() =>
    loadEnvironment({envFile: '.env.uat', expectedEnv: 'prod', release: true}),
  ).toThrow('Expected APP_ENV=prod');
});

test('rejects DEV in release builds before running Gradle or Xcode', () => {
  expect(() => loadEnvironment({envFile: '.env.dev', release: true})).toThrow(
    'Release builds cannot use',
  );
});

test.each([
  [''],
  ['APP_ENV=uat\n'],
  ['APP_ENV=uat\nAPI_BASE_URL=http://example.com\n'],
  ['APP_ENV=uat\nAPI_BASE_URL=https://example.com\nAUTH_MODE=demo\n'],
])('rejects unsafe or incomplete native values: %s', source => {
  expect(() => validateEnvironment(parseEnvironmentFile(source))).toThrow();
});

test.each([
  'https:example.com',
  'https:/example.com',
  'https://',
  'https://example.com?',
  'https://example.com#',
  'https://user:password@example.com',
])('rejects an invalid base URL before a native build: %s', apiBaseURL => {
  expect(() =>
    validateEnvironment({APP_ENV: 'prod', API_BASE_URL: apiBaseURL}),
  ).toThrow();
});

test.each([
  'APP_ENV=dev\nAPP_ENV=uat\n',
  'APP_ENV=dev # comment\n',
  ' APP_ENV=dev\n',
  'APP_ENV="dev\n',
  'APP_ENV="dev" \n',
  'APP_ENV="de\\nv"\n',
  'APP_ENV=dev\r\n',
  '\uFEFFAPP_ENV=dev\n',
  'not-an-assignment\n',
])('rejects syntax that native parsers interpret differently: %s', source => {
  expect(() => parseEnvironmentFile(source)).toThrow();
});

test('supports simple quotes, exports, comments and extra public native keys', () => {
  expect(
    parseEnvironmentFile(
      '# comment\nexport APP_ENV="dev"\nAPI_BASE_URL=\nAUTH_MODE=\'demo\'\nSDK_APP_ID=public-id\n',
    ),
  ).toEqual({
    APP_ENV: 'dev',
    API_BASE_URL: '',
    AUTH_MODE: 'demo',
    SDK_APP_ID: 'public-id',
  });
});

test.each([
  ['--release', 'yes'],
  ['--expected-env', 'staging'],
  ['--env-file'],
  ['--unexpected', 'value'],
  ['--release', 'false', '--release', 'true'],
])('rejects invalid CLI arguments: %j', (...args) => {
  expect(() => parseArguments(args)).toThrow();
});

test('passes CLI arguments and the absolute ENVFILE without invoking a shell', () => {
  const execute = jest.fn(() => ({status: 7}));
  expect(
    runNative(
      [
        '--env-file',
        '.env.uat',
        '--expected-env',
        'uat',
        '--release',
        'true',
        '--',
        'run-android',
        '--mode',
        'release',
        '--device',
        'Device With Spaces',
      ],
      execute,
    ),
  ).toBe(7);
  expect(execute).toHaveBeenCalledWith(
    process.execPath,
    [
      path.join(
        path.dirname(require.resolve('react-native/package.json')),
        'cli.js',
      ),
      'run-android',
      '--mode',
      'release',
      '--device',
      'Device With Spaces',
    ],
    expect.objectContaining({
      stdio: 'inherit',
      env: expect.objectContaining({
        ENVFILE: path.resolve(__dirname, '../.env.uat'),
      }),
    }),
  );
});

test('does not invoke the CLI when validation fails', () => {
  const execute = jest.fn();
  expect(() =>
    runNative(
      ['--env-file', '.env.dev', '--release', 'true', '--', 'build-android'],
      execute,
    ),
  ).toThrow('Release builds cannot use');
  expect(execute).not.toHaveBeenCalled();
});

test.each([
  {error: new Error('spawn failed')},
  {signal: 'SIGTERM', status: null},
])('reports process failures: %j', result => {
  expect(() =>
    runNative(['--env-file', '.env.dev', '--', 'run-android'], () => result),
  ).toThrow();
});

test.each(['API_BASE_URL=""\n', "API_BASE_URL=''\n"])(
  'requires unquoted empty native values: %s',
  source => {
    expect(() => parseEnvironmentFile(source)).toThrow('Invalid value');
  },
);

test.each([
  ['run-ios', '--scheme', 'OriginTemplate-PROD', '--mode', 'Release'],
  [
    'run-ios',
    '--scheme',
    'OriginTemplate-PROD',
    '--mode',
    'Release',
    '--mode=Debug',
  ],
  [
    'run-ios',
    '--scheme',
    'OriginTemplate-PROD',
    '--mode',
    'Release',
    '--scheme',
    'OriginTemplate-DEV',
  ],
])(
  'does not start Xcode with a mismatched or overridden selection: %j',
  (...cliArgs) => {
    const execute = jest.fn();
    expect(() =>
      runNative(
        [
          '--env-file',
          '.env.uat',
          '--expected-env',
          'uat',
          '--release',
          'true',
          '--',
          ...cliArgs,
        ],
        execute,
      ),
    ).toThrow();
    expect(execute).not.toHaveBeenCalled();
  },
);

test.each([
  ['dev', 'Debug', false],
  ['uat', 'Debug-UAT', false],
  ['uat', 'Release-UAT', true],
  ['prod', 'Release', true],
])('starts iOS with the %s native configuration %s', (env, mode, release) => {
  const execute = jest.fn(() => ({status: 0}));
  expect(
    runNative(
      [
        '--env-file',
        '.env.' + env,
        '--expected-env',
        env,
        '--release',
        String(release),
        '--',
        'run-ios',
        '--mode',
        mode,
      ],
      execute,
    ),
  ).toBe(0);
  expect(execute).toHaveBeenCalled();
});

test('rejects custom iOS files that differ from the native configuration mapping', () => {
  const filename = path.join(
    os.tmpdir(),
    'origin-template-ios-env-' + process.pid + '-' + Date.now(),
  );
  const execute = jest.fn();
  try {
    fs.writeFileSync(
      filename,
      'APP_ENV=uat\nAPI_BASE_URL=https://custom.example.com\nAUTH_MODE=adapter\n',
    );
    expect(() =>
      runNative(
        [
          '--env-file',
          filename,
          '--expected-env',
          'uat',
          '--release',
          'true',
          '--',
          'run-ios',
          '--mode',
          'Release-UAT',
        ],
        execute,
      ),
    ).toThrow('Update the Xcode/Podfile mapping');
    expect(execute).not.toHaveBeenCalled();
  } finally {
    fs.unlinkSync(filename);
  }
});

test.each([
  ['--interactive'],
  ['-i'],
  ['--binary-path', 'other-environment.app'],
  ['--xcconfig', 'other-environment.xcconfig'],
  ['--extra-params', '-configuration Debug'],
  ['--extra-params', 'ENVFILE=.env.dev'],
])(
  'rejects arguments that bypass the iOS environment selection: %j',
  (...extraArgs) => {
    const execute = jest.fn();
    expect(() =>
      runNative(
        [
          '--env-file',
          '.env.prod',
          '--expected-env',
          'prod',
          '--release',
          'true',
          '--',
          'run-ios',
          '--scheme',
          'OriginTemplate-PROD',
          '--mode',
          'Release',
          ...extraArgs,
        ],
        execute,
      ),
    ).toThrow();
    expect(execute).not.toHaveBeenCalled();
  },
);
