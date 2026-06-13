import React, {PropsWithChildren, useEffect} from 'react';

import {useAuthStore} from '@/stores/authStore';

export const AuthProvider = ({children}: PropsWithChildren) => {
  const initialize = useAuthStore(state => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return <>{children}</>;
};

export const useAuth = () => {
  const state = useAuthStore();

  return {
    ...state,
    isSignedIn: Boolean(state.accessToken),
  };
};
