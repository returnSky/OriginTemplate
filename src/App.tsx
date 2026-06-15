import React from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import AppErrorBoundary from '@/components/AppErrorBoundary';
import AppProviders from '@/contexts/AppProviders';
import {ThemeProvider} from '@/contexts/ThemeContext';
import RootNavigation from '@/navigations/RootNavigation';

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppErrorBoundary>
          <AppProviders>
            <RootNavigation />
          </AppProviders>
        </AppErrorBoundary>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;
