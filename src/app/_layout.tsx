import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppearanceProvider } from '../state/Appearance';
import { ReaderProvider } from '../state/ReaderState';
import { colors } from '../theme';

export default function RootLayout() {
  const [loaded, error] = useFonts({
    NanumMyeongjo: require('../../assets/fonts/NanumMyeongjo-Regular.ttf'),
  });
  if (!loaded) return <View style={{ flex: 1, backgroundColor: colors.paper, justifyContent: 'center', alignItems: 'center' }}>
    {error ? <Text>글꼴을 불러오지 못했습니다. 앱을 다시 열어 주세요.</Text>
      : <ActivityIndicator accessibilityLabel="화면 준비 중" color={colors.navy} />}
  </View>;

  return <SafeAreaProvider>
    <StatusBar style="dark" />
    <AppearanceProvider><ReaderProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="licenses" />
        <Stack.Screen name="privacy" />
        <Stack.Screen name="account" />
        <Stack.Screen name="account-test" />
        <Stack.Screen name="support" />
        <Stack.Screen name="delete-account" />
      </Stack>
    </ReaderProvider></AppearanceProvider>
  </SafeAreaProvider>;
}
