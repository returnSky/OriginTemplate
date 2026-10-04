import React, {PropsWithChildren} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import {SafeAreaView, type Edge} from 'react-native-safe-area-context';
import {ScrollView, YStack} from 'tamagui';

import {useAppTheme} from '@/contexts/ThemeContext';

export interface ScreenProps extends PropsWithChildren {
  scroll?: boolean;
  keyboardAvoiding?: boolean;
  keyboardVerticalOffset?: number;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

const Screen = ({
  children,
  scroll = false,
  keyboardAvoiding = false,
  keyboardVerticalOffset = 0,
  edges = ['bottom'],
  style,
  contentContainerStyle,
}: ScreenProps) => {
  const {theme} = useAppTheme();
  const content = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={styles.scrollContent}
      flex={1}>
      <YStack padding={16} style={StyleSheet.flatten(contentContainerStyle)}>
        {children}
      </YStack>
    </ScrollView>
  ) : (
    <YStack
      flex={1}
      padding={16}
      style={StyleSheet.flatten(contentContainerStyle)}>
      {children}
    </YStack>
  );

  return (
    <SafeAreaView
      edges={edges}
      style={[
        styles.container,
        {backgroundColor: theme.colors.background},
        style,
      ]}>
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={keyboardVerticalOffset}>
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});

export default Screen;
