import React from 'react';
import type {FallbackProps} from 'react-error-boundary';
import {Button, Text, YStack} from 'tamagui';

import i18n from '@/services/i18n';

const buttonPressedStyle = {opacity: 0.82};

const DefaultFallback = ({resetErrorBoundary}: FallbackProps) => {
  return (
    <YStack
      flex={1}
      alignItems="center"
      justifyContent="center"
      backgroundColor="$background"
      padding={24}>
      <Text
        color="$color"
        fontSize={20}
        fontWeight="700"
        lineHeight={28}
        textAlign="center">
        {i18n.t('errorBoundary.title')}
      </Text>
      <Text
        marginTop={8}
        color="$colorMuted"
        fontSize={15}
        lineHeight={22}
        textAlign="center">
        {i18n.t('errorBoundary.description')}
      </Text>
      <Button
        unstyled
        accessibilityRole="button"
        onPress={resetErrorBoundary}
        minHeight={44}
        alignItems="center"
        justifyContent="center"
        marginTop={20}
        borderRadius={8}
        backgroundColor="$primary"
        paddingHorizontal={18}
        pressStyle={buttonPressedStyle}>
        <Text
          color="$primaryText"
          fontSize={15}
          fontWeight="700"
          lineHeight={20}>
          {i18n.t('errorBoundary.retry')}
        </Text>
      </Button>
    </YStack>
  );
};

export default DefaultFallback;
