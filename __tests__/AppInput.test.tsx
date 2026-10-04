import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {TamaguiProvider} from 'tamagui';

import AppInput, {
  type AppInputProps,
  type AppInputRef,
} from '@/components/AppInput';
import '@/services/i18n';
import tamaguiConfig from '../tamagui.config';

describe('AppInput', () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;

  const renderInput = async (props: Partial<AppInputProps> = {}) => {
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
          <AppInput label="Password" value="password" {...props} />
        </TamaguiProvider>,
      );
    });
  };

  const nativeInput = () =>
    renderer.root.findAll(
      node =>
        typeof node.props.editable === 'boolean' &&
        typeof node.props.secureTextEntry === 'boolean',
    )[0];

  afterEach(async () => {
    await ReactTestRenderer.act(async () => renderer?.unmount());
  });

  test('supports secureTextEntry and a localized password visibility control', async () => {
    await renderInput({secureTextEntry: true});
    expect(nativeInput().props.secureTextEntry).toBe(true);

    await ReactTestRenderer.act(async () => {
      const showControl = renderer.root
        .findAllByProps({accessibilityLabel: 'Show Password'})
        .find(node => typeof node.props.onPress === 'function');
      showControl?.props.onPress();
    });

    expect(nativeInput().props.secureTextEntry).toBe(false);
    expect(
      renderer.root.findAllByProps({accessibilityLabel: 'Hide Password'})
        .length,
    ).toBeGreaterThan(0);
  });

  test.each([{editable: false}, {disabled: true}, {readOnly: true}])(
    'keeps the native field and visibility control disabled: %o',
    async props => {
      await renderInput({...props, password: true});

      expect(nativeInput().props.editable).toBe(false);
      const showControl = renderer.root
        .findAllByProps({accessibilityLabel: 'Show Password'})
        .find(node => typeof node.props.disabled === 'boolean');
      expect(showControl?.props.disabled).toBe(true);
    },
  );

  test('exposes the field label and error to screen readers', async () => {
    await renderInput({error: 'Invalid password', help: 'Enter a password'});

    expect(nativeInput().props.accessibilityLabel).toBe('Password');
    expect(nativeInput().props.accessibilityHint).toBe('Invalid password');
  });

  test('forwards focus and blur to the native field', async () => {
    const ref = React.createRef<AppInputRef>();

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
          <AppInput ref={ref} label="Email" />
        </TamaguiProvider>,
      );
    });
    const nativeField = renderer.root.findAll(
      node =>
        node.instance &&
        typeof node.instance.focus === 'function' &&
        typeof node.props.editable === 'boolean',
    )[0];
    const focus = jest.spyOn(nativeField.instance, 'focus');
    const blur = jest.spyOn(nativeField.instance, 'blur');
    focus.mockClear();
    blur.mockClear();
    ref.current?.focus();
    ref.current?.blur();

    expect(focus).toHaveBeenCalledTimes(1);
    expect(blur).toHaveBeenCalledTimes(1);
  });
});
