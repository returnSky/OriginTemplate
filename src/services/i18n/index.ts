import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import {findBestLanguageTag} from 'react-native-localize';

import {
  appConfig,
  type AppLanguage,
  type AppLanguagePreference,
} from '@/config';
import {resources} from '@/services/i18n/resources';
import {logger} from '@/utils';

export const getResolvedLanguage = (
  languagePreference: AppLanguagePreference,
): AppLanguage => {
  if (languagePreference !== 'system') {
    return languagePreference;
  }

  return (
    findBestLanguageTag(appConfig.i18n.supportedLanguages)?.languageTag ??
    appConfig.i18n.defaultLanguage
  );
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: appConfig.i18n.defaultLanguage,
    fallbackLng: appConfig.i18n.defaultLanguage,
    supportedLngs: [...appConfig.i18n.supportedLanguages],
    defaultNS: 'translation',
    ns: ['translation'],
    initAsync: false,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  })
  .catch(error => {
    logger.error('[i18n] failed to initialize', error);
  });

export const changeAppLanguage = async (
  languagePreference: AppLanguagePreference,
) => {
  const resolvedLanguage = getResolvedLanguage(languagePreference);

  if (i18n.language !== resolvedLanguage) {
    await i18n.changeLanguage(resolvedLanguage);
  }

  return resolvedLanguage;
};

export default i18n;
