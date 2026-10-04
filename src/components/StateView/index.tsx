import React from 'react';
import {StyleSheet} from 'react-native';
import {useTranslation} from 'react-i18next';
import {Circle, Spinner, Text, YStack} from 'tamagui';

import AppButton from '@/components/AppButton';

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

const styles = StyleSheet.create({
  action: {
    alignSelf: 'stretch',
    marginTop: 16,
  },
});

const StateView = ({
  variant,
  title,
  description,
  actionLabel,
  onAction,
}: StateViewProps) => {
  const {t} = useTranslation();

  return (
    <YStack
      alignItems="center"
      borderWidth={1}
      borderRadius={8}
      paddingHorizontal={16}
      paddingVertical={24}
      backgroundColor="$surface"
      borderColor="$borderColor">
      {variant === 'loading' ? (
        <Spinner color="$primary" />
      ) : (
        <Circle
          size={34}
          backgroundColor={variant === 'error' ? '$danger' : '$surfaceMuted'}>
          <Text
            color={variant === 'error' ? '$primaryText' : '$colorMuted'}
            fontSize={18}
            fontWeight="800"
            lineHeight={22}>
            {variant === 'error' ? '!' : '-'}
          </Text>
        </Circle>
      )}
      <Text
        marginTop={12}
        color="$color"
        fontSize={17}
        fontWeight="700"
        lineHeight={24}>
        {title ?? t(defaultTitleKey[variant])}
      </Text>
      {description ? (
        <Text
          marginTop={6}
          color="$colorMuted"
          fontSize={14}
          lineHeight={20}
          textAlign="center">
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
    </YStack>
  );
};

export default StateView;
