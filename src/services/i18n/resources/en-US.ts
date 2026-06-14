type DeepStringRecord<T> = {
  [Key in keyof T]: T[Key] extends string ? string : DeepStringRecord<T[Key]>;
};

const enUS = {
  common: {
    loading: 'Loading...',
  },
  navigation: {
    template: 'Template',
    profile: 'Profile',
    settings: 'Settings',
  },
  stateView: {
    loading: {
      title: 'Loading',
    },
    empty: {
      title: 'No data',
    },
    error: {
      title: 'Something went wrong',
    },
  },
  errorBoundary: {
    title: 'Something went wrong',
    description:
      'The app hit an unexpected error. You can retry or reload the app.',
    retry: 'Try again',
  },
  home: {
    description:
      'A React Native CLI scaffold with common app foundations wired in.',
    openProfile: 'Open Profile',
    settings: 'Settings',
    includedFoundations: 'Included foundations',
    features: {
      typedNavigation: 'Typed navigation',
      zustandStores: 'Zustand stores',
      tanstackQuery: 'TanStack Query',
      mmkvStorage: 'MMKV storage',
      keychainSession: 'Keychain session',
      globalFeedback: 'Global feedback',
      i18n: 'Internationalization',
    },
    query: {
      finished: 'Template query finished',
      checking: 'Checking template',
      ready: 'Query sample ready',
      running: 'Running a sample async task.',
      completedChecks_one: 'Completed query check: {{count}}',
      completedChecks_other: 'Completed query checks: {{count}}',
      run: 'Run query sample',
    },
  },
  settings: {
    theme: {
      title: 'Theme',
      currentMode: 'Current mode: {{mode}}',
      modes: {
        system: 'System',
        light: 'Light',
        dark: 'Dark',
      },
      toggle: 'Toggle Theme',
    },
    language: {
      title: 'Language',
      currentPreference: 'Current language: {{language}}',
      resolved: 'Resolved language: {{language}}',
      deviceLocale: 'Device locale: {{locale}}',
      timeZone: 'Time zone: {{timeZone}}',
      options: {
        english: 'English',
        chineseSimplified: 'Simplified Chinese',
        system: 'Use device language',
      },
    },
    runtime: {
      title: 'Runtime config',
      api: 'API: {{value}}',
      timeout: 'Timeout: {{value}}ms',
      queryStale: 'Query stale: {{value}}ms',
      keychain: 'Keychain: {{value}}',
    },
    storage: {
      title: 'Storage',
      mmkv: 'MMKV: {{value}}',
      keys: 'Keys: {{value}}',
      bytes: 'Bytes: {{value}}',
      queryCache: 'Query cache: {{value}}',
    },
    feedback: {
      showToast: 'Show Toast',
      showLoading: 'Show Loading',
      preparing: 'Preparing template...',
      loadingClosed: 'Loading overlay closed',
      toastReady: 'Global toast is ready',
    },
    stateSample: {
      title: 'Error state sample',
      description: 'Use StateView for empty, loading, and error sections.',
      retry: 'Retry',
      retryClicked: 'Retry clicked',
    },
  },
  profile: {
    guest: 'Guest',
    guestDescription:
      'Use this page as the starting point for real login and account UI.',
    session: 'Session: {{value}}',
    authenticated: 'Authenticated',
    anonymous: 'Anonymous session',
    signIn: 'Sign in',
    signOut: 'Sign out',
    backHome: 'Back Home',
    signedOut: 'Signed out',
    signedIn: 'Signed in with template account',
  },
} as const;

export type TranslationResource = DeepStringRecord<typeof enUS>;

export default enUS;
