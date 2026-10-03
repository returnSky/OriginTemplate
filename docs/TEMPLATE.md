# 通用模板接入指南

本模板提供可复用的客户端基础能力。Home 的查询和开发环境的登录是本地演示；用户详情、更新与真实认证需要接入项目后端。

## 启动与检查

```sh
yarn install --frozen-lockfile
yarn start
yarn android
yarn validate
```

iOS 在 macOS 上安装 CocoaPods 后运行 `yarn ios`。首次安装按 README 的 Native Setup 执行。环境配置依赖 `react-native-config`，对应的原生接入已纳入工程；首次安装或更新该依赖后需要重新构建。

`yarn validate` 顺序执行 Prettier、ESLint、TypeScript 和 Jest；`yarn test:ci` 单独运行 CI 模式测试。`.github/workflows/quality.yml` 在 push 和 pull request 时执行相同检查。原生构建需要对应平台的 SDK，不包含在这个 JS 质量工作流中。

## 环境配置

`react-native-config` 在 Android/iOS 原生构建时读取所选 `.env` 文件，并向 JavaScript 提供原生配置。`cross-env` 让 package scripts 在 Windows、macOS 和 Linux 上统一设置 `ENVFILE`；应用通过 `src/config/environment.ts` 校验后使用这些值。Metro/Babel 不注入环境变量，手机端也不读取 `process.env`。

| 环境 | APP_ENV | 文件        | API_BASE_URL                  | AUTH_MODE | 默认构建 |
| ---- | ------- | ----------- | ----------------------------- | --------- | -------- |
| DEV  | `dev`   | `.env.dev`  | 留空时使用平台本地 API        | `demo`    | Debug    |
| UAT  | `uat`   | `.env.uat`  | `https://uat-api.example.com` | `adapter` | Release  |
| PROD | `prod`  | `.env.prod` | `https://api.example.com`     | `adapter` | Release  |

三个 `.env` 文件是已纳入版本控制的公开样例。使用 UAT/PROD 前，将示例 API 域名替换为实际后端，并完成下文的 AuthAdapter 接入。`API_BASE_URL` 可以带路径，但不能包含 URL 凭据、查询字符串或片段；UAT/PROD 必须使用 HTTPS 和 adapter 认证。配置会进入原生应用产物，用于公开配置；token 和凭据继续放在 Keychain。

环境文件使用 UTF-8 无 BOM 和 LF 换行；`.gitattributes` 为 `.env.*` 固定 `eol=lf`。Windows 编辑时也要保留 LF，避免 CRLF 与 iOS Ruby 读取方式产生差异。每个配置写成独立的 `KEY=value` 行，键不能重复；不使用行末注释、转义字符或多行值，注释放在独立的 `#` 行上。构建前校验会拒绝这些格式差异。

DEV 文件中的 `API_BASE_URL` 留空时，Android 使用 `http://10.0.2.2:3000`，iOS 使用 `http://localhost:3000`。真机开发时把它改成手机能够访问到的电脑局域网地址。DEV 演示登录仅允许 Debug；Release 构建拒绝 `dev` 和 `demo`。UAT 是后端环境，`__DEV__` 是 JavaScript 的构建模式：UAT 可以用 Debug 调试，也可以用 `__DEV__ = false` 的 Release 包进行验收。

环境命令：

| 目的             | Android                              | iOS（macOS）                 |
| ---------------- | ------------------------------------ | ---------------------------- |
| DEV Debug        | `yarn android` 或 `yarn android:dev` | `yarn ios` 或 `yarn ios:dev` |
| UAT Release 验收 | `yarn android:uat`                   | `yarn ios:uat`               |
| UAT Debug 调试   | `yarn android:uat:debug`             | `yarn ios:uat:debug`         |
| PROD Release     | `yarn android:prod`                  | `yarn ios:prod`              |

Android 命令通过 `ENVFILE` 选择配置，同时选择 `debug` 或 `release` 构建；Android 与 iOS 的 UAT/PROD Release 运行命令都使用 `--no-packager`，Release 不需要启动 Metro。iOS 命令分别选择 `OriginTemplate-DEV`、`OriginTemplate-UAT`、`OriginTemplate-PROD` scheme；UAT 使用 `Debug-UAT` / `Release-UAT` configuration。原生工程的默认 Debug 配置对应 DEV，默认 Release 配置对应 PROD。构建脚本会在执行平台命令前校验环境文件与预期环境，避免选错文件或把 DEV/demo 打进 Release。

只生成 Android Release AAB、不安装到设备时，使用 `yarn build:android:uat` 或 `yarn build:android:prod`。这些命令调用 `react-native build-android --mode release`，并在构建前校验对应文件；仍需要 Android SDK 和 Gradle 环境。平台命令通过 `scripts/run-native.js` 执行，可以在 Yarn 命令后追加受支持的 React Native CLI 参数。

环境脚本支持追加 `--device`、`--simulator` 等参数；不能重复覆盖 `--mode` / `--scheme`，也不能通过交互选择或预构建二进制绕过环境检查。iOS 配置固定映射到三个 `.env` 文件，自定义文件需要同步调整 Xcode 与 Podfile 映射；不能通过 `--xcconfig` 或额外构建参数覆盖环境。空值写作 `KEY=`，不要写 `KEY=""` 或 `KEY=''`。Android Release 当前沿用模板的 debug 签名；正式发布前需要配置发布 keystore。

Metro 使用普通的 `yarn start`，不需要环境参数。修改 `.env` 或切换 DEV/UAT/PROD 后，需要重新构建并安装对应原生 App；只重启 Metro 或刷新 JavaScript，不能改变已安装 App 中的原生配置。原生配置缺少 `APP_ENV` 时会明确报错，不会自动回退到 DEV。

MMKV 实例 ID、Keychain service/account 按 `dev` / `uat` / `prod` 隔离，避免把上个环境的缓存、偏好或 session 带到另一个环境。三个环境仍使用同一个原生 application ID / bundle identifier；安装另一环境的包会替换已有 App。本轮没有增加不同包名或图标的并存应用配置。

可在没有移动端 SDK 的环境中单独检查文件：

```sh
node scripts/check-environment.js --env-file .env.uat --expected-env uat --release true
```

Jest 将 `react-native-config` 映射到固定 DEV 配置的 mock，便于运行 UI/Query 测试；环境校验规则有独立测试。Jest 检查不代替所选环境的原生构建和设备验证。首次安装或更新 `react-native-config` 后，Android/iOS 都需要重建；iOS 在 macOS 上从 `ios/` 执行 `bundle exec pod install`，然后再运行对应环境命令。

## 接入真实认证

认证类型位于 `src/services/auth/types.ts`。接入真实登录时设置 `AUTH_MODE=adapter`，并在应用挂载前调用 `configureAuthAdapter`，提供：

- `signIn(payload)`：返回 `{user, session}`。
- `restoreSession(session, cachedUser)`：向后端确认会话并返回用户；无效会话返回 `null`。
- 可选 `signOut(session)`：撤销服务器端会话。客户端会先清除本地登录状态与缓存。

以下端点只是接入示例，按实际后端修改：

```ts
import {
  configureAuthAdapter,
  type AuthResult,
  type AuthUser,
  type SignInPayload,
} from '@/services/auth';
import {http} from '@/services/http';

configureAuthAdapter({
  signIn: payload =>
    http.post<AuthResult, SignInPayload>('/auth/sign-in', payload, {
      skipAuth: true,
    }),
  restoreSession: () => http.get<AuthUser>('/auth/me'),
});
```

把这段配置放入单独的 bootstrap 模块，并从 `index.js` 导入，确保执行时间早于 `AppRegistry` 挂载 App。`AuthUser` 包含 `id/name/email`，`AuthSession` 包含 `accessToken`、可选 `refreshToken` 和可选 `expiresAt`（毫秒时间戳）。

开发模式的 demo 接受邮箱与至少 8 位密码，仅用于界面演示；生成的 token 不能用于服务器认证。adapter 模式未配置真实实现时会给出明确错误。模板没有假设刷新 token 的后端协议；过期会话会被清理。要加入自动刷新，请按后端约定实现刷新接口、并发合并与重试规则。

初始化会读取并验证 Keychain 会话，导航在此期间显示加载态。退出、401 或账号切换会取消查询、清空 Query 缓存并重置导航历史。HTTP 401 只使该请求实际使用的应用 token 失效，旧请求不会登出后续的新会话。`skipAuth: true` 的公共接口不会注入应用 token，也不会使应用会话失效。API 信封里的业务 `code` 与 HTTP status 分开处理；业务 `code: 401` 目前按业务错误返回。

MMKV 只持久化用户展示信息与非敏感偏好。token 存在 Keychain；缺少 Keychain 原生模块时仅 Debug 模式可使用内存回退，Release 会报错。客户端退出会立即阻止旧 token 的后续使用；若系统凭据删除失败，界面会显示失败，应修复原生存储问题后重试。

## 请求与错误

所有 API 通过 `src/services/http` 的 `http` 实例访问。后端响应约定：

```ts
type ApiResponse<T> = {
  code: number;
  data: T;
  message: string;
};
```

成功条件由 `appConfig.api.successCode` 决定，默认 200，helper 返回解包后的 `data`。无内容或其它响应格式需按实际合同调整响应拦截器。

```ts
import {http, isHttpError, isCanceledError} from '@/services/http';

const controller = new AbortController();
const result = await http.request<{id: string}>({
  method: 'GET',
  url: '/example',
  signal: controller.signal,
});
// 需要取消时调用 controller.abort()。
```

错误为 `HttpError extends Error`，包含 `kind`、业务或 HTTP `code`、可选 `status/details`。kind 区分 http、business、network、timeout、canceled、invalid-response、unknown。使用 `isCanceledError` 忽略取消请求；用 `isHttpError` 判断可展示的请求错误。

全局 Toast 和 loading 由调用侧的 `useFeedback` 管理，便于针对具体操作决定反馈。HTTP 层不会自动显示界面。查询重试仅针对网络错误、超时、408、429 与 5xx；业务错误、其它 4xx、取消和响应格式错误不会重试。mutation 默认不重试。

## 服务端状态

用户 API 在 `src/services/api/index.ts`，query keys 在 `src/services/query/queryKeys.ts`。现有 `/user/:id` 是示例接口，请替换后端端点与类型。

```tsx
import {useUserQuery, useUpdateUserMutation} from '@/services/query';

const detail = useUserQuery(userId); // null/undefined ID 不请求
const update = useUpdateUserMutation(userId);

update.mutate({username: 'Updated'});
```

详情查询向 Axios 透传 TanStack Query 的 `AbortSignal`。更新成功会回填缓存并使当前详情失效，让活跃页面从服务器刷新最终值。旧会话的更新响应不会回填新会话缓存。服务端数据放 Query，界面状态放 Zustand。

应用前后台切换已连接 `focusManager`。RN 的实时网络状态需要额外的原生网络模块；本模板尚未连接 NetInfo/`onlineManager`。要启用断网暂停与联网重取，按 [TanStack Query 的 React Native 指南](https://tanstack.com/query/latest/docs/framework/react/react-native) 接入，安装原生依赖后重建。

## 表单、列表与 hooks

`AppInput` 提供 label、help、error、密码显隐、无障碍提示和 focus/blur ref。密码输入支持 `password` 或 `secureTextEntry`；`editable/disabled/readOnly` 都映射到真实原生输入的只读状态。`src/utils/validation.ts` 提供 required、email、minLength、maxLength、matches 和返回首个错误的 validate，错误文案由调用侧多语言资源传入。

`Profile` 示例演示邮箱/密码校验、下一项焦点、键盘提交、防重复提交和失败反馈。通过 `Screen keyboardAvoiding` 与导航 header 高度配合 iOS 键盘避让；Android 沿用已有窗口的键盘缩放行为。

`AppList<T>` 包装原生 FlatList，保留类型化 renderItem、原生 props 与 ref，支持：

- 首次 loading、error/retry、empty 状态。
- `refreshing/onRefresh` 下拉刷新，保留已有数据。
- `hasNextPage/isFetchingNextPage/onEndReached` 加载更多与分页 loading。

将列表放在 `<Screen>` 内；不要再套 `<Screen scroll>`。分页数据与请求由 Query hook 管理；将数据及状态传给列表。遇到刷新或分页失败，可以保留行并通过 `useFeedback` 提示错误。样例：

```tsx
<Screen>
  <AppList
    data={items}
    keyExtractor={item => item.id}
    renderItem={({item}) => <Text>{item.title}</Text>}
    isLoading={query.isPending}
    isError={query.isError}
    errorMessage={query.error?.message}
    onRetry={() => void query.refetch()}
    refreshing={query.isRefetching}
    onRefresh={() => void query.refetch()}
    hasNextPage={hasNextPage}
    isFetchingNextPage={isFetchingNextPage}
    onEndReached={() => void fetchNextPage()}
  />
</Screen>
```

样例里的 `items/query/hasNextPage/isFetchingNextPage/fetchNextPage` 来自实际的列表或分页 hook，`Text` 从 Tamagui 导入。

`useAsyncTask` 用于本地异步操作，处理最新一次任务、卸载与 reset 后的结果失效；`cancel()` 停止跟踪结果，不会停止底层操作。网络取消请使用 AbortSignal。原调用仍会完成或抛出，调用侧需要处理 rejection。`useDebouncedValue(value, delay)` 用于搜索输入等防抖场景。

`Screen.style` 作用于屏幕容器，`contentContainerStyle` 作用于内容；`edges` 可调整安全区域边缘，默认 bottom 适用于有导航 header 的页面。没有 header 的页面请显式包含 top。

## 偏好、语言与日志

偏好存储新增版本迁移、字段校验与 `resetPreferences()`，无效的持久化语言/主题值会回退到默认值。选择 system 语言时，应用回到前台会重新解析设备语言。

通过 `logger` 输出结构化诊断时，authorization、cookie、password、token、secret、credential、api key 等键会被脱敏；Error 只记录 name/message，避免 Axios config 外泄。此规则针对结构化字段，调用方仍应避免把凭据拼进消息字符串。

## 可按业务接入的能力

权限、相机/相册、推送、深链原生 scheme、分析/崩溃上报、自动 token 刷新和发布签名需要业务服务或平台配置，按产品需求接入。当前模板保持原有依赖基线，可在这些基础接口上扩展。
