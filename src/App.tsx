import React from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import AppErrorBoundary from '@/components/AppErrorBoundary';
import AppProviders from '@/contexts/AppProviders';
import RootNavigation from '@/navigations/RootNavigation';

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <AppErrorBoundary>
        <AppProviders>
          <RootNavigation />
        </AppProviders>
      </AppErrorBoundary>
    </SafeAreaProvider>
  );
}

export default App;
