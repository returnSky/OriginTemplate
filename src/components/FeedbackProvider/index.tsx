import React, {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';

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

const FeedbackContext = createContext<FeedbackContextValue | undefined>(
  undefined,
);

export const FeedbackProvider = ({children}: PropsWithChildren) => {
  const {theme} = useAppTheme();
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const [loading, setLoading] = useState<LoadingState>({visible: false});

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setToast(null);
    }, toast.duration ?? 2200);

    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = useCallback((options: ToastOptions) => {
    setToast(options);
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
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

  const toastColor =
    toast?.type === 'error'
      ? theme.colors.danger
      : toast?.type === 'success'
        ? theme.colors.success
        : theme.colors.text;

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      {toast ? (
        <View
          pointerEvents="none"
          style={[
            styles.toast,
            {
              backgroundColor: theme.colors.surface,
              borderColor: toastColor,
            },
          ]}>
          <Text style={[styles.toastText, {color: theme.colors.text}]}>
            {toast.message}
          </Text>
        </View>
      ) : null}
      {loading.visible ? (
        <View style={styles.loadingBackdrop}>
          <View
            style={[
              styles.loadingCard,
              {backgroundColor: theme.colors.surface},
            ]}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={[styles.loadingText, {color: theme.colors.text}]}>
              {loading.message ?? 'Loading...'}
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
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 34,
    borderLeftWidth: 4,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 6,
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
