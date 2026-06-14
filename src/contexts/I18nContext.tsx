import React, {PropsWithChildren, useEffect} from 'react';
import {I18nextProvider} from 'react-i18next';

import i18n, {changeAppLanguage} from '@/services/i18n';
import {usePreferencesStore} from '@/stores/preferencesStore';
import {logger} from '@/utils';

export const I18nProvider = ({children}: PropsWithChildren) => {
  const language = usePreferencesStore(state => state.language);

  useEffect(() => {
    changeAppLanguage(language).catch(error => {
      logger.error('[i18n] failed to change language', error);
    });
  }, [language]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
};
