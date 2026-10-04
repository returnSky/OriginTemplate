import React, {PropsWithChildren} from 'react';
import {StyleSheet} from 'react-native';
import {useQueryClient} from '@tanstack/react-query';
import {getLocales, getTimeZone} from 'react-native-localize';
import {useTranslation} from 'react-i18next';
import {Text, XStack, YStack} from 'tamagui';

import {AppButton, Screen, StateView} from '@/components';
import {useFeedback} from '@/components/FeedbackProvider';
import {appConfig, type AppLanguagePreference} from '@/config';
import {useAppTheme} from '@/contexts/ThemeContext';
import {getStorageInfo} from '@/services/storage';
import {usePreferencesStore} from '@/stores/preferencesStore';

const Section = ({children}: PropsWithChildren) => (
  <YStack
    borderWidth={1}
    borderRadius={8}
    padding={16}
    marginBottom={16}
    backgroundColor="$surface"
    borderColor="$borderColor">
    {children}
  </YStack>
);

const Settings = () => {
  const {mode, setMode, toggleMode} = useAppTheme();
  const {showLoading, hideLoading, showToast} = useFeedback();
  const {t, i18n} = useTranslation();
  const language = usePreferencesStore(state => state.language);
  const setLanguage = usePreferencesStore(state => state.setLanguage);
  const queryClient = useQueryClient();
  const storageInfo = getStorageInfo();
  const queryCount = queryClient.getQueryCache().getAll().length;
  const deviceLocale =
    getLocales()[0]?.languageTag ?? appConfig.i18n.defaultLanguage;
  const timeZone = getTimeZone();
  const themeModeLabels = {
    system: t('settings.theme.modes.system'),
    light: t('settings.theme.modes.light'),
    dark: t('settings.theme.modes.dark'),
  };
  const languageLabels: Record<AppLanguagePreference, string> = {
    'en-US': t('settings.language.options.english'),
    'zh-CN': t('settings.language.options.chineseSimplified'),
    system: t('settings.language.options.system'),
  };

  const showLoadingDemo = () => {
    showLoading(t('settings.feedback.preparing'));
    setTimeout(() => {
      hideLoading();
      showToast({
        message: t('settings.feedback.loadingClosed'),
        type: 'success',
      });
    }, 900);
  };

  return (
    <Screen scroll>
      <Section>
        <Text color="$color" fontSize={18} fontWeight="800" lineHeight={26}>
          {t('settings.theme.title')}
        </Text>
        <Text marginTop={6} color="$colorMuted" fontSize={15} lineHeight={22}>
          {t('settings.theme.currentMode', {mode: themeModeLabels[mode]})}
        </Text>
        <XStack flexWrap="wrap" gap={10} marginTop={14}>
          <AppButton
            title={themeModeLabels.system}
            variant={mode === 'system' ? 'primary' : 'secondary'}
            onPress={() => setMode('system')}
            style={styles.optionButton}
          />
          <AppButton
            title={themeModeLabels.light}
            variant={mode === 'light' ? 'primary' : 'secondary'}
            onPress={() => setMode('light')}
            style={styles.optionButton}
          />
          <AppButton
            title={themeModeLabels.dark}
            variant={mode === 'dark' ? 'primary' : 'secondary'}
            onPress={() => setMode('dark')}
            style={styles.optionButton}
          />
        </XStack>
        <AppButton
          title={t('settings.theme.toggle')}
          variant="secondary"
          onPress={toggleMode}
          style={styles.fullButton}
        />
      </Section>

      <Section>
        <Text color="$color" fontSize={18} fontWeight="800" lineHeight={26}>
          {t('settings.language.title')}
        </Text>
        <Text marginTop={6} color="$colorMuted" fontSize={15} lineHeight={22}>
          {t('settings.language.currentPreference', {
            language: languageLabels[language],
          })}
        </Text>
        <Text marginTop={8} color="$colorMuted" fontSize={14} lineHeight={20}>
          {t('settings.language.resolved', {language: i18n.language})}
        </Text>
        <Text marginTop={8} color="$colorMuted" fontSize={14} lineHeight={20}>
          {t('settings.language.deviceLocale', {locale: deviceLocale})}
        </Text>
        <Text marginTop={8} color="$colorMuted" fontSize={14} lineHeight={20}>
          {t('settings.language.timeZone', {timeZone})}
        </Text>
        <XStack flexWrap="wrap" gap={10} marginTop={14}>
          {appConfig.i18n.languagePreferences.map(option => (
            <AppButton
              key={option}
              title={languageLabels[option]}
              variant={language === option ? 'primary' : 'secondary'}
              onPress={() => setLanguage(option)}
              style={styles.optionButton}
            />
          ))}
        </XStack>
      </Section>

      <Section>
        <Text color="$color" fontSize={18} fontWeight="800" lineHeight={26}>
          {t('settings.runtime.title')}
        </Text>
        <Text marginTop={8} color="$colorMuted" fontSize={14} lineHeight={20}>
          {t('settings.runtime.api', {value: appConfig.api.baseURL})}
        </Text>
        <Text marginTop={8} color="$colorMuted" fontSize={14} lineHeight={20}>
          {t('settings.runtime.timeout', {value: appConfig.api.timeout})}
        </Text>
        <Text marginTop={8} color="$colorMuted" fontSize={14} lineHeight={20}>
          {t('settings.runtime.queryStale', {
            value: appConfig.query.staleTime,
          })}
        </Text>
        <Text marginTop={8} color="$colorMuted" fontSize={14} lineHeight={20}>
          {t('settings.runtime.keychain', {
            value: appConfig.auth.keychainService,
          })}
        </Text>
      </Section>

      <Section>
        <Text color="$color" fontSize={18} fontWeight="800" lineHeight={26}>
          {t('settings.storage.title')}
        </Text>
        <Text marginTop={8} color="$colorMuted" fontSize={14} lineHeight={20}>
          {t('settings.storage.mmkv', {value: storageInfo.id})}
        </Text>
        <Text marginTop={8} color="$colorMuted" fontSize={14} lineHeight={20}>
          {t('settings.storage.keys', {value: storageInfo.length})}
        </Text>
        <Text marginTop={8} color="$colorMuted" fontSize={14} lineHeight={20}>
          {t('settings.storage.bytes', {value: storageInfo.byteSize})}
        </Text>
        <Text marginTop={8} color="$colorMuted" fontSize={14} lineHeight={20}>
          {t('settings.storage.queryCache', {value: queryCount})}
        </Text>
      </Section>

      <YStack gap={12} marginBottom={16}>
        <AppButton
          title={t('settings.feedback.showToast')}
          onPress={() =>
            showToast({
              message: t('settings.feedback.toastReady'),
              type: 'info',
            })
          }
        />
        <AppButton
          title={t('settings.feedback.showLoading')}
          variant="secondary"
          onPress={showLoadingDemo}
        />
      </YStack>

      <StateView
        variant="error"
        title={t('settings.stateSample.title')}
        description={t('settings.stateSample.description')}
        actionLabel={t('settings.stateSample.retry')}
        onAction={() =>
          showToast({
            message: t('settings.stateSample.retryClicked'),
            type: 'info',
          })
        }
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  fullButton: {
    marginTop: 12,
  },
  optionButton: {
    flexBasis: '30%',
    flexGrow: 1,
  },
});

export default Settings;
