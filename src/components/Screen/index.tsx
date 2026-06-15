import React, {PropsWithChildren} from 'react';
import {StyleProp, StyleSheet, ViewStyle} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ScrollView, YStack} from 'tamagui';

import {useAppTheme} from '@/contexts/ThemeContext';

interface ScreenProps extends PropsWithChildren {
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

const Screen = ({
  children,
  scroll = false,
  style,
  contentContainerStyle,
}: ScreenProps) => {
  const {theme} = useAppTheme();

  if (scroll) {
    return (
      <SafeAreaView
        edges={['bottom']}
        style={[styles.container, {backgroundColor: theme.colors.background}]}>
        <ScrollView keyboardShouldPersistTaps="handled" flex={1}>
          <YStack padding={16} style={[contentContainerStyle, style]}>
            {children}
          </YStack>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['bottom']}
      style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <YStack flex={1} padding={16} style={style}>
        {children}
      </YStack>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default Screen;
