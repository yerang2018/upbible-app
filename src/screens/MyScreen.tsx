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
import { colors } from '../theme';

export default function MyScreen() {
  const reader = useReader();
  const { background } = useAppearance();
  const [category, setCategory] = useState<'saved' | 'liked'>('saved');
  const savedIds = reader.bookmarks.filter(isInReadingScope);
  const likedIds = reader.likes.filter(isInReadingScope);
  const ids = category === 'saved' ? savedIds : likedIds;
  const verses = [...ids].reverse().map(id => bible.find(id)).filter((item): item is Verse => Boolean(item));

  return <SafeAreaView edges={['top', 'left', 'right']} style={[styles.screen, { backgroundColor: background }]}>
    <View style={styles.header}>
      <Text accessibilityRole="header" style={styles.title}>내 말씀</Text>
      <View style={styles.headerActions}>
        <Link href="/account" asChild>
          <Pressable accessibilityRole="button" accessibilityLabel="내 계정 열기" style={styles.headerAction}>
            <LineIcon name="person" size={22} />
          </Pressable>
        </Link>
        <Link href="/settings" asChild>
          <Pressable accessibilityRole="button" accessibilityLabel="설정 열기" style={styles.headerAction}>
            <LineIcon name="settings" size={22} />
          </Pressable>
        </Link>
      </View>
    </View>

    <View style={styles.filters}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`저장한 말씀 ${savedIds.length}개 보기`}
        accessibilityState={{ selected: category === 'saved' }}
        onPress={() => setCategory('saved')}
        style={[styles.filter, category === 'saved' && styles.activeFilter]}
      >
        <Text style={[styles.filterText, category === 'saved' && styles.activeFilterText]}>저장</Text>
        <Text style={[styles.filterCount, category === 'saved' && styles.activeFilterText]}>{savedIds.length}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`좋아요한 말씀 ${likedIds.length}개 보기`}
        accessibilityState={{ selected: category === 'liked' }}
        onPress={() => setCategory('liked')}
        style={[styles.filter, category === 'liked' && styles.activeFilter]}
      >
        <Text style={[styles.filterText, category === 'liked' && styles.activeFilterText]}>좋아요</Text>
        <Text style={[styles.filterCount, category === 'liked' && styles.activeFilterText]}>{likedIds.length}</Text>
      </Pressable>
    </View>

    {!reader.ready
      ? <View style={styles.loading}><ActivityIndicator color={colors.navy} /></View>
      : <FlatList
        style={styles.listViewport}
        data={verses}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<View style={styles.empty}>
          <Text style={styles.emptyTitle}>{category === 'saved' ? '저장한 말씀이 아직 없습니다.' : '좋아요한 말씀이 아직 없습니다.'}</Text>
          <Pressable accessibilityRole="button" onPress={() => router.navigate('/')} style={styles.emptyAction}>
            <Text style={styles.emptyActionText}>말씀 읽기 →</Text>
          </Pressable>
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
            <LineIcon name={category === 'saved' ? 'bookmark' : 'heart'} size={19} filled />
          </Pressable>
        </View>}
      />}

    <View style={styles.footer}>
      {([{ href: '/privacy', label: '개인정보' }, { href: '/support', label: '문의' }, { href: '/licenses', label: '라이선스' }] as const).map(item =>
        <Link key={item.href} href={item.href} asChild>
          <Pressable accessibilityRole="link" style={styles.footerLink}>
            <Text style={styles.footerText}>{item.label}</Text>
          </Pressable>
        </Link>)}
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 18, paddingBottom: 12 },
  title: { fontSize: 25, fontWeight: '700', color: colors.navy },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  headerAction: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  filters: { flexDirection: 'row', paddingHorizontal: 24, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.line },
  filter: { flex: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeFilter: { borderBottomColor: colors.navy },
  filterText: { color: colors.muted, fontSize: 14, fontWeight: '500' },
  filterCount: { color: colors.faint, fontSize: 13 },
  activeFilterText: { color: colors.navy, fontWeight: '700' },
  listViewport: { flex: 1 },
  list: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'flex-start', borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.line, paddingVertical: 18 },
  rowBody: { flex: 1, gap: 7 },
  reference: { color: colors.navy, fontSize: 13, fontWeight: '700', lineHeight: 19 },
  verse: { color: colors.navy, fontSize: 16, lineHeight: 27 },
  source: { color: colors.faint, fontSize: 10, marginTop: 2 },
  remove: { width: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flexGrow: 1, minHeight: 250, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  emptyTitle: { color: colors.muted, fontSize: 15, textAlign: 'center' },
  emptyAction: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 },
  emptyActionText: { color: colors.navy, fontSize: 14, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.line, paddingHorizontal: 12 },
  footerLink: { minHeight: 42, justifyContent: 'center', paddingHorizontal: 10 },
  footerText: { color: colors.muted, fontSize: 10 },
});
