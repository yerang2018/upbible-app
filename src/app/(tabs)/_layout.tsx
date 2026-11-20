import { Pressable } from '../../components/Touch';
import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LineIcon } from '../../components/LineIcon';
import { useAppearance } from '../../state/Appearance';
import { useReader } from '../../state/ReaderState';
import { colors } from '../../theme';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { background } = useAppearance();
  const reader = useReader();
  if (Platform.OS !== 'web' && !reader.ready) return <View style={{ flex: 1, backgroundColor: background, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator accessibilityLabel="로그인 상태 확인 중" color={colors.navy} />
  </View>;
  if (Platform.OS !== 'web' && !reader.userId) return <Redirect href="/login" />;

  return <Tabs screenOptions={{
    headerShown: false,
    tabBarActiveTintColor: colors.navy,
    tabBarInactiveTintColor: colors.faint,
    tabBarLabelPosition: 'below-icon',
    tabBarAllowFontScaling: false,
    tabBarButton: ({ href, pressOpacity, hoverEffect, ref, ...props }) => <Pressable {...props} />,
    tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 4 },
    tabBarStyle: {
      backgroundColor: background, borderTopColor: colors.line, elevation: 0,
      height: 62 + Math.max(insets.bottom, 12),
      paddingTop: 10, paddingBottom: Math.max(insets.bottom, 12),
    },
  }}>
    <Tabs.Screen name="index" options={{ title: '쇼츠', tabBarAccessibilityLabel: '쇼츠 탭',
      tabBarIcon: ({ focused }) => <LineIcon name="shorts" size={25} color={focused ? colors.navy : colors.faint} filled={focused} />,
    }} />
    <Tabs.Screen name="my" options={{ title: 'MY', tabBarAccessibilityLabel: 'MY 탭',
      tabBarIcon: ({ focused }) => <LineIcon name="person" size={25} color={focused ? colors.navy : colors.faint} filled={focused} />,
    }} />
  </Tabs>;
}
