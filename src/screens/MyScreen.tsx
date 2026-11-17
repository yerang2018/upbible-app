import { useAppearance } from '../state/Appearance';
import { Pressable } from '../components/Touch';
import { AppText as Text } from '../components/AppText';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LineIcon } from '../components/LineIcon';
import { attribution, bible } from '../data/bible';
import { isInReadingScope } from '../data/reading-scope';
import { reference } from '../domain/bible-model';
import type { Verse } from '../domain/bible-model';
import { useReader } from '../state/ReaderState';
import { colors, serif } from '../theme';

export default function MyScreen() {
  const reader = useReader();
  const { background } = useAppearance();
  const [category, setCategory] = useState<'saved' | 'liked'>('saved');
  const savedIds = reader.bookmarks.filter(isInReadingScope);
  const likedIds = reader.likes.filter(isInReadingScope);
  const firstUse = savedIds.length === 0 && likedIds.length === 0;
  const ids = category === 'saved' ? savedIds : likedIds;
  const verses = [...ids].reverse().map(id => bible.find(id)).filter((item): item is Verse => Boolean(item));

  return <SafeAreaView edges={['top', 'left', 'right']} style={[styles.screen, { backgroundColor: background }]}>
    <View style={styles.header}>
      <Text accessibilityRole="header" style={styles.title}>MY</Text>
      <Link href="/settings" asChild><Pressable accessibilityRole="button" accessibilityLabel="설정 열기" style={{ position: 'absolute', right: 24, top: 24, padding: 12 }}><LineIcon name="settings" size={25} /></Pressable></Link>
      <Text style={styles.subtitle}>내 말씀</Text>
    </View>
    <View style={styles.filters}>
      <Pressable accessibilityRole="button" accessibilityLabel="저장한 말씀 보기" accessibilityState={{ selected: category === 'saved' }}
        onPress={() => setCategory('saved')} style={[styles.filter, category === 'saved' && styles.selected]}>
        <LineIcon name="bookmark" size={17} filled={category === 'saved'} />
        <Text style={styles.filterText}>저장 {savedIds.length}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="좋아요한 말씀 보기" accessibilityState={{ selected: category === 'liked' }}
        onPress={() => setCategory('liked')} style={[styles.filter, category === 'liked' && styles.selected]}>
        <LineIcon name="heart" size={17} filled={category === 'liked'} />
        <Text style={styles.filterText}>좋아요 {likedIds.length}</Text>
      </Pressable>
    </View>
    {!reader.ready ? <ActivityIndicator color={colors.navy} />
      : <FlatList data={verses} keyExtractor={item => item.id} contentContainerStyle={styles.list}
        ListFooterComponent={<View style={styles.footer}>
          {([{ href: '/account', label: '내 계정' }, { href: '/privacy', label: '개인정보' }, { href: '/support', label: '문의' }, { href: '/licenses', label: '라이선스' }] as const).map(item => <Link key={item.href} href={item.href} asChild><Pressable accessibilityRole="link" style={styles.license}><Text style={styles.licenseText}>{item.label}</Text></Pressable></Link>)}
        </View>}
        ListEmptyComponent={<View style={styles.empty}>
          <View style={styles.emptyIllustration}><LineIcon name={firstUse ? 'book' : category === 'saved' ? 'bookmark' : 'heart'} size={44} color={colors.navy} /></View>
          <Text style={styles.emptyTitle}>{firstUse ? '아직 담아 둔 말씀이 없어요' : category === 'saved' ? '저장한 말씀이 아직 없어요' : '좋아요한 말씀이 아직 없어요'}</Text>
          <Text style={styles.emptyHint}>{firstUse ? '읽다가 기억하고 싶은 구절을 저장해 보세요.' : category === 'saved' ? '다시 읽고 싶은 말씀에 책갈피를 눌러 주세요.' : '마음에 닿은 말씀에 하트를 눌러 주세요.'}</Text>
          <Pressable accessibilityRole="button" onPress={() => router.navigate('/')} style={styles.emptyButton}><Text style={styles.emptyButtonText}>성경 읽기</Text></Pressable>
        </View>}
        renderItem={({ item }) => <View style={styles.row}>
          <Pressable style={styles.rowBody} accessibilityRole="button" accessibilityLabel={`${reference(item)} 읽기`}
            onPress={() => { reader.setPosition(item.id); router.navigate('/'); }}>
            <Text style={styles.reference}>{reference(item)}</Text>
            <Text style={styles.verse}>{item.text}</Text>
            <Text style={styles.source}>{attribution}</Text>
          </Pressable>
          <Pressable style={styles.remove} accessibilityRole="button"
            accessibilityLabel={`${reference(item)} ${category === 'saved' ? '저장' : '좋아요'} 취소`}
            onPress={() => category === 'saved' ? reader.toggleBookmark(item.id) : reader.toggleLike(item.id)}>
            <LineIcon name={category === 'saved' ? 'bookmark' : 'heart'} size={20} filled />
          </Pressable>
        </View>}
      />}
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  header: { paddingHorizontal: 26, paddingTop: 25, paddingBottom: 22 },
  title: { fontSize: 28, fontWeight: '700', color: colors.navy },
  subtitle: { fontSize: 13, color: colors.muted, marginTop: 8 },
  filters: { flexDirection: 'row', paddingHorizontal: 24, gap: 12, marginBottom: 20 },
  filter: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, minHeight: 44, borderRadius: 24, borderColor: colors.line, borderWidth: 1 },
  selected: { backgroundColor: '#EAE4D8', borderColor: '#D8CFBE' },
  filterText: { fontSize: 13, color: colors.navy },
  list: { paddingHorizontal: 24, paddingBottom: 20, flexGrow: 1 },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderColor: colors.line, paddingVertical: 22 },
  rowBody: { flex: 1 },
  reference: { fontFamily: serif, fontSize: 19, color: colors.navy, marginBottom: 14 },
  verse: { fontFamily: serif, fontSize: 16, lineHeight: 29, color: colors.navy },
  source: { fontSize: 9, color: colors.faint, marginTop: 18 },
  remove: { width: 36, height: 44, alignItems: 'flex-end', justifyContent: 'center', marginLeft: 10 },
  empty: { flexGrow: 1, minHeight: 310, alignItems: 'center', justifyContent: 'center', paddingVertical: 28, gap: 18 },
  emptyIllustration: { width: 68, height: 68, borderRadius: 34, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  emptyButton: { paddingHorizontal: 24, minHeight: 48, borderRadius: 24, backgroundColor: colors.navy, justifyContent: 'center', marginTop: 4 },
  emptyButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  emptyTitle: { fontSize: 17, color: colors.navy, textAlign: 'center' },
  emptyHint: { fontSize: 13, lineHeight: 22, color: colors.muted, textAlign: 'center' },
  footer: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', paddingTop: 40, marginTop: 'auto' },
  license: { alignItems: 'center', justifyContent: 'center', minHeight: 44, paddingHorizontal: 10 },
  licenseText: { color: colors.muted, fontSize: 10 },
});
