import { useAppearance } from '../state/Appearance';
import { Pressable } from '../components/Touch';
import { AppText as Text } from '../components/AppText';
import { Link, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LineIcon } from '../components/LineIcon';
import { bible } from '../data/bible';
import { isInReadingScope } from '../data/reading-scope';
import { reference } from '../domain/bible-model';
import type { Verse } from '../domain/bible-model';
import type { VerseComment } from '../domain/reader-preferences';
import { dateKeyOf } from '../domain/reading-log';
import { useReader } from '../state/ReaderState';
import { requestVerseJump } from '../state/verse-jump';
import { colors } from '../theme';

type Category = 'saved' | 'liked' | 'comments';
type Row = { kind: 'verse'; verse: Verse } | { kind: 'comment'; verse: Verse; comment: VerseComment };

const filters: readonly { category: Category; label: string }[] = [
  { category: 'saved', label: '저장' },
  { category: 'liked', label: '좋아요' },
  { category: 'comments', label: '댓글' },
];

const emptyMessages: Record<Category, string> = {
  saved: '저장한 말씀이 아직 없습니다.',
  liked: '좋아요한 말씀이 아직 없습니다.',
  comments: '남긴 댓글이 아직 없습니다.',
};

function timeLabel(time: number) {
  const date = new Date(time);
  if (dateKeyOf(date) === dateKeyOf(new Date())) {
    return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

export default function MyScreen() {
  const reader = useReader();
  const { background } = useAppearance();
  const [category, setCategory] = useState<Category>('saved');
  const savedIds = reader.bookmarks.filter(isInReadingScope);
  const likedIds = reader.likes.filter(isInReadingScope);
  const counts: Record<Category, number> = {
    saved: savedIds.length, liked: likedIds.length, comments: reader.comments.length,
  };
  // 댓글은 최신순으로 모으고, 누르면 그 구절이 쇼츠에 열립니다.
  const rows = useMemo<Row[]>(() => {
    if (category === 'comments') {
      return [...reader.comments]
        .filter(comment => isInReadingScope(comment.verseId))
        .sort((first, second) => second.createdAt - first.createdAt)
        .flatMap(comment => {
          const verse = bible.find(comment.verseId);
          return verse ? [{ kind: 'comment' as const, verse, comment }] : [];
        });
    }
    const ids = category === 'saved' ? savedIds : likedIds;
    return [...ids].reverse().flatMap(id => {
      const verse = bible.find(id);
      return verse ? [{ kind: 'verse' as const, verse }] : [];
    });
  }, [category, reader.comments, savedIds, likedIds]);

  const open = (verse: Verse) => { requestVerseJump(verse.id); reader.setPosition(verse.id); router.navigate('/'); };

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

    <View style={styles.summaryBar} accessibilityRole="summary"
      accessibilityLabel={`오늘 ${reader.todayCount}절 읽음, 연속 ${reader.streak}일`}>
      <Text style={styles.summaryText}>오늘 <Text style={styles.summaryStrong}>{reader.todayCount}절</Text>
        <Text style={styles.summaryDot}>  ·  </Text>
        연속 <Text style={styles.summaryStrong}>{reader.streak}일</Text></Text>
    </View>

    <View style={styles.filters}>
      {filters.map(filter => <Pressable key={filter.category}
        accessibilityRole="button"
        accessibilityLabel={`${filter.label}한 말씀 ${counts[filter.category]}개 보기`}
        accessibilityState={{ selected: category === filter.category }}
        onPress={() => setCategory(filter.category)}
        style={[styles.filter, category === filter.category && styles.activeFilter]}
      >
        <Text style={[styles.filterText, category === filter.category && styles.activeFilterText]}>{filter.label}</Text>
        <Text style={[styles.filterCount, category === filter.category && styles.activeFilterText]}>{counts[filter.category]}</Text>
      </Pressable>)}
    </View>

    {!reader.ready
      ? <View style={styles.loading}><ActivityIndicator color={colors.navy} /></View>
      : <FlatList
        style={styles.listViewport}
        data={rows}
        keyExtractor={item => item.kind === 'comment' ? item.comment.id : item.verse.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<View style={styles.empty}>
          <Text style={styles.emptyTitle}>{emptyMessages[category]}</Text>
          <Pressable accessibilityRole="button" onPress={() => router.navigate('/')} style={styles.emptyAction}>
            <Text style={styles.emptyActionText}>말씀 읽기 →</Text>
          </Pressable>
        </View>}
        renderItem={({ item }) => item.kind === 'comment'
          ? <View style={styles.row}>
            <Pressable style={styles.rowBody} accessibilityRole="button"
              accessibilityLabel={`${reference(item.verse)} 댓글 ${item.comment.text} 읽기`}
              onPress={() => open(item.verse)}>
              <View style={styles.commentHead}>
                <Text style={styles.reference}>{reference(item.verse)}</Text>
                <Text style={styles.commentTime}>{timeLabel(item.comment.createdAt)}</Text>
              </View>
              <Text style={styles.commentText}>{item.comment.text}</Text>
              <Text style={styles.verse} numberOfLines={2}>{item.verse.text}</Text>
            </Pressable>
            <Pressable style={styles.remove} accessibilityRole="button"
              accessibilityLabel={`${reference(item.verse)} 댓글 삭제`}
              onPress={() => reader.deleteComment(item.comment.id)}>
              <Text style={styles.removeText}>삭제</Text>
            </Pressable>
          </View>
          : <View style={styles.row}>
            <Pressable style={styles.rowBody} accessibilityRole="button" accessibilityLabel={`${reference(item.verse)} 읽기`}
              onPress={() => open(item.verse)}>
              <Text style={styles.reference}>{reference(item.verse)}</Text>
              <Text style={styles.verse}>{item.verse.text}</Text>
            </Pressable>
            <Pressable style={styles.remove} accessibilityRole="button"
              accessibilityLabel={`${reference(item.verse)} ${category === 'saved' ? '저장' : '좋아요'} 취소`}
              onPress={() => category === 'saved' ? reader.toggleBookmark(item.verse.id) : reader.toggleLike(item.verse.id)}>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 18, paddingBottom: 10 },
  title: { fontSize: 25, fontWeight: '700', color: colors.navy },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  headerAction: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  summaryBar: { paddingHorizontal: 24, paddingBottom: 14 },
  summaryText: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  summaryStrong: { color: colors.navy, fontWeight: '700' },
  summaryDot: { color: colors.line },
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
  commentHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  reference: { color: colors.navy, fontSize: 13, fontWeight: '700', lineHeight: 19 },
  commentTime: { color: colors.faint, fontSize: 11 },
  commentText: { color: colors.navy, fontSize: 15, lineHeight: 23 },
  verse: { color: colors.muted, fontSize: 15, lineHeight: 25 },
  remove: { width: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  removeText: { color: colors.faint, fontSize: 11 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flexGrow: 1, minHeight: 250, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  emptyTitle: { color: colors.muted, fontSize: 15, textAlign: 'center' },
  emptyAction: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 },
  emptyActionText: { color: colors.navy, fontSize: 14, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.line, paddingHorizontal: 12 },
  footerLink: { minHeight: 42, justifyContent: 'center', paddingHorizontal: 10 },
  footerText: { color: colors.muted, fontSize: 10 },
});
