import React, {PropsWithChildren, useEffect} from 'react';
import {AppState, Platform} from 'react-native';
import {QueryClientProvider, focusManager} from '@tanstack/react-query';

import {queryClient} from '@/services/query';

const onAppStateChange = (status: string | null | undefined) => {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
};

export const QueryProvider = ({children}: PropsWithChildren) => {
  useEffect(() => {
    onAppStateChange(AppState.currentState);
    const subscription = AppState.addEventListener('change', onAppStateChange);

    return () => {
      subscription.remove();
      focusManager.setFocused(undefined);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};
