import React from 'react';
import {View, Text} from 'react-native';

const DefaultFallback = () => {
  return (
    <View style={{flex: 1}}>
      <Text>Something wrong</Text>
    </View>
  );
};

export default DefaultFallback;
