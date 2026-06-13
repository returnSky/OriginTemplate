import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '@/navigations/RootNavigation';

import React, {useMemo, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useQuery} from '@tanstack/react-query';

import {AppButton, Screen, StateView} from '@/components';
import {useFeedback} from '@/components/FeedbackProvider';
import {appConfig} from '@/config';
import {useAppTheme} from '@/contexts/ThemeContext';
import {queryKeys} from '@/services/query';

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;

const Home = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const {showToast} = useFeedback();
  const {theme} = useAppTheme();
  const [requestCount, setRequestCount] = useState(0);

  const templateQuery = useQuery({
    queryKey: queryKeys.template.health,
    enabled: false,
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 650));

      return {
        message: 'Template query finished',
        checkedAt: new Date().toISOString(),
      };
    },
  });

  const features = useMemo(
    () => [
      'Typed navigation',
      'Zustand stores',
      'TanStack Query',
      'MMKV storage',
      'Keychain session',
      'Global feedback',
    ],
    [],
  );

  const handleRefresh = async () => {
    const result = await templateQuery.refetch();

    if (result.data) {
      setRequestCount(current => current + 1);
      showToast({message: result.data.message, type: 'success'});
    }
  };

  return (
    <Screen scroll>
      <View
        style={[
          styles.hero,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}>
        <Text style={[styles.kicker, {color: theme.colors.primary}]}>
          {appConfig.env.toUpperCase()}
        </Text>
        <Text style={[styles.title, {color: theme.colors.text}]}>
          {appConfig.appName}
        </Text>
        <Text style={[styles.description, {color: theme.colors.textMuted}]}>
          A React Native CLI scaffold with common app foundations wired in.
        </Text>
      </View>

      <View style={styles.actions}>
        <AppButton
          title="Open Profile"
          onPress={() => navigation.navigate('Profile')}
        />
        <AppButton
          title="Settings"
          variant="secondary"
          onPress={() => navigation.navigate('Settings')}
        />
      </View>

      <View
        style={[
          styles.section,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}>
        <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
          Included foundations
        </Text>
        {features.map(feature => (
          <View key={feature} style={styles.featureRow}>
            <View
              style={[styles.dot, {backgroundColor: theme.colors.success}]}
            />
            <Text style={[styles.featureText, {color: theme.colors.text}]}>
              {feature}
            </Text>
          </View>
        ))}
      </View>

      <StateView
        variant={templateQuery.isFetching ? 'loading' : 'empty'}
        title={
          templateQuery.isFetching ? 'Checking template' : 'Query sample ready'
        }
        description={
          templateQuery.isFetching
            ? 'Running a sample async task.'
            : `Completed query checks: ${requestCount}`
        }
        actionLabel={templateQuery.isFetching ? undefined : 'Run query sample'}
        onAction={handleRefresh}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  hero: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 18,
  },
  kicker: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  title: {
    marginTop: 8,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '800',
  },
  description: {
    marginTop: 8,
    fontSize: 16,
    lineHeight: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  section: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 10,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '700',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  featureText: {
    fontSize: 15,
    lineHeight: 22,
  },
});

export default Home;
