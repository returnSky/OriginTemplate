module.exports = {
  preset: '@react-native/jest-preset',
  moduleNameMapper: {
    '^react-native-localize$': '<rootDir>/__mocks__/react-native-localize.ts',
    '^react-native-mmkv$': '<rootDir>/__mocks__/react-native-mmkv.ts',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|@tanstack|react-native-localize|react-native-safe-area-context|react-native-screens|react-native-toast-message|react-native-mmkv|react-native-nitro-modules|zustand)/)',
  ],
};
