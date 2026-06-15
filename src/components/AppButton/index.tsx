import React from 'react';
import {StyleProp, StyleSheet, ViewStyle} from 'react-native';
import {Button, Spinner, Text} from 'tamagui';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface AppButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

const buttonPressedStyle = {opacity: 0.82};
const buttonDisabledStyle = {opacity: 0.58};

const AppButton = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
}: AppButtonProps) => {
  const isDisabled = disabled || loading;

  const backgroundColor =
    variant === 'danger'
      ? '$danger'
      : variant === 'secondary'
        ? '$surfaceMuted'
        : '$primary';

  const color = variant === 'secondary' ? '$color' : '$primaryText';
  const borderColor =
    variant === 'secondary' ? '$borderColor' : backgroundColor;

  return (
    <Button
      unstyled
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      minHeight={44}
      alignItems="center"
      justifyContent="center"
      borderWidth={1}
      borderRadius={8}
      paddingHorizontal={16}
      paddingVertical={10}
      backgroundColor={backgroundColor}
      borderColor={borderColor}
      opacity={isDisabled ? 0.58 : 1}
      pressStyle={isDisabled ? buttonDisabledStyle : buttonPressedStyle}
      disabledStyle={buttonDisabledStyle}
      style={style}>
      {loading ? (
        <Spinner color={color} size="small" />
      ) : (
        <Text
          width="100%"
          color={color}
          fontSize={15}
          fontWeight="700"
          lineHeight={20}
          textAlign="center"
          numberOfLines={2}
          style={styles.title}>
          {title}
        </Text>
      )}
    </Button>
  );
};

const styles = StyleSheet.create({
  title: {
    includeFontPadding: false,
  },
});

export default AppButton;
