import type {TranslationResource} from './en-US';

const zhCN = {
  common: {
    loading: '加载中...',
  },
  navigation: {
    template: '模板',
    profile: '个人资料',
    settings: '设置',
  },
  stateView: {
    loading: {
      title: '加载中',
    },
    empty: {
      title: '暂无数据',
    },
    error: {
      title: '出了点问题',
    },
  },
  errorBoundary: {
    title: '出了点问题',
    description: '应用遇到了意外错误。你可以重试或重新加载应用。',
    retry: '重试',
  },
  home: {
    description: '一个已接入常用应用基础设施的 React Native CLI 脚手架。',
    openProfile: '打开个人资料',
    settings: '设置',
    includedFoundations: '内置基础能力',
    features: {
      typedNavigation: '类型化导航',
      zustandStores: 'Zustand 状态管理',
      tanstackQuery: 'TanStack Query',
      mmkvStorage: 'MMKV 存储',
      keychainSession: 'Keychain 会话',
      globalFeedback: '全局反馈',
      i18n: '国际化',
    },
    query: {
      finished: '模板查询已完成',
      checking: '正在检查模板',
      ready: '查询示例已就绪',
      running: '正在运行示例异步任务。',
      completedChecks_one: '已完成查询检查：{{count}}',
      completedChecks_other: '已完成查询检查：{{count}}',
      run: '运行查询示例',
    },
  },
  settings: {
    theme: {
      title: '主题',
      currentMode: '当前模式：{{mode}}',
      modes: {
        system: '跟随系统',
        light: '浅色',
        dark: '深色',
      },
      toggle: '切换主题',
    },
    language: {
      title: '语言',
      currentPreference: '当前语言：{{language}}',
      resolved: '实际语言：{{language}}',
      deviceLocale: '设备区域：{{locale}}',
      timeZone: '时区：{{timeZone}}',
      options: {
        english: '英文',
        chineseSimplified: '简体中文',
        system: '跟随设备语言',
      },
    },
    runtime: {
      title: '运行时配置',
      api: 'API：{{value}}',
      timeout: '超时：{{value}}ms',
      queryStale: '查询保鲜：{{value}}ms',
      keychain: 'Keychain：{{value}}',
    },
    storage: {
      title: '存储',
      mmkv: 'MMKV：{{value}}',
      keys: '键数量：{{value}}',
      bytes: '字节数：{{value}}',
      queryCache: '查询缓存：{{value}}',
    },
    feedback: {
      showToast: '显示 Toast',
      showLoading: '显示加载',
      preparing: '正在准备模板...',
      loadingClosed: '加载浮层已关闭',
      toastReady: '全局 Toast 已就绪',
    },
    stateSample: {
      title: '错误状态示例',
      description: '使用 StateView 展示空、加载和错误状态。',
      retry: '重试',
      retryClicked: '已点击重试',
    },
  },
  profile: {
    guest: '访客',
    guestDescription: '将此页面作为真实登录与账户界面的起点。',
    session: '会话：{{value}}',
    authenticated: '已认证',
    anonymous: '匿名会话',
    signIn: '登录',
    signOut: '退出登录',
    backHome: '返回首页',
    signedOut: '已退出登录',
    signedIn: '已使用模板账户登录',
  },
} satisfies TranslationResource;

export default zhCN;
