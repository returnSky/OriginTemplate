import React, {PropsWithChildren} from 'react';

import {FeedbackProvider} from '@/components/FeedbackProvider';
import {AuthProvider} from '@/contexts/AuthContext';
import {QueryProvider} from '@/contexts/QueryProvider';
import {ThemeProvider} from '@/contexts/ThemeContext';

const AppProviders = ({children}: PropsWithChildren) => {
  return (
    <ThemeProvider>
      <QueryProvider>
        <FeedbackProvider>
          <AuthProvider>{children}</AuthProvider>
        </FeedbackProvider>
      </QueryProvider>
    </ThemeProvider>
  );
};

export default AppProviders;
