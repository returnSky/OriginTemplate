# OriginTemplate

React Native CLI TypeScript scaffold with common app foundations already wired in.

## Included

- Typed native stack navigation.
- App providers for Tamagui theme, authentication, TanStack Query, and global feedback.
- Light, dark, and system theme modes.
- Tamagui UI kit and themed primitives wired to the app design tokens.
- i18next/react-i18next internationalization with React Native locale helpers.
- Axios HTTP client with API envelope validation and auth token injection.
- Zustand stores for auth and preferences.
- TanStack Query client with React Native app-focus integration.
- MMKV key-value storage for persisted app state.
- Keychain-backed secure session storage.
- Reusable `Screen`, `AppButton`, and `StateView` components.
- `useAsyncTask` hook for loading, error, and data flows.
- App-level error boundary with retry fallback.
- Path alias: `@/*` maps to `src/*`.

## Project Structure

```txt
src/
  components/      Tamagui-based UI primitives and app feedback provider
  config/          Runtime app config
  contexts/        AppProviders, auth, and theme contexts
  hooks/           Shared hooks
  navigations/     Root navigator and route types
  pages/           Screen components
  services/        API, auth session, HTTP, i18n, query, and storage modules
  stores/          Zustand stores
  theme/           Design tokens and light/dark themes
  utils/           Shared utilities
tamagui.config.ts  Tamagui config and app theme-token bridge
```

## Commands

```sh
yarn start
yarn android
yarn ios
yarn lint
yarn typecheck
yarn format:check
yarn test
```

The repo includes `yarn.lock`, so prefer Yarn when adding or updating dependencies.

## HTTP Contract

The shared HTTP client expects API responses shaped like:

```ts
{
  code: number;
  data: T;
  message: string;
}
```

`code === 200` is treated as success. `http.get<T>()`, `http.post<T>()`, and the other helpers return the unwrapped `data` payload.

## Configuration Notes

- `src/config/index.ts` centralizes app, API, query, storage, and auth settings.
- `tamagui.config.ts` creates the Tamagui config from `@tamagui/config/v5` and maps `src/theme` colors to app tokens such as `$surface`, `$surfaceMuted`, `$primary`, `$primaryText`, `$success`, `$warning`, `$danger`, `$color`, `$colorMuted`, and `$borderColor`.
- `src/contexts/ThemeContext.tsx` owns light/dark/system resolution and wraps the app with `TamaguiProvider`.
- Android emulator requests use `http://10.0.2.2:3000`; iOS uses `http://localhost:3000`.
- `src/services/i18n` initializes i18next, exports language resolution helpers, and stores translation resources.
- The default app language is `en-US`; `zh-CN` is also included, and the optional `system` preference resolves through `react-native-localize`.
- `src/services/storage` exposes an MMKV adapter for app storage and Zustand persistence.
- `src/services/auth/sessionStorage.ts` stores sensitive session data through Keychain.
- `src/services/query` exposes the shared TanStack Query client and query key factory.

## UI And Theme

- Use Tamagui components from `tamagui` for app UI layout and primitives, such as `YStack`, `XStack`, `Text`, `Button`, `Spinner`, `Circle`, and `ScrollView`.
- Prefer Tamagui theme tokens over hard-coded colors in UI components. Current app tokens are defined in `tamagui.config.ts` and sourced from `src/theme/index.ts`.
- Keep reusable UI primitives under `src/components`, then use those primitives from screens when possible. Existing examples include `AppButton`, `Screen`, `StateView`, the feedback overlay, and the error fallback.
- `ThemeProvider` is intentionally mounted outside `AppErrorBoundary` in `src/App.tsx`, so the error fallback can still render with Tamagui theme values.
- The current Tamagui setup uses the v5 base config without adding Reanimated/native animation drivers. Add native animation dependencies only when the app starts using Tamagui components or animation features that require them.

## State And Storage

- Put client-only UI/app state in Zustand stores under `src/stores`.
- Put remote server state in TanStack Query hooks instead of duplicating it in Zustand.
- Put non-sensitive persisted values, including theme and language preferences, in MMKV.
- Put access tokens, refresh tokens, and credentials in Keychain.

## Internationalization

- Use `useTranslation()` from `react-i18next` for component and screen text.
- Add or update copy under `src/services/i18n/resources`.
- Keep supported languages centralized in `src/config/index.ts`.
- The app starts in English (`en-US`) by default. Selecting `system` in Settings uses `react-native-localize` to choose the best supported device language and falls back to English.

## Native Setup

Make sure the React Native development environment is ready before running Android or iOS builds:

- React Native environment setup: https://reactnative.dev/docs/set-up-your-environment
- iOS first install: `bundle install` then `bundle exec pod install` from `ios/`
- After adding native dependencies such as MMKV, Nitro Modules, Keychain, or React Native Localize, rebuild Android/iOS apps.
- The current Tamagui integration adds JavaScript dependencies only. `react-dom` is installed to satisfy Tamagui peer resolution from its top-level package entry and Jest runtime; it does not require a native rebuild.

## Testing Notes

- Jest maps native-only modules to files under `__mocks__/`, including `react-native-mmkv` and `react-native-localize`.
- Jest transforms `tamagui` and `@tamagui/*` packages because Tamagui ships ESM/native entrypoints that must be compiled in the Jest runtime.
