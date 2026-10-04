# OriginTemplate

React Native CLI TypeScript scaffold with common app foundations already wired in.

## Included

- Typed native stack navigation.
- App providers for Tamagui theme, authentication, TanStack Query, and global feedback.
- Light, dark, and system theme modes.
- Tamagui UI kit and themed primitives wired to the app design tokens.
- i18next/react-i18next internationalization with React Native locale helpers.
- Axios HTTP client with envelope validation, typed errors, cancellation, token injection, and HTTP 401 session invalidation.
- Replaceable authentication adapter with DEV Debug-only demo login and validated Keychain sessions.
- Zustand stores with validated, versioned preference persistence and session isolation.
- TanStack Query client with React Native app-focus integration.
- MMKV key-value storage for persisted app state.
- Keychain-backed secure session storage.
- Reusable `Screen`, `AppButton`, `AppInput`, `AppList`, and `StateView` components.
- Validated login form with password visibility, keyboard avoidance, and accessible inputs.
- Typed user query/mutation examples, transient-error retries, and cache updates protected across sessions.
- `useAsyncTask` with latest-result and unmount protection, plus `useDebouncedValue`.
- Native DEV/UAT/PROD config through `react-native-config`, cross-platform `ENVFILE` build scripts, and credential-redacting diagnostic logging.
- One-command quality checks and a GitHub Actions workflow.
- App-level error boundary with retry fallback.
- Path alias: `@/*` maps to `src/*`.

See [通用模板接入指南](docs/TEMPLATE.md) for environment setup, real authentication, request/query examples, UI usage, and extension points.

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
yarn validate
```

The repo includes `yarn.lock`, so prefer Yarn when adding or updating dependencies.

## Build Environments

Tracked `.env.dev`, `.env.uat`, and `.env.prod` files contain public sample configuration. DEV uses platform-local API defaults when `API_BASE_URL` is empty; UAT/PROD require HTTPS and `AUTH_MODE=adapter`. Replace `https://uat-api.example.com` and `https://api.example.com` with your backend URLs and configure the authentication adapter before using those builds.

| Environment       | Android                  | iOS on macOS         | Default mode |
| ----------------- | ------------------------ | -------------------- | ------------ |
| DEV               | `yarn android:dev`       | `yarn ios:dev`       | Debug        |
| UAT               | `yarn android:uat`       | `yarn ios:uat`       | Release      |
| UAT for debugging | `yarn android:uat:debug` | `yarn ios:uat:debug` | Debug        |
| PROD              | `yarn android:prod`      | `yarn ios:prod`      | Release      |

`yarn android` and `yarn ios` default to DEV. `yarn build:android:uat` and `yarn build:android:prod` produce Release AABs without installing them; Android SDK/Gradle are required. Build scripts use `cross-env` to select `ENVFILE`; `scripts/run-native.js` validates the file before running the platform command and forwards additional CLI arguments. Android and iOS UAT/PROD Release run commands use `--no-packager`. iOS uses the `OriginTemplate-DEV`, `OriginTemplate-UAT`, and `OriginTemplate-PROD` schemes. UAT selects a backend environment independently of `__DEV__`; acceptance builds use Release. DEV/demo authentication is rejected in Release.

Additional device/simulator arguments are supported; environment scripts reject repeated mode/scheme overrides, interactive configuration selection, and prebuilt binaries. iOS uses fixed Xcode/Podfile file mappings and rejects environment overrides through xcconfig or extra build parameters. Write empty values as `KEY=` without quotes. Android Release currently uses the template debug signing key; configure release signing before publishing.

Keep `.env.*` files in UTF-8 without BOM and use LF line endings, including on Windows. `.gitattributes` sets `eol=lf` for those files so native readers stay consistent. Use one `KEY=value` entry per line, unique keys, and separate `#` comment lines; pre-build validation rejects inline comments, escapes, and multiline values.

Start Metro with `yarn start`. Environment values are compiled into the native app by `react-native-config`, so switching files or editing their values requires rebuilding and reinstalling the app. Restarting Metro alone cannot update an installed app's native configuration. Missing native `APP_ENV` fails explicitly. After installing this native dependency, run `bundle exec pod install` from `ios/` on macOS and rebuild both platforms.

MMKV and Keychain names include the environment, so persisted data and sessions remain separate. The native application ID / bundle identifier is shared: installing another environment replaces the current app. Separate co-installed app variants are outside this setup.

See [the template guide](docs/TEMPLATE.md#环境配置) for environment validation, API rules, and integration details.

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

- `src/config/index.ts` centralizes app, API, query, storage, and auth settings. `src/config/environment.ts` validates native `react-native-config` values with canonical `APP_ENV` values `dev`, `uat`, and `prod`.
- `tamagui.config.ts` creates the Tamagui config from `@tamagui/config/v5` and maps `src/theme` colors to app tokens such as `$surface`, `$surfaceMuted`, `$primary`, `$primaryText`, `$success`, `$warning`, `$danger`, `$color`, `$colorMuted`, and `$borderColor`.
- `src/contexts/ThemeContext.tsx` owns light/dark/system resolution and wraps the app with `TamaguiProvider`.
- Development Android emulator requests use `http://10.0.2.2:3000`; iOS uses `http://localhost:3000`.
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

## Dependency Baseline

The dependencies were reviewed against npm stable releases on 2026-10-03.

- React Native and its Babel, Metro, Jest, ESLint, and TypeScript configs are aligned to `0.87.1`; the community CLI packages are aligned to `20.2.0`.
- React, React DOM, and React Test Renderer use `19.2.8`, the latest patch in the React Native renderer's 19.2 line. React 19.3 should be adopted with a matching React Native renderer.
- Node must satisfy `^22.13.0 || ^24.3.0 || >=26.0.0`.
- Type checking runs TypeScript `7.0.2` through the `@typescript/native` npm alias. The `typescript` alias points to `@typescript/typescript6` so typescript-eslint can still load the TypeScript 6 compiler API. This follows the [official side-by-side migration](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6-0).
- VS Code uses the complete TypeScript 6 SDK at `node_modules/@typescript/old/lib` through `.vscode/settings.json`. The `node_modules/typescript` compatibility package only forwards the compiler API and does not contain the language server or standard library files. After changing the SDK path, select the workspace TypeScript version and restart the TypeScript server.
- Jest, Babel Jest, and the Node test environment use `30.5.2`. The config keeps the React Native preset's mocks and asset handling while selecting the Jest 30 transform and environment with React Native export conditions.
- Babel stays on `7.29.7` because the React Native preset and Metro toolchain still require Babel 7. ESLint and `@eslint/js` stay on `9.39.5` because the React Native ESLint config supports ESLint 8/9. Recheck upstream support before adopting Babel 8 or ESLint 10.
- Android follows the React Native 0.87 template: Android SDK Platform 37, Build Tools 37.0.0, Kotlin 2.2.0, and Gradle 9.4.1. Install those SDK packages before building; the target SDK remains 36. The AGP 9 Kotlin/DSL opt-outs retain compatibility with the existing plugins.

After installing the updated packages, rebuild native apps. On macOS, run `bundle exec pod install` from `ios/` before the iOS build.
