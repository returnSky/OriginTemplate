import React, {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import Toast, {
  type ToastConfig,
  type ToastConfigParams,
} from 'react-native-toast-message';

import {useAppTheme} from '@/contexts/ThemeContext';

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

interface AppToastProps {
  accentColor: string;
  backgroundColor: string;
  borderColor: string;
  message?: string;
  onPress: () => void;
  textColor: string;
}

interface ToastRendererOptions {
  accentColor: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
}

const FeedbackContext = createContext<FeedbackContextValue | undefined>(
  undefined,
);

const AppToast = ({
  accentColor,
  backgroundColor,
  borderColor,
  message,
  onPress,
  textColor,
}: AppToastProps) => (
  <Pressable
    accessibilityRole="alert"
    onPress={onPress}
    style={({pressed}) => [
      styles.toast,
      {
        backgroundColor,
        borderColor,
        borderLeftColor: accentColor,
      },
      pressed ? styles.toastPressed : null,
    ]}>
    <Text style={[styles.toastText, {color: textColor}]}>{message}</Text>
  </Pressable>
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
  const {theme} = useAppTheme();
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
    const sharedOptions = {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      textColor: theme.colors.text,
    };

    return {
      error: createToastRenderer({
        ...sharedOptions,
        accentColor: theme.colors.danger,
      }),
      info: createToastRenderer({
        ...sharedOptions,
        accentColor: theme.colors.primary,
      }),
      success: createToastRenderer({
        ...sharedOptions,
        accentColor: theme.colors.success,
      }),
    };
  }, [
    theme.colors.border,
    theme.colors.danger,
    theme.colors.primary,
    theme.colors.success,
    theme.colors.surface,
    theme.colors.text,
  ]);

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
        <View style={styles.loadingBackdrop}>
          <View
            style={[
              styles.loadingCard,
              {backgroundColor: theme.colors.surface},
            ]}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={[styles.loadingText, {color: theme.colors.text}]}>
              {loading.message ?? t('common.loading')}
            </Text>
          </View>
        </View>
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

const styles = StyleSheet.create({
  toast: {
    width: '92%',
    maxWidth: 520,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 6,
  },
  toastPressed: {
    opacity: 0.9,
  },
  toastText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  loadingBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.36)',
  },
  loadingCard: {
    minWidth: 132,
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
  },
});
