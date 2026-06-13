import React from 'react';
import type {FallbackProps} from 'react-error-boundary';
import {Pressable, View, Text, StyleSheet} from 'react-native';

const DefaultFallback = ({resetErrorBoundary}: FallbackProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.description}>
        The app hit an unexpected error. You can retry or reload the app.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={resetErrorBoundary}
        style={styles.button}>
        <Text style={styles.buttonText}>Try again</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    padding: 24,
  },
  title: {
    color: '#111827',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    marginTop: 8,
    color: '#64748B',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  button: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    paddingHorizontal: 18,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
});

export default DefaultFallback;
