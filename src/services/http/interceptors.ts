import type {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import axios, {CanceledError} from 'axios';

import {appConfig} from '@/config';
import {
  getAuthSessionRevision,
  notifySessionInvalidated,
} from '@/services/auth/sessionEvents';
import {sessionStorage} from '@/services/auth/sessionStorage';
import {logger} from '@/utils/logger';

import {HttpError, normalizeHttpError} from './errors';
import type {ApiResponse} from './types';

interface InternalRequestConfig extends InternalAxiosRequestConfig {
  skipAuth?: boolean;
  __authSessionToken?: string;
  __authSessionRevision?: number;
}

const invalidateUnauthorizedSession = async (
  config: InternalRequestConfig | undefined,
) => {
  if (!config?.skipAuth && config?.__authSessionToken) {
    await notifySessionInvalidated(
      config.__authSessionToken,
      config.__authSessionRevision,
    );
  }
};

const isApiResponse = (data: unknown): data is ApiResponse =>
  Boolean(
    data &&
    typeof data === 'object' &&
    typeof (data as ApiResponse).code === 'number' &&
    Number.isFinite((data as ApiResponse).code) &&
    typeof (data as ApiResponse).message === 'string' &&
    Object.prototype.hasOwnProperty.call(data, 'data'),
  );

export const requestInterceptor = (instance: AxiosInstance) => {
  instance.interceptors.request.use(async config => {
    const requestConfig = config as InternalRequestConfig;
    requestConfig.__authSessionToken = undefined;

    if (requestConfig.skipAuth || config.headers.has('Authorization')) {
      requestConfig.__authSessionRevision = undefined;
      return config;
    }

    const ensureCurrentSession = () => {
      if (
        requestConfig.__authSessionRevision !== undefined &&
        requestConfig.__authSessionRevision !== getAuthSessionRevision()
      ) {
        throw new CanceledError(
          'The auth session changed before the request was sent.',
          config,
        );
      }
    };
    ensureCurrentSession();
    const token = await sessionStorage.getAccessToken();
    ensureCurrentSession();

    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
      requestConfig.__authSessionToken = token;
    }

    return config;
  });
};

export const responseInterceptor = (instance: AxiosInstance) => {
  instance.interceptors.response.use(
    async (response: AxiosResponse<unknown>) => {
      if (response.status < 200 || response.status >= 300) {
        if (response.status === 401) {
          await invalidateUnauthorizedSession(
            response.config as InternalRequestConfig,
          );
        }

        throw new HttpError(`Request failed with status ${response.status}.`, {
          kind: 'http',
          status: response.status,
          details: response.data,
        });
      }

      const requestConfig = response.config as InternalRequestConfig;
      if (
        requestConfig.__authSessionRevision !== undefined &&
        requestConfig.__authSessionRevision !== getAuthSessionRevision()
      ) {
        throw new HttpError(
          'The auth session changed before the response arrived.',
          {kind: 'canceled'},
        );
      }

      if (!isApiResponse(response.data)) {
        throw new HttpError(
          'API response does not match {code, data, message}.',
          {
            kind: 'invalid-response',
            status: response.status,
          },
        );
      }

      if (response.data.code === appConfig.api.successCode) {
        return response;
      }

      throw new HttpError(response.data.message || 'API request failed.', {
        kind: 'business',
        code: response.data.code,
        status: response.status,
        details: response.data.data,
      });
    },
    async (error: unknown) => {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        await invalidateUnauthorizedSession(
          error.config as InternalRequestConfig | undefined,
        );
      }

      const apiError = normalizeHttpError(error);

      if (apiError.kind !== 'canceled') {
        // Avoid logging Axios config, which may include credentials.
        logger.error('[http] response error', {
          kind: apiError.kind,
          code: apiError.code,
          status: apiError.status,
        });
      }

      return Promise.reject(apiError);
    },
  );
};
