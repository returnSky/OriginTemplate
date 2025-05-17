import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '@/navigations/RootNavigation';

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Button} from '@react-navigation/elements';

type ProfileScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Profile'
>;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const Profile = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();

  const onPress = () => {
    navigation.navigate('Home', undefined, {pop: true});
  };

  return (
    <View style={styles.container}>
      <Text>Profile Page</Text>
      <Button onPress={onPress}>Go to Home</Button>
    </View>
  );
};

export default Profile;
