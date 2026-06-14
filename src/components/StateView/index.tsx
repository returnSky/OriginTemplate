import React from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';

import AppButton from '@/components/AppButton';
import {useAppTheme} from '@/contexts/ThemeContext';

type StateViewVariant = 'loading' | 'empty' | 'error';

interface StateViewProps {
  variant: StateViewVariant;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const defaultTitleKey: Record<StateViewVariant, string> = {
  loading: 'stateView.loading.title',
  empty: 'stateView.empty.title',
  error: 'stateView.error.title',
};

const StateView = ({
  variant,
  title,
  description,
  actionLabel,
  onAction,
}: StateViewProps) => {
  const {theme} = useAppTheme();
  const {t} = useTranslation();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}>
      {variant === 'loading' ? (
        <ActivityIndicator color={theme.colors.primary} />
      ) : (
        <View
          style={[
            styles.symbol,
            {
              backgroundColor:
                variant === 'error'
                  ? theme.colors.danger
                  : theme.colors.surfaceMuted,
            },
          ]}>
          <Text
            style={[
              styles.symbolText,
              {
                color:
                  variant === 'error'
                    ? theme.colors.primaryText
                    : theme.colors.textMuted,
              },
            ]}>
            {variant === 'error' ? '!' : '-'}
          </Text>
        </View>
      )}
      <Text style={[styles.title, {color: theme.colors.text}]}>
        {title ?? t(defaultTitleKey[variant])}
      </Text>
      {description ? (
        <Text style={[styles.description, {color: theme.colors.textMuted}]}>
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <AppButton
          title={actionLabel}
          onPress={onAction}
          variant="secondary"
          style={styles.action}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  symbol: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
  },
  symbolText: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
  },
  title: {
    marginTop: 12,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '700',
  },
  description: {
    marginTop: 6,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  action: {
    alignSelf: 'stretch',
    marginTop: 16,
  },
});

export default StateView;
