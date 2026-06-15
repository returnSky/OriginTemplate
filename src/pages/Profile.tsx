import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '@/navigations/RootNavigation';

import React from 'react';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {Circle, Text, XStack, YStack} from 'tamagui';

import {AppButton, Screen} from '@/components';
import {useFeedback} from '@/components/FeedbackProvider';
import {appConfig} from '@/config';
import {useAuth} from '@/contexts/AuthContext';

type ProfileScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Profile'
>;

const Profile = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const {showToast} = useFeedback();
  const {user, isSignedIn, signIn, signOut, initializing} = useAuth();
  const {t} = useTranslation();

  const handleAuthPress = async () => {
    if (isSignedIn) {
      await signOut();
      showToast({message: t('profile.signedOut'), type: 'info'});
      return;
    }

    await signIn({
      email: 'template@example.com',
      password: 'password',
    });
    showToast({message: t('profile.signedIn'), type: 'success'});
  };

  return (
    <Screen>
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
        {isSignedIn ? (
          <Text
            marginTop={10}
            color="$colorMuted"
            fontSize={13}
            lineHeight={18}>
            {t('profile.session', {value: appConfig.auth.keychainService})}
          </Text>
        ) : null}
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

      <YStack gap={12} marginTop={16}>
        <AppButton
          title={isSignedIn ? t('profile.signOut') : t('profile.signIn')}
          loading={initializing}
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
