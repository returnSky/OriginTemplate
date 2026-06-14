import React, {PropsWithChildren} from 'react';
import {ScrollView, StyleProp, StyleSheet, View, ViewStyle} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

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
        <ScrollView
          keyboardShouldPersistTaps="handled"
          style={styles.flex}
          contentContainerStyle={[
            styles.content,
            contentContainerStyle,
            style,
          ]}>
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['bottom']}
      style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <View style={[styles.content, styles.flex, style]}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
});

export default Screen;
