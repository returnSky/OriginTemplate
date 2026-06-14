import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '@/navigations/RootNavigation';

import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';

import {AppButton, Screen} from '@/components';
import {useFeedback} from '@/components/FeedbackProvider';
import {appConfig} from '@/config';
import {useAuth} from '@/contexts/AuthContext';
import {useAppTheme} from '@/contexts/ThemeContext';

type ProfileScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Profile'
>;

const Profile = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const {theme} = useAppTheme();
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
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}>
        <Text style={[styles.title, {color: theme.colors.text}]}>
          {isSignedIn ? user?.name : t('profile.guest')}
        </Text>
        <Text style={[styles.description, {color: theme.colors.textMuted}]}>
          {isSignedIn ? user?.email : t('profile.guestDescription')}
        </Text>
        {isSignedIn ? (
          <Text style={[styles.meta, {color: theme.colors.textMuted}]}>
            {t('profile.session', {value: appConfig.auth.keychainService})}
          </Text>
        ) : null}
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: isSignedIn
                  ? theme.colors.success
                  : theme.colors.warning,
              },
            ]}
          />
          <Text style={[styles.statusText, {color: theme.colors.textMuted}]}>
            {isSignedIn ? t('profile.authenticated') : t('profile.anonymous')}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
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
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 18,
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '800',
  },
  description: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
  },
  meta: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  actions: {
    gap: 12,
    marginTop: 16,
  },
});

export default Profile;
