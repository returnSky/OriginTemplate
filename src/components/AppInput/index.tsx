import React, {forwardRef, useImperativeHandle, useRef, useState} from 'react';
import {StyleProp, StyleSheet, ViewStyle} from 'react-native';
import {useTranslation} from 'react-i18next';
import {Button, Input, type InputProps, Text, XStack, YStack} from 'tamagui';

export interface AppInputRef {
  focus: () => void;
  blur: () => void;
}

export interface AppInputProps extends Omit<InputProps, 'children'> {
  editable?: boolean;
  label: string;
  help?: string;
  error?: string;
  password?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

const inputFocusStyle = {borderColor: '$primary'} as const;
const inputErrorFocusStyle = {borderColor: '$danger'} as const;

const AppInput = forwardRef<AppInputRef, AppInputProps>(
  (
    {
      label,
      help,
      error,
      password = false,
      secureTextEntry,
      editable = true,
      readOnly = false,
      disabled = false,
      accessibilityLabel,
      accessibilityHint,
      autoCapitalize,
      autoCorrect,
      containerStyle,
      ...inputProps
    },
    ref,
  ) => {
    const {t} = useTranslation();
    const [passwordVisible, setPasswordVisible] = useState(false);
    const inputRef = useRef<React.ComponentRef<typeof Input>>(null);

    useImperativeHandle(ref, () => ({
      focus: () => {
        const input = inputRef.current;

        if (input && 'focus' in input && typeof input.focus === 'function') {
          input.focus();
        }
      },
      blur: () => {
        const input = inputRef.current;

        if (input && 'blur' in input && typeof input.blur === 'function') {
          input.blur();
        }
      },
    }));

    const isPassword = password || Boolean(secureTextEntry);
    const isEditable = editable && !disabled && !readOnly;
    const description = error || help;
    const hint = [accessibilityHint, description].filter(Boolean).join('. ');

    return (
      <YStack gap={6} style={StyleSheet.flatten(containerStyle)}>
        <Text color="$color" fontSize={14} fontWeight="600" lineHeight={20}>
          {label}
        </Text>
        <XStack gap={8} alignItems="center">
          <Input
            {...inputProps}
            ref={inputRef}
            flex={1}
            minWidth={0}
            minHeight={48}
            height="auto"
            paddingHorizontal={12}
            paddingVertical={12}
            borderWidth={1}
            borderRadius={8}
            backgroundColor="$surface"
            color="$color"
            borderColor={error ? '$danger' : '$borderColor'}
            placeholderTextColor="$colorMuted"
            focusStyle={error ? inputErrorFocusStyle : inputFocusStyle}
            opacity={isEditable ? 1 : 0.58}
            readOnly={!isEditable}
            disabled={disabled}
            autoCapitalize={isPassword ? 'none' : autoCapitalize}
            autoCorrect={isPassword ? false : autoCorrect}
            secureTextEntry={isPassword ? !passwordVisible : secureTextEntry}
            accessibilityLabel={accessibilityLabel ?? label}
            accessibilityHint={hint || undefined}
            accessibilityState={{disabled: !isEditable}}
            aria-invalid={Boolean(error)}
          />
          {isPassword ? (
            <Button
              unstyled
              minWidth={44}
              minHeight={44}
              paddingHorizontal={8}
              alignItems="center"
              justifyContent="center"
              accessibilityRole="button"
              accessibilityLabel={`${t(
                passwordVisible ? 'forms.hidePassword' : 'forms.showPassword',
              )} ${label}`}
              accessibilityState={{disabled: !isEditable}}
              disabled={!isEditable}
              opacity={isEditable ? 1 : 0.58}
              onPress={() => setPasswordVisible(current => !current)}>
              <Text color="$primary" fontSize={14} lineHeight={20}>
                {t(
                  passwordVisible ? 'forms.hidePassword' : 'forms.showPassword',
                )}
              </Text>
            </Button>
          ) : null}
        </XStack>
        {description ? (
          <Text
            color={error ? '$danger' : '$colorMuted'}
            fontSize={13}
            lineHeight={18}
            accessibilityLiveRegion={error ? 'polite' : 'none'}>
            {description}
          </Text>
        ) : null}
      </YStack>
    );
  },
);

AppInput.displayName = 'AppInput';

export default AppInput;
