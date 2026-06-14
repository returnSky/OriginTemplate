import React, {PropsWithChildren, useEffect} from 'react';
import {AppState, AppStateStatus, Platform} from 'react-native';
import {QueryClientProvider, focusManager} from '@tanstack/react-query';

import {queryClient} from '@/services/query';

const onAppStateChange = (status: AppStateStatus) => {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
};

export const QueryProvider = ({children}: PropsWithChildren) => {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange);

    return () => subscription.remove();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};
