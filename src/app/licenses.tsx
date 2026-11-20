import { Pressable } from '../components/Touch';
import { AppText as Text } from '../components/AppText';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LineIcon } from '../components/LineIcon';
import { licenseNotices } from '../content/licenses';
import { attributionFull } from '../data/bible';
import { colors } from '../theme';

export default function Licenses() {
  return <SafeAreaView style={styles.screen}>
    <View style={styles.header}>
      <Text accessibilityRole="header" style={styles.title}>출처와 라이선스</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="읽기로 돌아가기" style={styles.close}
        onPress={() => router.canGoBack() ? router.back() : router.replace('/')}>
        <LineIcon name="close" />
      </Pressable>
    </View>
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.label}>성경 본문</Text>
      <Text selectable style={styles.paragraph}>{attributionFull}</Text>
      <Text style={styles.paragraph}>본문을 임의로 바꾸거나 다른 번역본을 섞지 않았습니다. 현재 읽기 범위는 구약·신약 66권·1,189장 (원본 절 번호 기준 31,103개 항목)입니다.</Text>
      <Text style={styles.label}>전자 데이터</Text>
      <Text style={styles.paragraph}>thiagobodruk/bible의 개역한글 데이터를 사용합니다.</Text>
      <Text selectable style={styles.license}>{licenseNotices.bible}</Text>
      <Text style={styles.label}>한글 명조 글꼴</Text>
      <Text style={styles.paragraph}>나눔명조 · SIL Open Font License 1.1</Text>
      <Text selectable style={styles.license}>{licenseNotices.font}</Text>
      <Text style={styles.label}>선 아이콘</Text>
      <Text style={styles.paragraph}>이 앱을 위해 직접 작성한 도형입니다.</Text>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 14 },
  title: { fontSize: 22, fontWeight: '700', color: colors.navy },
  close: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: 28, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: '600', color: colors.navy, marginTop: 26, marginBottom: 12 },
  paragraph: { fontSize: 13, lineHeight: 24, color: colors.muted, marginBottom: 12 },
  license: { fontSize: 11, lineHeight: 20, color: colors.muted },
});
