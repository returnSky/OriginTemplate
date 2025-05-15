import React, {useEffect, useState} from 'react';
import type {PropsWithChildren} from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';

import {
  Colors,
  DebugInstructions,
  Header,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';

import AppErrorBoundary from '@/components/AppErrorBoundary';
import RootNavigation from '@/navigations/RootNavigation';

type SectionProps = PropsWithChildren<{
  title: string;
  hasError?: boolean;
}>;

function Section({
  // children,
  title,
  hasError = false,
}: SectionProps): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  if (hasError) {
    throw new Error('This is an error');
  }

  return (
    <View style={styles.sectionContainer}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: isDarkMode ? Colors.white : Colors.black,
          },
        ]}>
        {title}
      </Text>
      {/* <Text
        style={[
          styles.sectionDescription,
          {
            color: isDarkMode ? Colors.light : Colors.dark,
          },
        ]}>
        {children}
      </Text> */}
    </View>
  );
}

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  /*
   * To keep the template simple and small we're adding padding to prevent view
   * from rendering under the System UI.
   * For bigger apps the recommendation is to use `react-native-safe-area-context`:
   * https://github.com/AppAndFlow/react-native-safe-area-context
   *
   * You can read more about it here:
   * https://github.com/react-native-community/discussions-and-proposals/discussions/827
   */
  const safePadding = '5%';

  // const [isShow, setIsShow] = useState(false);

  // useEffect(() => {
  //   setTimeout(() => {
  //     setIsShow(true);
  //   }, 1000);
  // }, []);

  // if (isShow) {
  //   return (
  //     <SafeAreaView>
  //       <Text>Test World</Text>
  //     </SafeAreaView>
  //   );
  // }

  return (
    <SafeAreaProvider>
      <AppErrorBoundary>
        <RootNavigation />
      </AppErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default App;
