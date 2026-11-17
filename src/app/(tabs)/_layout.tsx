import { Pressable } from '../../components/Touch';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LineIcon } from '../../components/LineIcon';
import { useAppearance } from '../../state/Appearance';
import { colors } from '../../theme';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { background } = useAppearance();
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
