import React, {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import {useTranslation} from 'react-i18next';
import Toast, {
  type ToastConfig,
  type ToastConfigParams,
} from 'react-native-toast-message';
import {Button, Spinner, Text, YStack} from 'tamagui';

type ToastType = 'success' | 'error' | 'info';

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

interface FeedbackContextValue {
  showToast: (options: ToastOptions) => void;
  hideToast: () => void;
  showLoading: (message?: string) => void;
  hideLoading: () => void;
}

interface LoadingState {
  visible: boolean;
  message?: string;
}

type AppThemeColorToken =
  | '$borderColor'
  | '$color'
  | '$danger'
  | '$primary'
  | '$success'
  | '$surface';

interface AppToastProps {
  accentColor: AppThemeColorToken;
  backgroundColor: AppThemeColorToken;
  borderColor: AppThemeColorToken;
  message?: string;
  onPress: () => void;
  textColor: AppThemeColorToken;
}

interface ToastRendererOptions {
  accentColor: AppThemeColorToken;
  backgroundColor: AppThemeColorToken;
  borderColor: AppThemeColorToken;
  textColor: AppThemeColorToken;
}

const FeedbackContext = createContext<FeedbackContextValue | undefined>(
  undefined,
);

const toastPressedStyle = {opacity: 0.9};

const AppToast = ({
  accentColor,
  backgroundColor,
  borderColor,
  message,
  onPress,
  textColor,
}: AppToastProps) => (
  <Button
    unstyled
    accessibilityRole="alert"
    onPress={onPress}
    width="92%"
    maxWidth={520}
    borderLeftWidth={4}
    borderWidth={1}
    borderRadius={8}
    paddingHorizontal={16}
    paddingVertical={12}
    shadowColor="#000000"
    shadowOffset={{width: 0, height: 8}}
    shadowOpacity={0.14}
    shadowRadius={16}
    elevation={6}
    backgroundColor={backgroundColor}
    borderColor={borderColor}
    borderLeftColor={accentColor}
    pressStyle={toastPressedStyle}>
    <Text color={textColor} fontSize={15} fontWeight="600" lineHeight={22}>
      {message}
    </Text>
  </Button>
);

const createToastRenderer =
  ({
    accentColor,
    backgroundColor,
    borderColor,
    textColor,
  }: ToastRendererOptions) =>
  ({text1, onPress, hide}: ToastConfigParams<unknown>) => (
    <AppToast
      accentColor={accentColor}
      backgroundColor={backgroundColor}
      borderColor={borderColor}
      message={text1}
      onPress={() => {
        onPress();
        hide();
      }}
      textColor={textColor}
    />
  );

export const FeedbackProvider = ({children}: PropsWithChildren) => {
  const {t} = useTranslation();
  const [loading, setLoading] = useState<LoadingState>({visible: false});

  const showToast = useCallback((options: ToastOptions) => {
    Toast.show({
      type: options.type ?? 'info',
      text1: options.message,
      position: 'bottom',
      bottomOffset: 34,
      visibilityTime: options.duration ?? 2200,
    });
  }, []);

  const hideToast = useCallback(() => {
    Toast.hide();
  }, []);

  const showLoading = useCallback((message?: string) => {
    setLoading({visible: true, message});
  }, []);

  const hideLoading = useCallback(() => {
    setLoading({visible: false});
  }, []);

  const value = useMemo<FeedbackContextValue>(
    () => ({
      showToast,
      hideToast,
      showLoading,
      hideLoading,
    }),
    [hideLoading, hideToast, showLoading, showToast],
  );

  const toastConfig = useMemo<ToastConfig>(() => {
    const sharedOptions: Omit<ToastRendererOptions, 'accentColor'> = {
      backgroundColor: '$surface',
      borderColor: '$borderColor',
      textColor: '$color',
    };

    return {
      error: createToastRenderer({
        ...sharedOptions,
        accentColor: '$danger',
      }),
      info: createToastRenderer({
        ...sharedOptions,
        accentColor: '$primary',
      }),
      success: createToastRenderer({
        ...sharedOptions,
        accentColor: '$success',
      }),
    };
  }, []);

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <Toast
        config={toastConfig}
        position="bottom"
        bottomOffset={34}
        visibilityTime={2200}
      />
      {loading.visible ? (
        <YStack
          position="absolute"
          top={0}
          right={0}
          bottom={0}
          left={0}
          alignItems="center"
          justifyContent="center"
          backgroundColor="rgba(15, 23, 42, 0.36)">
          <YStack
            minWidth={132}
            alignItems="center"
            borderRadius={8}
            paddingHorizontal={20}
            paddingVertical={18}
            backgroundColor="$surface">
            <Spinner color="$primary" />
            <Text marginTop={10} color="$color" fontSize={14} lineHeight={20}>
              {loading.message ?? t('common.loading')}
            </Text>
          </YStack>
        </YStack>
      ) : null}
    </FeedbackContext.Provider>
  );
};

export const useFeedback = () => {
  const value = useContext(FeedbackContext);

  if (!value) {
    throw new Error('useFeedback must be used within FeedbackProvider');
  }

  return value;
};
