import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText as Text } from '../components/AppText';
import { Pressable } from '../components/Touch';
import { backgrounds, useAppearance } from '../state/Appearance';
import { colors } from '../theme';
export default function Settings() {
  const { background, setBackground, ready, error } = useAppearance();
  return <SafeAreaView style={{ flex: 1, backgroundColor: background }}>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}><Text style={styles.title}>설정</Text><Pressable accessibilityRole="button" onPress={() => router.canGoBack() ? router.back() : router.replace('/my')} style={styles.close}><Text>닫기</Text></Pressable></View>
      <Text style={styles.heading}>읽기 배경</Text>
      <Text style={styles.body}>쇼츠와 MY 화면의 배경을 선택하세요.</Text>
      <View style={styles.grid}>{backgrounds.map(item => <Pressable key={item.color} disabled={!ready} accessibilityRole="button" accessibilityLabel={`${item.name} 배경`} accessibilityState={{ selected: background === item.color }} onPress={() => setBackground(item.color)} style={[styles.swatch, { backgroundColor: item.color, borderColor: background === item.color ? colors.navy : colors.line }]}><Text>{item.name}{background === item.color ? ' ✓' : ''}</Text></Pressable>)}</View>
      {error && <Text role="alert">배경 설정을 저장하지 못했습니다. 저장 공간을 확인해 주세요.</Text>}
      <Text style={styles.heading}>성경 본문 크기</Text>
      <Text style={styles.body}>성경 읽기 화면 왼쪽 위의 ‘가가가’에서 본문을 보며 바로 조절하세요. 버튼과 메뉴 크기는 유지됩니다.</Text>
      <Pressable accessibilityRole="button" onPress={() => router.navigate('/')} style={styles.readButton}><Text style={{ color: colors.navy }}>성경 읽으며 크기 조절하기 →</Text></Pressable>
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  content: { padding: 24, gap: 18, maxWidth: 680, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 26, fontWeight: '700', color: colors.navy }, close: { padding: 14 },
  heading: { fontSize: 18, color: colors.navy, fontWeight: '600', marginTop: 22 },
  body: { fontSize: 14, lineHeight: 23, color: colors.muted },
  readButton: { padding: 18, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 18, borderWidth: 1, borderColor: colors.line },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  swatch: { width: '46%', minHeight: 84, borderRadius: 20, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
});
