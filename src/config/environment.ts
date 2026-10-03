export type AppEnv = 'dev' | 'uat' | 'prod';
export type AuthMode = 'demo' | 'adapter';

interface EnvironmentValues {
  env?: string | null;
  apiBaseURL?: string | null;
  authMode?: string | null;
}

export interface BuildEnvironment {
  env: AppEnv;
  apiBaseURL: string;
  authMode: AuthMode;
}

export const resolveEnvironment = (
  values: EnvironmentValues,
  development: boolean,
  localApiURL: string,
): BuildEnvironment => {
  const env = values.env;
  if (env !== 'dev' && env !== 'uat' && env !== 'prod') {
    throw new Error(
      'APP_ENV must be dev, uat, or prod. Rebuild the native app with the correct ENVFILE.',
    );
  }
  if (!development && env === 'dev') {
    throw new Error('Release bundles cannot use the dev environment.');
  }

  const configuredURL = values.apiBaseURL?.trim();
  if (!configuredURL && env !== 'dev') {
    throw new Error('API_BASE_URL is required for UAT and PROD.');
  }
  const apiBaseURL = (configuredURL || localApiURL).replace(
    /^https?:\/\/[^/?#]+/i,
    authority => authority.toLowerCase(),
  );
  if (!/^https?:\/\/[^/?#\s]+(?:[/?#]|$)/.test(apiBaseURL)) {
    throw new Error('API_BASE_URL must be an absolute HTTP(S) URL.');
  }

  let url: URL;
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

  const authMode = values.authMode ?? (env === 'dev' ? 'demo' : 'adapter');
  if (authMode !== 'demo' && authMode !== 'adapter') {
    throw new Error('AUTH_MODE must be demo or adapter.');
  }
  if (authMode === 'demo' && (env !== 'dev' || !development)) {
    throw new Error(
      'Demo authentication is only available in DEV debug builds.',
    );
  }

  return {
    env,
    apiBaseURL: url.toString().replace(/\/+$/, ''),
    authMode,
  };
};
