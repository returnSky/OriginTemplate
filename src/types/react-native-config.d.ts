import 'react-native-config';

declare module 'react-native-config' {
  interface NativeConfig {
    // Keep native values optional until resolveEnvironment validates them.
    APP_ENV?: string;
    API_BASE_URL?: string;
    AUTH_MODE?: string;
  }
}
