import {QueryClient} from '@tanstack/react-query';

import {appConfig} from '@/config';

import {shouldRetryQuery} from './retry';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: appConfig.query.staleTime,
      gcTime: appConfig.query.gcTime,
      retry: shouldRetryQuery,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
