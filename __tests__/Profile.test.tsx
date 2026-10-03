import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import {AppButton} from '@/components';
import {useAuth} from '@/contexts/AuthContext';
import Profile from '@/pages/Profile';
import '@/services/i18n';

const mockShowToast = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({navigate: jest.fn()}),
}));

jest.mock('@react-navigation/elements', () => ({
  useHeaderHeight: () => 64,
}));

jest.mock('@/contexts/AuthContext', () => ({useAuth: jest.fn()}));

jest.mock('@/components/FeedbackProvider', () => ({
  useFeedback: () => ({showToast: mockShowToast}),
}));

jest.mock('@/components', () => {
  const react = require('react');
  return {
    AppButton: () => null,
    AppInput: react.forwardRef(() => null),
    Screen: ({children}: {children: React.ReactNode}) => children,
  };
});

jest.mock('tamagui', () => ({
  Circle: 'Circle',
  Text: 'Text',
  XStack: 'XStack',
  YStack: 'YStack',
}));

describe('Profile sign-in form', () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  let signIn: jest.Mock;
  let signOut: jest.Mock;

  const signInButton = () =>
    renderer.root
      .findAllByType(AppButton)
      .find(button => button.props.title === 'Sign in')!;

  const formInputs = () => [
    renderer.root.findByProps({label: 'Email'}),
    renderer.root.findByProps({label: 'Password'}),
  ];

  const setCredentials = async (email: string, password: string) => {
    await ReactTestRenderer.act(async () => {
      const inputs = formInputs();
      inputs[0].props.onChangeText(email);
      inputs[1].props.onChangeText(password);
    });
  };

  beforeEach(async () => {
    signIn = jest.fn().mockResolvedValue(undefined);
    signOut = jest.fn().mockResolvedValue(undefined);
    mockShowToast.mockReset();
    jest.mocked(useAuth).mockReturnValue({
      user: null,
      accessToken: null,
      initializing: false,
      signingIn: false,
      hydrated: true,
      isSignedIn: false,
      initialize: jest.fn(),
      signIn,
      signOut,
      invalidateSession: jest.fn(),
    });

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<Profile />);
    });
  });

  afterEach(async () => {
    await ReactTestRenderer.act(async () => renderer?.unmount());
  });

  test('shows field errors and does not sign in with missing or invalid credentials', async () => {
    await ReactTestRenderer.act(async () => {
      await signInButton().props.onPress();
    });
    expect(signIn).not.toHaveBeenCalled();
    expect(formInputs().map(input => input.props.error)).toEqual([
      'This field is required.',
      'This field is required.',
    ]);

    await setCredentials('not-an-email', 'short');
    expect(formInputs().map(input => input.props.error)).toEqual([
      'Enter a valid email address.',
      'Enter at least 8 characters.',
    ]);
  });

  test('trims the email, preserves the password and clears it after successful sign-in', async () => {
    await setCredentials(' user@example.com ', ' pass123');

    await ReactTestRenderer.act(async () => {
      await signInButton().props.onPress();
    });

    expect(signIn).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: ' pass123',
    });
    expect(formInputs()[1].props.value).toBe('');
    expect(mockShowToast).toHaveBeenCalledWith({
      message: 'Signed in',
      type: 'success',
    });
  });

  test('handles a failed sign-in and allows a later retry', async () => {
    signIn.mockRejectedValueOnce(new Error('provider failed'));
    await setCredentials('user@example.com', 'password');

    await ReactTestRenderer.act(async () => {
      await signInButton().props.onPress();
    });
    expect(mockShowToast).toHaveBeenCalledWith(
      expect.objectContaining({type: 'error'}),
    );
    expect(formInputs()[1].props.value).toBe('password');
    expect(signInButton().props.loading).toBe(false);

    await ReactTestRenderer.act(async () => {
      await signInButton().props.onPress();
    });
    expect(signIn).toHaveBeenCalledTimes(2);
  });

  test('shows global success feedback when sign-in resets and unmounts the screen', async () => {
    let finish!: () => void;
    signIn.mockImplementation(
      () => new Promise<void>(resolve => (finish = resolve)),
    );
    await setCredentials('user@example.com', 'password');
    let pendingSubmit!: Promise<void>;

    await ReactTestRenderer.act(async () => {
      pendingSubmit = signInButton().props.onPress();
    });
    await ReactTestRenderer.act(async () => renderer.unmount());
    await ReactTestRenderer.act(async () => {
      finish();
      await pendingSubmit;
    });

    expect(mockShowToast).toHaveBeenCalledWith({
      message: 'Signed in',
      type: 'success',
    });
  });

  test('shows a global error when sign-out cleanup fails after the screen unmounts', async () => {
    let failCleanup!: (error: Error) => void;
    signOut.mockImplementation(
      () => new Promise<void>((_resolve, reject) => (failCleanup = reject)),
    );
    jest.mocked(useAuth).mockReturnValue({
      user: {
        id: 'user',
        name: 'User',
        email: 'user@example.com',
      },
      accessToken: 'access-token',
      initializing: false,
      signingIn: false,
      hydrated: true,
      isSignedIn: true,
      initialize: jest.fn(),
      signIn,
      signOut,
      invalidateSession: jest.fn(),
    });

    await ReactTestRenderer.act(async () => renderer.update(<Profile />));
    let pendingSignOut!: Promise<void>;

    await ReactTestRenderer.act(async () => {
      const signOutButton = renderer.root
        .findAllByType(AppButton)
        .find(button => button.props.title === 'Sign out')!;
      pendingSignOut = signOutButton.props.onPress();
    });
    expect(signOut).toHaveBeenCalledTimes(1);

    // The auth store clears identity before awaiting secure storage cleanup.
    await ReactTestRenderer.act(async () => renderer.unmount());
    await ReactTestRenderer.act(async () => {
      failCleanup(new Error('Keychain cleanup failed'));
      await expect(pendingSignOut).resolves.toBeUndefined();
    });

    expect(mockShowToast).toHaveBeenCalledWith({
      message: 'Unable to complete sign-in or sign-out. Please try again.',
      type: 'error',
    });
    expect(mockShowToast).not.toHaveBeenCalledWith(
      expect.objectContaining({type: 'info'}),
    );
  });

  test('suppresses duplicate submits before the loading state renders', async () => {
    let finish!: () => void;
    signIn.mockImplementation(
      () => new Promise<void>(resolve => (finish = resolve)),
    );
    await setCredentials('user@example.com', 'password');
    const onPress = signInButton().props.onPress;

    await ReactTestRenderer.act(async () => {
      const first = onPress();
      const second = onPress();
      expect(signIn).toHaveBeenCalledTimes(1);
      finish();
      await Promise.all([first, second]);
    });
  });
});
