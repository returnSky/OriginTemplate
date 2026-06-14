import React from 'react';
import {StatusBar} from 'react-native';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';

import {useAppTheme} from '@/contexts/ThemeContext';
import Home from '@/pages/Home';
import Profile from '@/pages/Profile';
import Settings from '@/pages/Settings';

export type RootStackParamList = {
  Home: undefined;
  Profile: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootStack = () => {
  const {theme} = useAppTheme();
  const {t} = useTranslation();

  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: {backgroundColor: theme.colors.surface},
        headerTintColor: theme.colors.text,
        headerTitleStyle: {fontWeight: '700'},
        contentStyle: {backgroundColor: theme.colors.background},
      }}>
      <Stack.Screen
        name="Home"
        component={Home}
        options={{title: t('navigation.template')}}
      />
      <Stack.Screen
        name="Profile"
        component={Profile}
        options={{title: t('navigation.profile')}}
      />
      <Stack.Screen
        name="Settings"
        component={Settings}
        options={{title: t('navigation.settings')}}
      />
    </Stack.Navigator>
  );
};

const RootNavigation = () => {
  const {theme, isDark} = useAppTheme();
  const baseTheme = isDark ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.danger,
    },
  };

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.surface}
      />
      <NavigationContainer theme={navigationTheme}>
        <RootStack />
      </NavigationContainer>
    </>
  );
};

export default RootNavigation;
