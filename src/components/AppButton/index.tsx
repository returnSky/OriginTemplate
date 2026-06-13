import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';

import {useAppTheme} from '@/contexts/ThemeContext';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface AppButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

const AppButton = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
}: AppButtonProps) => {
  const {theme} = useAppTheme();
  const isDisabled = disabled || loading;

  const backgroundColor =
    variant === 'danger'
      ? theme.colors.danger
      : variant === 'secondary'
        ? theme.colors.surfaceMuted
        : theme.colors.primary;

  const color =
    variant === 'secondary' ? theme.colors.text : theme.colors.primaryText;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      style={({pressed}) => [
        styles.button,
        {
          backgroundColor,
          borderColor:
            variant === 'secondary' ? theme.colors.border : backgroundColor,
          opacity: isDisabled ? 0.58 : pressed ? 0.82 : 1,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={color} size="small" />
      ) : (
        <Text numberOfLines={2} style={[styles.title, {color}]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  title: {
    width: '100%',
    fontSize: 15,
    includeFontPadding: false,
    lineHeight: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default AppButton;
