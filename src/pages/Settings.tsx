import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useQueryClient} from '@tanstack/react-query';

import {AppButton, Screen, StateView} from '@/components';
import {useFeedback} from '@/components/FeedbackProvider';
import {appConfig} from '@/config';
import {useAppTheme} from '@/contexts/ThemeContext';
import {getStorageInfo} from '@/services/storage';

const Settings = () => {
  const {theme, mode, setMode, toggleMode} = useAppTheme();
  const {showLoading, hideLoading, showToast} = useFeedback();
  const queryClient = useQueryClient();
  const storageInfo = getStorageInfo();
  const queryCount = queryClient.getQueryCache().getAll().length;

  const showLoadingDemo = () => {
    showLoading('Preparing template...');
    setTimeout(() => {
      hideLoading();
      showToast({message: 'Loading overlay closed', type: 'success'});
    }, 900);
  };

  return (
    <Screen scroll>
      <View
        style={[
          styles.section,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}>
        <Text style={[styles.title, {color: theme.colors.text}]}>Theme</Text>
        <Text style={[styles.description, {color: theme.colors.textMuted}]}>
          Current mode: {mode}
        </Text>
        <View style={styles.modeGrid}>
          <AppButton
            title="System"
            variant={mode === 'system' ? 'primary' : 'secondary'}
            onPress={() => setMode('system')}
          />
          <AppButton
            title="Light"
            variant={mode === 'light' ? 'primary' : 'secondary'}
            onPress={() => setMode('light')}
          />
          <AppButton
            title="Dark"
            variant={mode === 'dark' ? 'primary' : 'secondary'}
            onPress={() => setMode('dark')}
          />
        </View>
        <AppButton
          title="Toggle Theme"
          variant="secondary"
          onPress={toggleMode}
          style={styles.fullButton}
        />
      </View>

      <View
        style={[
          styles.section,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}>
        <Text style={[styles.title, {color: theme.colors.text}]}>
          Runtime config
        </Text>
        <Text style={[styles.meta, {color: theme.colors.textMuted}]}>
          API: {appConfig.api.baseURL}
        </Text>
        <Text style={[styles.meta, {color: theme.colors.textMuted}]}>
          Timeout: {appConfig.api.timeout}ms
        </Text>
        <Text style={[styles.meta, {color: theme.colors.textMuted}]}>
          Query stale: {appConfig.query.staleTime}ms
        </Text>
        <Text style={[styles.meta, {color: theme.colors.textMuted}]}>
          Keychain: {appConfig.auth.keychainService}
        </Text>
      </View>

      <View
        style={[
          styles.section,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}>
        <Text style={[styles.title, {color: theme.colors.text}]}>Storage</Text>
        <Text style={[styles.meta, {color: theme.colors.textMuted}]}>
          MMKV: {storageInfo.id}
        </Text>
        <Text style={[styles.meta, {color: theme.colors.textMuted}]}>
          Keys: {storageInfo.length}
        </Text>
        <Text style={[styles.meta, {color: theme.colors.textMuted}]}>
          Bytes: {storageInfo.byteSize}
        </Text>
        <Text style={[styles.meta, {color: theme.colors.textMuted}]}>
          Query cache: {queryCount}
        </Text>
      </View>

      <View style={styles.actions}>
        <AppButton
          title="Show Toast"
          onPress={() =>
            showToast({message: 'Global toast is ready', type: 'info'})
          }
        />
        <AppButton
          title="Show Loading"
          variant="secondary"
          onPress={showLoadingDemo}
        />
      </View>

      <StateView
        variant="error"
        title="Error state sample"
        description="Use StateView for empty, loading, and error sections."
        actionLabel="Retry"
        onAction={() => showToast({message: 'Retry clicked', type: 'info'})}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  section: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '800',
  },
  description: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 22,
  },
  meta: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  modeGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  fullButton: {
    marginTop: 12,
  },
  actions: {
    gap: 12,
    marginBottom: 16,
  },
});

export default Settings;
