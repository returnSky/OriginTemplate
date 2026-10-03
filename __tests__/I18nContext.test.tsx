import React from 'react';
import {AppState, Text, type AppStateStatus} from 'react-native';
import {act, create, type ReactTestRenderer} from 'react-test-renderer';

import {I18nProvider} from '@/contexts/I18nContext';
import {changeAppLanguage} from '@/services/i18n';
import {usePreferencesStore} from '@/stores/preferencesStore';

jest.mock('@/services/i18n', () => ({
  __esModule: true,
  default: {on: jest.fn(), off: jest.fn()},
  changeAppLanguage: jest.fn().mockResolvedValue('en-US'),
}));

test('refreshes the system language on app resume and cleans up its listener', async () => {
  let listener!: (status: AppStateStatus) => void;
  const remove = jest.fn();
  const subscription = jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((_event, handler) => {
      listener = handler;
      return {remove};
    });
  let renderer: ReactTestRenderer | undefined;
  usePreferencesStore.getState().setLanguage('system');

  try {
    await act(async () => {
      renderer = create(
        <I18nProvider>
          <Text>Language</Text>
        </I18nProvider>,
      );
    });
    expect(changeAppLanguage).toHaveBeenCalledWith('system');
    jest.mocked(changeAppLanguage).mockClear();
    await act(async () => listener('background'));
    expect(changeAppLanguage).not.toHaveBeenCalled();
    await act(async () => listener('active'));
    expect(changeAppLanguage).toHaveBeenCalledWith('system');
    await act(async () => renderer?.unmount());
    expect(remove).toHaveBeenCalledTimes(1);
  } finally {
    subscription.mockRestore();
    usePreferencesStore.getState().resetPreferences();
  }
});
