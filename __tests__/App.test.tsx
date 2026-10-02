/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import App from '../src/App';
import {AppButton} from '@/components';
import Home from '@/pages/Home';
import {queryClient} from '@/services/query';

jest.mock('react-native-safe-area-context', () => {
  return require('react-native-safe-area-context/jest/mock').default;
});

test('renders the home screen with translated navigation actions', async () => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;

  try {
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<App />);
    });

    const home = renderer.root.findByType(Home);
    const actionTitles = home
      .findAllByType(AppButton)
      .map(button => button.props.title);

    expect(actionTitles).toEqual(
      expect.arrayContaining(['Open Profile', 'Settings']),
    );
  } finally {
    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
    queryClient.clear();
  }
});
