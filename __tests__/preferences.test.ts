import {appConfig} from '@/config';
import {syncStringStorage} from '@/services/storage';
import {usePreferencesStore} from '@/stores/preferencesStore';

afterEach(() => {
  usePreferencesStore.getState().resetPreferences();
});

test('restores valid preferences from the previous store version', async () => {
  syncStringStorage.setItem(
    appConfig.storage.keys.preferencesStore,
    JSON.stringify({
      state: {themeMode: 'dark', language: 'zh-CN'},
      version: 0,
    }),
  );
  await usePreferencesStore.persist.rehydrate();
  expect(usePreferencesStore.getState()).toMatchObject({
    themeMode: 'dark',
    language: 'zh-CN',
  });
});

test('rejects malformed persisted values and preserves callable actions', async () => {
  syncStringStorage.setItem(
    appConfig.storage.keys.preferencesStore,
    JSON.stringify({
      state: {
        themeMode: 'unexpected',
        language: {value: 'zh-CN'},
        setLanguage: 'corrupted',
      },
      version: 1,
    }),
  );
  await usePreferencesStore.persist.rehydrate();
  expect(usePreferencesStore.getState()).toMatchObject({
    themeMode: 'system',
    language: 'en-US',
    setLanguage: expect.any(Function),
  });
});
