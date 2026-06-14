import React, {PropsWithChildren} from 'react';

import {FeedbackProvider} from '@/components/FeedbackProvider';
import {AuthProvider} from '@/contexts/AuthContext';
import {I18nProvider} from '@/contexts/I18nContext';
import {QueryProvider} from '@/contexts/QueryProvider';
import {ThemeProvider} from '@/contexts/ThemeContext';

const AppProviders = ({children}: PropsWithChildren) => {
  return (
    <ThemeProvider>
      <I18nProvider>
        <QueryProvider>
          <FeedbackProvider>
            <AuthProvider>{children}</AuthProvider>
          </FeedbackProvider>
        </QueryProvider>
      </I18nProvider>
    </ThemeProvider>
  );
};

export default AppProviders;
