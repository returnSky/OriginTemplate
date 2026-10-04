import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '@/navigations/RootNavigation';

import React, {useMemo, useState} from 'react';
import {StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useQuery} from '@tanstack/react-query';
import {useTranslation} from 'react-i18next';
import {Circle, Text, XStack, YStack} from 'tamagui';

import {AppButton, Screen, StateView} from '@/components';
import {useFeedback} from '@/components/FeedbackProvider';
import {appConfig} from '@/config';
import {queryKeys} from '@/services/query';

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;

const Home = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const {showToast} = useFeedback();
  const {t} = useTranslation();
  const [requestCount, setRequestCount] = useState(0);

  const templateQuery = useQuery({
    queryKey: queryKeys.template.health,
    enabled: false,
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 650));

      return {
        message: t('home.query.finished'),
        checkedAt: new Date().toISOString(),
      };
    },
  });

  const features = useMemo(
    () => [
      t('home.features.typedNavigation'),
      t('home.features.zustandStores'),
      t('home.features.tanstackQuery'),
      t('home.features.mmkvStorage'),
      t('home.features.keychainSession'),
      t('home.features.globalFeedback'),
      t('home.features.i18n'),
    ],
    [t],
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
      <YStack
        borderWidth={1}
        borderRadius={8}
        padding={18}
        backgroundColor="$surface"
        borderColor="$borderColor">
        <Text color="$primary" fontSize={12} fontWeight="800" lineHeight={16}>
          {appConfig.env.toUpperCase()}
        </Text>
        <Text
          marginTop={8}
          color="$color"
          fontSize={28}
          fontWeight="800"
          lineHeight={36}>
          {appConfig.appName}
        </Text>
        <Text marginTop={8} color="$colorMuted" fontSize={16} lineHeight={24}>
          {t('home.description')}
        </Text>
      </YStack>

      <XStack gap={12} marginTop={16}>
        <AppButton
          title={t('home.openProfile')}
          onPress={() => navigation.navigate('Profile')}
          style={styles.actionButton}
        />
        <AppButton
          title={t('home.settings')}
          variant="secondary"
          onPress={() => navigation.navigate('Settings')}
          style={styles.actionButton}
        />
      </XStack>

      <YStack
        marginTop={16}
        borderWidth={1}
        borderRadius={8}
        padding={16}
        backgroundColor="$surface"
        borderColor="$borderColor">
        <Text
          marginBottom={10}
          color="$color"
          fontSize={17}
          fontWeight="700"
          lineHeight={24}>
          {t('home.includedFoundations')}
        </Text>
        {features.map(feature => (
          <XStack key={feature} alignItems="center" paddingVertical={6}>
            <Circle size={8} marginRight={10} backgroundColor="$success" />
            <Text flex={1} color="$color" fontSize={15} lineHeight={22}>
              {feature}
            </Text>
          </XStack>
        ))}
      </YStack>

      <YStack marginTop={16}>
        <StateView
          variant={templateQuery.isFetching ? 'loading' : 'empty'}
          title={
            templateQuery.isFetching
              ? t('home.query.checking')
              : t('home.query.ready')
          }
          description={
            templateQuery.isFetching
              ? t('home.query.running')
              : t('home.query.completedChecks', {count: requestCount})
          }
          actionLabel={
            templateQuery.isFetching ? undefined : t('home.query.run')
          }
          onAction={handleRefresh}
        />
      </YStack>
    </Screen>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    flex: 1,
  },
});

export default Home;
