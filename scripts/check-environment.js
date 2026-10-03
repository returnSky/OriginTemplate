const fs = require('node:fs');
const path = require('node:path');
const {parseEnv} = require('node:util');

const repositoryRoot = path.resolve(__dirname, '..');

function parseEnvironmentFile(source) {
  // Both native parsers support a smaller syntax than Node's dotenv parser.
  // Restrict to their common format so validation sees the values they generate.
  if (source.includes('\r') || source.startsWith('\uFEFF')) {
    throw new Error(
      'Environment files must use LF line endings and UTF-8 without BOM.',
    );
  }
  const values = parseEnv(source);
  const seen = new Set();
  source.split('\n').forEach((line, index) => {
    if (!line.trim() || /^\s*#/.test(line)) {
      return;
    }
    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(
      line,
    );
    if (!match) {
      throw new Error(
        'Invalid environment entry on line ' + (index + 1) + '. Use KEY=value.',
      );
    }
    const [, key, rawValue] = match;
    if (seen.has(key)) {
      throw new Error('Duplicate environment key: ' + key + '.');
    }
    seen.add(key);
    const quoted = rawValue.startsWith('"') || rawValue.startsWith("'");
    const value = quoted ? rawValue.slice(1, -1) : rawValue;
    if (
      (quoted && (rawValue.length < 3 || rawValue.at(-1) !== rawValue[0])) ||
      (!quoted && value.includes('#')) ||
      /["'\\]/.test(value) ||
      rawValue !== rawValue.trim() ||
      values[key] !== value
    ) {
      throw new Error(
        'Invalid value for ' +
          key +
          '. Use a single-line value without escapes or inline comments.',
      );
    }
  });
  return values;
}

function validateEnvironment(values, {expectedEnv, release = false} = {}) {
  const env = values.APP_ENV;
  if (!['dev', 'uat', 'prod'].includes(env)) {
    throw new Error('APP_ENV must be dev, uat, or prod.');
  }
  if (expectedEnv && env !== expectedEnv) {
    throw new Error(
      'Expected APP_ENV=' + expectedEnv + ', received ' + env + '.',
    );
  }
  if (release && env === 'dev') {
    throw new Error('Release builds cannot use the dev environment.');
  }

  const configuredURL = values.API_BASE_URL?.trim();
  if (!configuredURL && env !== 'dev') {
    throw new Error('API_BASE_URL is required for UAT and PROD.');
  }
  const apiBaseURL = configuredURL || 'http://localhost:3000';
  if (!/^https?:\/\/[^/?#\s]+(?:[/?#]|$)/i.test(apiBaseURL)) {
    throw new Error('API_BASE_URL must be an absolute HTTP(S) URL.');
  }
  let url;
  try {
    url = new URL(apiBaseURL);
  } catch {
    throw new Error('API_BASE_URL must be an absolute HTTP(S) URL.');
  }
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    !url.hostname ||
    url.username ||
    url.password ||
    apiBaseURL.includes('?') ||
    apiBaseURL.includes('#')
  ) {
    throw new Error(
      'API_BASE_URL must be an HTTP(S) URL without credentials, query, or hash.',
    );
  }
  if (env !== 'dev' && url.protocol !== 'https:') {
    throw new Error('UAT and PROD APIs must use HTTPS.');
  }

  const authMode = values.AUTH_MODE ?? (env === 'dev' ? 'demo' : 'adapter');
  if (!['demo', 'adapter'].includes(authMode)) {
    throw new Error('AUTH_MODE must be demo or adapter.');
  }
  if (authMode === 'demo' && (env !== 'dev' || release)) {
    throw new Error(
      'Demo authentication is only available in DEV debug builds.',
    );
  }
  return {env, apiBaseURL: url.toString().replace(/\/+$/, ''), authMode};
}

function loadEnvironment({
  envFile = process.env.ENVFILE || '.env.dev',
  expectedEnv,
  release = false,
  rootDir = repositoryRoot,
} = {}) {
  const filename = path.resolve(rootDir, envFile);
  if (!fs.existsSync(filename) || !fs.statSync(filename).isFile()) {
    throw new Error('Environment file does not exist: ' + filename);
  }
  const values = parseEnvironmentFile(fs.readFileSync(filename, 'utf8'));
  return {
    filename,
    values,
    environment: validateEnvironment(values, {expectedEnv, release}),
  };
}

function parseArguments(args) {
  const options = {};
  const names = {
    '--env-file': 'envFile',
    '--expected-env': 'expectedEnv',
    '--release': 'release',
  };
  for (let index = 0; index < args.length; index += 2) {
    const name = Object.hasOwn(names, args[index])
      ? names[args[index]]
      : undefined;
    const value = args[index + 1];
    if (!name || !value || value.startsWith('--') || name in options) {
      throw new Error('Invalid environment argument: ' + args[index] + '.');
    }
    options[name] = value;
  }
  if (
    options.expectedEnv &&
    !['dev', 'uat', 'prod'].includes(options.expectedEnv)
  ) {
    throw new Error('--expected-env must be dev, uat, or prod.');
  }
  if ('release' in options && !['true', 'false'].includes(options.release)) {
    throw new Error('--release must be true or false.');
  }
  options.release = options.release === 'true';
  return options;
}

if (require.main === module) {
  try {
    const {filename, environment} = loadEnvironment(
      parseArguments(process.argv.slice(2)),
    );
    console.log(
      'Environment validated: ' +
        environment.env +
        ' (' +
        path.relative(repositoryRoot, filename) +
        ')',
    );
  } catch (error) {
    console.error('[environment] ' + error.message);
    process.exitCode = 1;
  }
}

module.exports = {
  loadEnvironment,
  parseArguments,
  parseEnvironmentFile,
  validateEnvironment,
};
