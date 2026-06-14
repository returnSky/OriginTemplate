# Repository Guidelines

## Project Overview

This is a React Native CLI TypeScript scaffold with common app foundations wired in.

- React Native: `0.86.0`
- React: `19.2.7`
- Language: TypeScript
- Navigation: `@react-navigation/native` with native stack
- HTTP client: `axios`
- Internationalization: `i18next`, `react-i18next`, and `react-native-localize`
- Client state: `zustand`
- Server state/cache: `@tanstack/react-query`
- App persistence: `react-native-mmkv`
- Secure session storage: `react-native-keychain`
- Path alias: `@/*` maps to `src/*`

## Important Paths

- `src/App.tsx`: app root, wraps navigation in `SafeAreaProvider`, `AppErrorBoundary`, and `AppProviders`.
- `src/config/index.ts`: shared app, API, query, storage, and auth configuration.
- `src/navigations/RootNavigation.tsx`: stack navigator and route type definitions.
- `src/pages/`: screen components.
- `src/components/`: reusable UI primitives and global feedback provider.
- `src/components/AppErrorBoundary/`: app-level error boundary.
- `src/contexts/`: app providers for theme, auth initialization, and TanStack Query.
- `src/stores/`: Zustand stores for client-only app state.
- `src/services/http/`: shared Axios instance, interceptors, request/response types.
- `src/services/api/`: typed API modules built on the shared HTTP client.
- `src/services/i18n/`: i18next initialization, language resolution helpers, and translation resources.
- `src/services/query/`: shared QueryClient and query key factory.
- `src/services/storage/`: MMKV adapter for app storage and Zustand persistence.
- `src/services/secureStorage/`: Keychain adapter for sensitive credentials.
- `src/services/auth/sessionStorage.ts`: Keychain-backed auth session wrapper.
- `src/theme/`: design tokens and light/dark themes.
- `__mocks__/`: Jest-only native module mocks.
- `__tests__/`: Jest tests.
- `android/` and `ios/`: native platform projects.

## Commands

Use package scripts from the repository root:

- `yarn start` or `npm start`: start Metro.
- `yarn android` or `npm run android`: run Android build.
- `yarn ios` or `npm run ios`: run iOS build.
- `yarn lint` or `npm run lint`: run ESLint.
- `yarn typecheck` or `npm run typecheck`: run TypeScript with `--noEmit`.
- `yarn format:check` or `npm run format:check`: check Prettier formatting.
- `yarn format` or `npm run format`: format project files.
- `yarn test` or `npm test`: run Jest.

The repo includes `yarn.lock`, so prefer Yarn when adding or updating dependencies unless the user asks otherwise.

## Code Style

- Follow the existing React Native TypeScript style.
- Use `StyleSheet.create` for component styles.
- Prefer functional components.
- Keep imports using the configured `@/` alias for source modules.
- Prettier settings are in `.prettierrc.js`: single quotes, no bracket spacing, trailing commas, 2-space tabs.
- ESLint uses the flat config in `eslint.config.mjs` and extends `@react-native`.
- Keep button/card text readable on Android and iOS; avoid fixed heights that clip multi-line text.

## Navigation

- Update `RootStackParamList` in `src/navigations/RootNavigation.tsx` when adding or changing routes.
- Type screen navigation with `NativeStackNavigationProp<RootStackParamList, RouteName>`.
- Keep route names centralized in the stack type and navigator.

## State And Storage

- Put client-only UI/app state in Zustand stores under `src/stores`.
- Put remote server state in TanStack Query hooks and query modules instead of duplicating it in Zustand.
- Keep query keys centralized in `src/services/query/queryKeys.ts`.
- Put user language preference in Zustand/MMKV; the default language is `en-US`.
- Put non-sensitive persisted values in MMKV through `src/services/storage`.
- Put access tokens, refresh tokens, and credentials in Keychain through `src/services/secureStorage` and `src/services/auth/sessionStorage.ts`.
- Keep storage key names and service names centralized in `src/config/index.ts`.

## HTTP/API

- Use the shared `http` client from `src/services/http`.
- Add domain-specific API methods under `src/services/api` or nearby API modules.
- Keep request and response types explicit.
- The interceptor assumes API responses use `{code, data, message}` and treats `appConfig.api.successCode` as success.
- The current local API base URL uses `http://10.0.2.2:3000` on Android and `http://localhost:3000` on iOS.

## Native Dependencies

- MMKV v4 depends on `react-native-nitro-modules`.
- `react-native-localize` is a native dependency used to resolve device locale information for the optional system language preference.
- After changing native dependencies, rebuild Android/iOS apps.
- For iOS, run `bundle exec pod install` from `ios/` after dependency changes.
- Do not modify generated/native files under `android/` or `ios/` unless the task specifically requires native changes.

## Testing Notes

- Run `yarn format:check`, `yarn lint`, `yarn typecheck`, and `yarn test` after code changes when feasible.
- Jest maps `react-native-mmkv` to `__mocks__/react-native-mmkv.ts` because Nitro native modules are unavailable in the test runtime.
- Jest maps `react-native-localize` to `__mocks__/react-native-localize.ts` because locale APIs are native-backed.
- The default test imports `../src/App`.

## Working Tree Notes

- Preserve unrelated user changes.
- Do not remove or reset untracked editor files such as `.vscode/`.
- Check `git status --short` before staging or committing.
