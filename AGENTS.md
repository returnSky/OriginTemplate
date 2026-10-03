# Repository Guidelines

## Project Overview

This is a React Native CLI TypeScript scaffold with common app foundations wired in.

- React Native: `0.87.1`
- React: `19.2.8`
- Language: TypeScript
- Navigation: `@react-navigation/native` with native stack
- UI library: `tamagui` with `@tamagui/config`
- HTTP client: `axios`
- Internationalization: `i18next`, `react-i18next`, and `react-native-localize`
- Client state: `zustand`
- Server state/cache: `@tanstack/react-query`
- App persistence: `react-native-mmkv`
- Secure session storage: `react-native-keychain`
- Native build environment: `react-native-config`; cross-platform build scripts: `cross-env`
- Tamagui peer/runtime helper: `react-dom`
- Path alias: `@/*` maps to `src/*`

## Important Paths

- `src/App.tsx`: app root, wraps navigation in `SafeAreaProvider`, `ThemeProvider`, `AppErrorBoundary`, and `AppProviders`.
- `tamagui.config.ts`: Tamagui config built from `@tamagui/config/v5`, with app theme tokens mapped from `src/theme`.
- `src/config/index.ts`: shared app, API, query, storage, and auth configuration.
- `src/config/environment.ts`: validates native `react-native-config` values for APP_ENV, API_BASE_URL, and AUTH_MODE. Canonical environments are `dev`, `uat`, and `prod`.
- `.env.dev`, `.env.uat`, `.env.prod`: tracked public build configuration samples selected through ENVFILE. Replace sample API URLs for actual projects.
- `.gitattributes`: keeps `.env.*` files on LF line endings for consistent Android and iOS parsing.
- `scripts/check-environment.js`: validates the selected file and expected environment before native builds.
- `scripts/run-native.js`: validates ENVFILE, runs the native CLI, and forwards additional command arguments without shell-specific quoting.
- `docs/TEMPLATE.md`: template integration guide with environment, auth, query, and UI examples.
- `src/navigations/RootNavigation.tsx`: stack navigator and route type definitions.
- `src/pages/`: screen components.
- `src/components/`: Tamagui-based reusable UI primitives and global feedback provider.
- `src/components/AppErrorBoundary/`: app-level error boundary.
- `src/contexts/`: app providers for Tamagui theme, auth initialization, and TanStack Query.
- `src/stores/`: Zustand stores for client-only app state.
- `src/services/http/`: shared Axios instance, interceptors, request/response types.
- `src/services/api/`: typed API modules built on the shared HTTP client.
- `src/services/i18n/`: i18next initialization, language resolution helpers, and translation resources.
- `src/services/query/`: shared QueryClient and query key factory.
- `src/services/storage/`: MMKV adapter for app storage and Zustand persistence.
- `src/services/secureStorage/`: Keychain adapter for sensitive credentials.
- `src/services/auth/sessionStorage.ts`: validated, serialized Keychain-backed auth session wrapper.
- `src/services/auth/adapter.ts`: replaceable backend AuthAdapter; configure before mounting App. Demo auth is available only in DEV Debug builds.
- `src/theme/`: design tokens and light/dark themes.
- `__mocks__/`: Jest-only native module mocks.
- `__tests__/`: Jest tests.
- `android/` and `ios/`: native platform projects.

## Commands

Use package scripts from the repository root:

- `yarn start` or `npm start`: start Metro.
- `yarn android` or `npm run android`: run the default DEV Debug Android build.
- `yarn ios` or `npm run ios`: run the default DEV Debug iOS build.
- `yarn android:dev` / `yarn ios:dev`: build DEV in Debug mode.
- `yarn android:uat` / `yarn ios:uat`: build UAT in Release mode for acceptance testing.
- `yarn android:uat:debug` / `yarn ios:uat:debug`: build UAT in Debug mode.
- `yarn android:prod` / `yarn ios:prod`: build PROD in Release mode.
- `yarn build:android:uat` / `yarn build:android:prod`: create Android Release AABs without installing; require Android SDK/Gradle.
- `node scripts/check-environment.js --env-file .env.uat --expected-env uat --release true`: validate an environment file without the native SDK.
- `yarn lint` or `npm run lint`: run ESLint.
- `yarn typecheck` or `npm run typecheck`: run TypeScript with `--noEmit`.
- `yarn format:check` or `npm run format:check`: check Prettier formatting.
- `yarn format` or `npm run format`: format project files.
- `yarn test` or `npm test`: run Jest.
- `yarn test:ci`: run Jest once in CI mode.
- `yarn validate`: run formatting, lint, type checking, and CI tests together.

The repo includes `yarn.lock`, so prefer Yarn when adding or updating dependencies unless the user asks otherwise.

## Code Style

- Follow the existing React Native TypeScript style.
- Use Tamagui components from `tamagui` for app UI layout and shared UI primitives.
- Prefer Tamagui theme tokens such as `$surface`, `$surfaceMuted`, `$primary`, `$primaryText`, `$color`, `$colorMuted`, `$borderColor`, `$success`, `$warning`, and `$danger` instead of hard-coded colors in UI components.
- Keep shared UI primitives under `src/components` and consume them from screens when possible.
- Use `StyleSheet.create` for React Native style objects that still need to be passed through `style`, such as `SafeAreaView` styles or small reusable style props.
- Prefer functional components.
- Keep imports using the configured `@/` alias for source modules.
- Prettier settings are in `.prettierrc.js`: single quotes, no bracket spacing, trailing commas, 2-space tabs.
- ESLint uses the flat config in `eslint.config.mjs` and extends `@react-native`.
- Keep button/card text readable on Android and iOS; avoid fixed heights that clip multi-line text.

## UI And Theme

- `src/theme/index.ts` remains the source for app light/dark colors, spacing, radius, typography, and `ThemeMode`.
- `tamagui.config.ts` bridges those theme colors into Tamagui tokens and disables shorthand-only restrictions so both long-form Tamagui style props and local conventions are usable.
- `src/contexts/ThemeContext.tsx` resolves `system`, `light`, and `dark` preferences and passes the selected theme name to `TamaguiProvider`.
- Keep `ThemeProvider` outside `AppErrorBoundary` so the error fallback can render Tamagui components with theme tokens.
- The current setup uses `@tamagui/config/v5` base config without Reanimated/native animation drivers. Do not add `react-native-reanimated` or other native animation dependencies unless a task specifically requires Tamagui animation features that need them.

## Navigation

- Update `RootStackParamList` in `src/navigations/RootNavigation.tsx` when adding or changing routes.
- Type screen navigation with `NativeStackNavigationProp<RootStackParamList, RouteName>`.
- Keep route names centralized in the stack type and navigator.
- Root navigation waits for auth initialization and resets screen history when the session identity changes.

## State And Storage

- Put client-only UI/app state in Zustand stores under `src/stores`.
- Put remote server state in TanStack Query hooks and query modules instead of duplicating it in Zustand.
- Keep query keys centralized in `src/services/query/queryKeys.ts`.
- Put user language preference in Zustand/MMKV; the default language is `en-US`.
- Put non-sensitive persisted values in MMKV through `src/services/storage`.
- Put access tokens, refresh tokens, and credentials in Keychain through `src/services/secureStorage` and `src/services/auth/sessionStorage.ts`.
- Keep storage key names and service names centralized in `src/config/index.ts`.
- MMKV instance ID and Keychain service/account include the canonical environment so DEV/UAT/PROD persisted data and sessions stay isolated. The native application ID / bundle identifier remains shared; environment builds replace the installed app.

## HTTP/API

- Use the shared `http` client from `src/services/http`.
- Add domain-specific API methods under `src/services/api` or nearby API modules.
- Keep request and response types explicit.
- The interceptor assumes API responses use `{code, data, message}` and treats `appConfig.api.successCode` as success.
- UAT (`uat`) and PROD (`prod`) require explicit HTTPS API_BASE_URL and adapter auth. Release builds reject DEV (`dev`) and demo auth. APP_ENV names are independent of `__DEV__`; UAT supports Debug and Release.
- `react-native-config` reads ENVFILE during native builds; cross-env makes file selection portable across shells. Metro does not inject environment values. Rebuild and reinstall the native app when changing environment files or values; restarting Metro alone does not update the installed configuration. Missing native APP_ENV must fail explicitly.
- Environment files contain public build configuration, not credentials. The UAT/PROD example API URLs must be replaced before real integration.
- Keep `.env.*` in UTF-8 without BOM and LF format, including on Windows. Use single-line KEY=value entries, unique keys, and separate comment lines. Inline comments, escapes, and multiline values are rejected so Node validation and native parsers see the same configuration.
- Android and iOS UAT/PROD Release run commands use `--no-packager`; DEV and UAT Debug use Metro normally.
- The development local API base URL uses `http://10.0.2.2:3000` on Android and `http://localhost:3000` on iOS.

## Native Dependencies

- MMKV v4 depends on `react-native-nitro-modules`.
- `react-native-config` is a native dependency. Android loads the chosen ENVFILE in Gradle; iOS DEV/UAT/PROD schemes select their configuration. Run CocoaPods on macOS and rebuild after installing or updating it.
- `react-native-localize` is a native dependency used to resolve device locale information for the optional system language preference.
- The current Tamagui setup adds JavaScript dependencies only. `react-dom` is included to satisfy Tamagui peer/module resolution from the top-level package entry and Jest runtime; it does not require native rebuilds.
- After changing native dependencies, rebuild Android/iOS apps.
- For iOS, run `bundle exec pod install` from `ios/` after dependency changes.
- Do not modify generated/native files under `android/` or `ios/` unless the task specifically requires native changes.

## Testing Notes

- Run `yarn format:check`, `yarn lint`, `yarn typecheck`, and `yarn test` after code changes when feasible.
- Jest maps `react-native-mmkv` to `__mocks__/react-native-mmkv.ts` because Nitro native modules are unavailable in the test runtime.
- Jest maps `react-native-localize` to `__mocks__/react-native-localize.ts` because locale APIs are native-backed.
- Jest maps `react-native-config` to a fixed DEV mock; environment rules are covered independently. Native Config must not silently fall back to DEV when unavailable.
- Jest transforms `tamagui` and `@tamagui/*` packages because Tamagui ships ESM/native entrypoints.
- The default test imports `../src/App`.

## Working Tree Notes

- Preserve unrelated user changes.
- Do not remove or reset untracked editor files such as `.vscode/`.
- Check `git status --short` before staging or committing.
