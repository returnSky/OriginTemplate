import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '@/navigations/RootNavigation';

import React, {useEffect, useRef, useState} from 'react';
import {Keyboard} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useHeaderHeight} from '@react-navigation/elements';
import {useTranslation} from 'react-i18next';
import {Circle, Text, XStack, YStack} from 'tamagui';

import {AppButton, AppInput, Screen} from '@/components';
import {useFeedback} from '@/components/FeedbackProvider';
import {appConfig} from '@/config';
import {useAuth} from '@/contexts/AuthContext';
import {useAsyncTask} from '@/hooks';
import {
  email as emailRule,
  minLength,
  required,
  validate,
} from '@/utils/validation';

type ProfileScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Profile'
>;

const Profile = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const headerHeight = useHeaderHeight();
  const {showToast} = useFeedback();
  const {user, isSignedIn, signIn, signOut, initializing, signingIn} =
    useAuth();
  const {t} = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const passwordInput = useRef<React.ComponentRef<typeof AppInput>>(null);
  const submitting = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  const emailError = validate(email, [
    required(t('forms.required')),
    emailRule(t('forms.invalidEmail')),
  ]);
  const passwordError = validate(password, [
    required(t('forms.required')),
    minLength(8, t('forms.minLength', {count: 8})),
  ]);

  const authTask = useAsyncTask(async () => {
    if (isSignedIn) {
      await signOut();
    } else {
      await signIn({email: email.trim(), password});
    }
  });
  const busy = initializing || signingIn || authTask.loading;

  const handleAuthPress = async () => {
    if (initializing || signingIn || submitting.current) {
      return;
    }

    if (!isSignedIn) {
      setSubmitted(true);

      if (emailError || passwordError) {
        return;
      }
    }

    submitting.current = true;
    Keyboard.dismiss();

    try {
      await authTask.run();

      if (mounted.current) {
        setPassword('');
        setSubmitted(false);
      }

      showToast({
        message: t(isSignedIn ? 'profile.signedOut' : 'profile.signedIn'),
        type: isSignedIn ? 'info' : 'success',
      });
    } catch {
      showToast({message: t('profile.authFailed'), type: 'error'});
    } finally {
      submitting.current = false;
    }
  };

  return (
    <Screen scroll keyboardAvoiding keyboardVerticalOffset={headerHeight}>
      <YStack
        borderWidth={1}
        borderRadius={8}
        padding={18}
        backgroundColor="$surface"
        borderColor="$borderColor">
        <Text color="$color" fontSize={24} fontWeight="800" lineHeight={32}>
          {isSignedIn ? user?.name : t('profile.guest')}
        </Text>
        <Text marginTop={8} color="$colorMuted" fontSize={15} lineHeight={22}>
          {isSignedIn ? user?.email : t('profile.guestDescription')}
        </Text>
        <XStack alignItems="center" marginTop={18}>
          <Circle
            size={10}
            marginRight={8}
            backgroundColor={isSignedIn ? '$success' : '$warning'}
          />
          <Text
            color="$colorMuted"
            fontSize={14}
            fontWeight="700"
            lineHeight={20}>
            {isSignedIn ? t('profile.authenticated') : t('profile.anonymous')}
          </Text>
        </XStack>
      </YStack>

      {!isSignedIn ? (
        <YStack gap={16} marginTop={16}>
          <Text color="$colorMuted" fontSize={14} lineHeight={20}>
            {t(
              appConfig.auth.mode === 'demo'
                ? 'profile.demoDescription'
                : 'profile.adapterDescription',
            )}
          </Text>
          <AppInput
            label={t('profile.email')}
            value={email}
            onChangeText={setEmail}
            placeholder={t('profile.emailPlaceholder')}
            error={submitted ? emailError : undefined}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => passwordInput.current?.focus()}
            editable={!busy}
          />
          <AppInput
            ref={passwordInput}
            label={t('profile.password')}
            value={password}
            onChangeText={setPassword}
            help={t('profile.passwordHelp')}
            error={submitted ? passwordError : undefined}
            password
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="done"
            onSubmitEditing={handleAuthPress}
            editable={!busy}
          />
        </YStack>
      ) : null}

      <YStack gap={12} marginTop={16}>
        <AppButton
          title={isSignedIn ? t('profile.signOut') : t('profile.signIn')}
          loading={busy}
          variant={isSignedIn ? 'danger' : 'primary'}
          onPress={handleAuthPress}
        />
        <AppButton
          title={t('profile.backHome')}
          variant="secondary"
          onPress={() => navigation.navigate('Home')}
        />
      </YStack>
    </Screen>
  );
};

export default Profile;
