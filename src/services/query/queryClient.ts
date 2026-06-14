import {QueryClient} from '@tanstack/react-query';

import {appConfig} from '@/config';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: appConfig.query.staleTime,
      gcTime: appConfig.query.gcTime,
      retry: appConfig.query.retry,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
