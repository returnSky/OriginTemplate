import React from 'react';
import {act, create, type ReactTestRenderer} from 'react-test-renderer';

import App from '@/App';
import {AppButton} from '@/components';
import Home from '@/pages/Home';
import Profile from '@/pages/Profile';
import {queryClient} from '@/services/query';
import {useAuthStore} from '@/stores/authStore';

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

test('resets screen history when the signed-in identity changes', async () => {
  let renderer: ReactTestRenderer | undefined;
  useAuthStore.setState({
    user: null,
    accessToken: null,
    initializing: false,
    hydrated: true,
  });

  try {
    await act(async () => {
      renderer = create(<App />);
    });
    const openProfile = () =>
      renderer!.root
        .findByType(Home)
        .findAllByType(AppButton)
        .find(button => button.props.title === 'Open Profile')!
        .props.onPress();

    await act(async () => openProfile());
    expect(renderer!.root.findAllByType(Profile)).toHaveLength(1);

    await act(async () => {
      useAuthStore.setState({
        user: {id: 'user-a', name: 'User A', email: 'a@example.com'},
        accessToken: 'test-session-a',
      });
    });
    expect(renderer!.root.findAllByType(Home)).toHaveLength(1);
    expect(renderer!.root.findAllByType(Profile)).toHaveLength(0);

    await act(async () => openProfile());
    expect(renderer!.root.findAllByType(Profile)).toHaveLength(1);

    await act(async () => {
      useAuthStore.setState({user: null, accessToken: null});
    });
    expect(renderer!.root.findAllByType(Home)).toHaveLength(1);
    expect(renderer!.root.findAllByType(Profile)).toHaveLength(0);
  } finally {
    await act(async () => renderer?.unmount());
    useAuthStore.setState({user: null, accessToken: null});
    queryClient.clear();
  }
});
