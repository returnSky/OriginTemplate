# OriginTemplate

React Native CLI TypeScript scaffold with common app foundations already wired in.

## Included

- Typed native stack navigation.
- App providers for theme, authentication, TanStack Query, and global feedback.
- Light, dark, and system theme modes.
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
  components/      Shared UI primitives and app feedback provider
  config/          Runtime app config
  contexts/        AppProviders, auth, and theme contexts
  hooks/           Shared hooks
  navigations/     Root navigator and route types
  pages/           Screen components
  services/        API, auth session, HTTP, i18n, query, and storage modules
  stores/          Zustand stores
  theme/           Design tokens and light/dark themes
  utils/           Shared utilities
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
- Android emulator requests use `http://10.0.2.2:3000`; iOS uses `http://localhost:3000`.
- `src/services/i18n` initializes i18next, exports language resolution helpers, and stores translation resources.
- The default app language is `en-US`; `zh-CN` is also included, and the optional `system` preference resolves through `react-native-localize`.
- `src/services/storage` exposes an MMKV adapter for app storage and Zustand persistence.
- `src/services/auth/sessionStorage.ts` stores sensitive session data through Keychain.
- `src/services/query` exposes the shared TanStack Query client and query key factory.

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

## Testing Notes

- Jest maps native-only modules to files under `__mocks__/`, including `react-native-mmkv` and `react-native-localize`.
