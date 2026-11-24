import { useAppearance } from '../state/Appearance';
import { Pressable } from '../components/Touch';
import { AppText as Text } from '../components/AppText';
import { Link, useFocusEffect } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, FlatList, StyleSheet, View, } from 'react-native';
import type { FlatListProps, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BibleLocationSheet } from '../components/BibleLocationSheet';
import { CommentsSheet } from '../components/CommentsSheet';
import { FontSizeControl } from '../components/FontSizeControl';
import { LineIcon } from '../components/LineIcon';
import { ShareVerseSheet } from '../components/ShareVerseSheet';
import { VerseStory } from '../components/VerseStory';
import { attribution } from '../data/bible';
import { feedPositionOf, feedVerses } from '../data/reading-scope';
import { reference } from '../domain/bible-model';
import type { Verse } from '../domain/bible-model';
import { recommendedIds } from '../domain/feed-order';
import { dateKeyOf } from '../domain/reading-log';
import { fontSizes } from '../domain/reader-preferences';
import type { FontLevel } from '../domain/reader-preferences';
import { useReader } from '../state/ReaderState';
import { consumeVerseJump } from '../state/verse-jump';
import { colors } from '../theme';

const viewabilityConfig = { itemVisiblePercentThreshold: 70, minimumViewTime: 120 };
type ViewabilityEvent = Parameters<NonNullable<FlatListProps<Verse>['onViewableItemsChanged']>>[0];
type FeedMode = 'order' | 'recommend';

type PageProps = {
  item: Verse; width: number; height: number; fontLevel: FontLevel; liked: boolean; saved: boolean; commentCount: number;
  onLike: (id: string) => void; onSave: (id: string) => void;
  onChapters: (verse: Verse) => void; onShare: (verse: Verse) => void;
  onComments: (verse: Verse) => void;
};

const VersePage = memo(function VersePage({ item, width, height, fontLevel, liked, saved, commentCount,
  onLike, onSave, onChapters, onShare, onComments }: PageProps) {
  const { background } = useAppearance();
  const { reduceMotion } = useAppearance();
  const [pop] = useState(() => new Animated.Value(0));
  useEffect(() => () => pop.stopAnimation(), [pop]);
  const like = () => {
    onLike(item.id);
    pop.stopAnimation(); pop.setValue(0);
    if (!reduceMotion) Animated.sequence([
      Animated.spring(pop, { toValue: 1, stiffness: 280, damping: 12, useNativeDriver: true }),
      Animated.delay(180), Animated.timing(pop, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
  };
  const circleSize = 48;
  const actionGap = 6;
  const railBottom = 12;
  // 구절 길이나 화면 크기에 따라 선택한 글자 크기를 변경하지 않습니다.
  const fontSize = fontSizes[fontLevel];

  return <View style={[styles.page, { width, height, backgroundColor: background }]}>
    <VerseStory text={item.text} label={reference(item)} width={width} height={height}
      fontSize={fontSize} onDoubleTap={like} />

    <View style={[styles.actionRail, { bottom: railBottom, gap: actionGap }]}>
      <Pressable style={styles.action} accessibilityRole="button"
        accessibilityLabel={`${reference(item)} ${liked ? '좋아요 취소' : '좋아요'}`}
        accessibilityState={{ selected: liked }} onPress={() => like()}>
        <Animated.View style={[styles.actionCircle, { width: circleSize, height: circleSize, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] }) }] }]}><LineIcon name="heart" size={28} filled={liked} /></Animated.View>
        <Text style={styles.actionLabel}>좋아요</Text>
      </Pressable>
      <Pressable style={styles.action} accessibilityRole="button"
        accessibilityLabel={`${reference(item)} 댓글 ${commentCount}개`} onPress={() => onComments(item)}>
        <View style={[styles.actionCircle, { width: circleSize, height: circleSize }]}><LineIcon name="comment" size={28} /></View>
        <Text style={styles.actionLabel}>{commentCount ? `댓글 ${commentCount}` : '댓글'}</Text>
      </Pressable>
      <Pressable style={styles.action} accessibilityRole="button"
        accessibilityLabel={`${reference(item)} ${saved ? '저장 취소' : '저장'}`}
        accessibilityState={{ selected: saved }} onPress={() => onSave(item.id)}>
        <View style={[styles.actionCircle, { width: circleSize, height: circleSize }]}><LineIcon name="bookmark" size={28} filled={saved} /></View>
        <Text style={styles.actionLabel}>{saved ? '저장됨' : '저장'}</Text>
      </Pressable>
      <Pressable style={styles.action} accessibilityRole="button"
        accessibilityLabel={`${reference(item)} 공유`} onPress={() => onShare(item)}>
        <View style={[styles.actionCircle, { width: circleSize, height: circleSize }]}><LineIcon name="share" size={28} /></View>
        <Text style={styles.actionLabel}>공유</Text>
      </Pressable>
    </View>

    <View style={styles.metadata}>
      <Pressable style={styles.bookRow} accessibilityRole="button"
        accessibilityLabel={`${item.bookName} ${item.chapter}장. 책·장·절 선택`} onPress={() => onChapters(item)}>
        <View style={styles.bookAvatar}><LineIcon name="book" size={21} /></View>
        <View style={styles.bookDetails}>
          <View style={styles.bookNameRow}>
            <Text style={styles.bookName}>{item.bookName}</Text><LineIcon name="chevron" size={16} />
          </View>
          <Text style={styles.verseAddress}>{item.chapter}장 {item.verse}절</Text>
        </View>
      </Pressable>
      <Link href="/licenses" asChild>
        <Pressable accessibilityRole="link" hitSlop={8} style={styles.sourceLink}>
          <Text style={styles.source}>{attribution}</Text>
        </Pressable>
      </Link>
    </View>
    <View style={styles.progressTrack} accessibilityRole="progressbar"
      accessibilityLabel={`${item.bookName} ${item.chapter}장 읽기 진행`}
      accessibilityValue={{ min: 1, max: item.chapterLength, now: item.verse }}>
      <View style={[styles.progressFill, { width: `${item.verse / item.chapterLength * 100}%` }]} />
    </View>
  </View>;
});

type Sheet = 'location' | 'search' | null;

const feedOptions = [
  { mode: 'order', label: '순서대로', accessibilityLabel: '순서대로 읽기' },
  { mode: 'recommend', label: '추천', accessibilityLabel: '추천 순서로 읽기' },
] as const satisfies readonly { mode: FeedMode; label: string; accessibilityLabel: string }[];

export default function ShortsScreen() {
  const reader = useReader();
  const { background } = useAppearance();
  const { setPosition, toggleLike, toggleBookmark, fontLevel, likes, bookmarks, ready, recordRead } = reader;
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [sheet, setSheet] = useState<Sheet>(null);
  const [sheetVerse, setSheetVerse] = useState<Verse | null>(null);
  const [shareVerse, setShareVerse] = useState<Verse | null>(null);
  const [commentVerse, setCommentVerse] = useState<Verse | null>(null);
  const [mode, setMode] = useState<FeedMode>('order');
  const [today, setToday] = useState(() => dateKeyOf(new Date()));
  const [recommendAnchor, setRecommendAnchor] = useState<string | null>(null);
  const list = useRef<FlatList<Verse>>(null);
  const visibleId = useRef<string | null>(null);
  const focused = useRef(false);

  const verseOf = useMemo(() => new Map(feedVerses.map(verse => [verse.id, verse])), []);
  // 추천 순서는 날짜를 씨앗으로 만들어 같은 날에는 그대로 이어집니다.
  const recommended = useMemo(() => recommendedIds(feedVerses.map(verse => verse.id), today), [today]);
  const recommendPosition = useMemo(() => new Map(recommended.map((id, index) => [id, index])), [recommended]);
  const recommendVerses = useMemo(() => recommended.flatMap(id => {
    const verse = verseOf.get(id);
    return verse ? [verse] : [];
  }), [recommended, verseOf]);
  const verses = mode === 'order' ? feedVerses : recommendVerses;
  const anchorId = mode === 'order' ? reader.position
    : recommendAnchor && recommendPosition.has(recommendAnchor) ? recommendAnchor : recommended[0];
  const position = mode === 'order' ? feedPositionOf(anchorId) : recommendPosition.get(anchorId) ?? 0;
  const current = verses[position] ?? feedVerses[0];
  const activeVerse = sheetVerse ?? current;

  const modeRef = useRef(mode);
  useEffect(() => { modeRef.current = mode; }, [mode]);

  // 순서대로 모드에서만 읽던 위치를 저장합니다. 추천 모드는 화면 안에서만 기억합니다.
  const applyVisible = useCallback((verse: Verse) => {
    visibleId.current = verse.id;
    if (modeRef.current === 'order') setPosition(verse.id);
    else { setRecommendAnchor(verse.id); recordRead(verse.id); }
  }, [setPosition, recordRead]);

  // MY 목록에서 선택한 구절도 쇼츠 탭으로 돌아오는 순간 정확히 맞춥니다.
  useFocusEffect(useCallback(() => {
    focused.current = true;
    const todayNow = dateKeyOf(new Date());
    if (todayNow !== today) setToday(todayNow);
    const requested = consumeVerseJump();
    // MY·검색에서 고른 구절은 순서대로 모드의 그 자리로 열립니다.
    if (requested && verseOf.has(requested)) {
      if (modeRef.current !== 'order') setMode('order');
      else if (ready && size.height) {
        visibleId.current = requested;
        list.current?.scrollToIndex({ index: feedPositionOf(requested), animated: false });
      }
      return () => { focused.current = false; };
    }
    if (modeRef.current === 'order' && ready && size.height && visibleId.current !== reader.position) {
      visibleId.current = reader.position;
      list.current?.scrollToIndex({ index: feedPositionOf(reader.position), animated: false });
    }
    return () => { focused.current = false; };
  }, [ready, reader.position, today, size.height, verseOf]));

  const jump = useCallback((id: string) => {
    const index = modeRef.current === 'order' ? feedPositionOf(id) : recommendPosition.get(id) ?? 0;
    if (modeRef.current === 'order') setPosition(id);
    else setRecommendAnchor(id);
    visibleId.current = id;
    list.current?.scrollToIndex({ index, animated: false });
    setSheet(null);
  }, [recommendPosition, setPosition]);

  const selectMode = useCallback((next: FeedMode) => {
    if (next === modeRef.current) return;
    setSheet(null);
    setMode(next);
  }, []);

  const onPageSettled = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!focused.current || !size.height) return;
    const index = Math.max(0, Math.min(verses.length - 1,
      Math.round(event.nativeEvent.contentOffset.y / size.height)));
    const verse = verses[index];
    if (verse) applyVisible(verse);
  }, [applyVisible, size.height, verses]);

  // 목록이 유지되는 동안 같은 콜백을 사용하여 개발 중 새로고침에도 넘김을 유지합니다.
  const [onVisibleChanged] = useState<NonNullable<FlatListProps<Verse>['onViewableItemsChanged']>>(() =>
    ({ viewableItems }: ViewabilityEvent) => {
      if (!focused.current) return;
      const visible = viewableItems.find(item => item.isViewable);
      if (visible) applyVisible(visible.item);
    });

  const openChapters = useCallback((verse: Verse) => { setSheetVerse(verse); setSheet('location'); }, []);

  const renderItem = useCallback<NonNullable<FlatListProps<Verse>['renderItem']>>(({ item }) =>
    <VersePage key={`${item.id}:${fontLevel}`} item={item} width={size.width} height={size.height}
      fontLevel={fontLevel} liked={likes.includes(item.id)} saved={bookmarks.includes(item.id)}
      commentCount={reader.comments.filter(comment => comment.verseId === item.id).length} onComments={setCommentVerse}
      onLike={toggleLike} onSave={toggleBookmark}
      onChapters={openChapters} onShare={setShareVerse} />,
  [fontLevel, likes, bookmarks, reader.comments, size.width, size.height, toggleLike, toggleBookmark, openChapters]);

  return <SafeAreaView edges={['top', 'left', 'right']} style={[styles.screen, { backgroundColor: background }]}>
    {reader.storageError && <Text role="alert" style={styles.storageError}>읽기 기록을 저장하지 못했습니다. 앱을 다시 열어 주세요.</Text>}
    <View style={styles.feed} onLayout={event => {
      const { width, height } = event.nativeEvent.layout;
      setSize(previous => previous.width === width && previous.height === height ? previous : { width, height });
    }}>
      {!ready || size.height === 0 ? <ActivityIndicator color={colors.navy} style={styles.loading} />
        : <FlatList key={`${size.width}:${size.height}:${mode}`} ref={list} data={verses}
          keyExtractor={item => item.id} renderItem={renderItem} initialScrollIndex={position}
          getItemLayout={(_, index) => ({ index, length: size.height, offset: size.height * index })}
          pagingEnabled snapToInterval={size.height} disableIntervalMomentum decelerationRate="fast"
          showsVerticalScrollIndicator={false} initialNumToRender={2} windowSize={3} maxToRenderPerBatch={3}
          onMomentumScrollEnd={onPageSettled} viewabilityConfig={viewabilityConfig} onViewableItemsChanged={onVisibleChanged}
          onScrollToIndexFailed={({ index }) => list.current?.scrollToOffset({ offset: index * size.height, animated: false })}
        />}
      <View style={styles.feedHeader}>
        <FontSizeControl />
        <Pressable accessibilityRole="button" accessibilityLabel="성경 검색"
          onPress={() => setSheet('search')} style={styles.searchControl}>
          <LineIcon name="search" size={18} />
          <Text style={styles.searchLabel}>성경 검색</Text>
        </Pressable>
      </View>
      <View style={styles.modeSwitch} accessibilityRole="radiogroup" accessibilityLabel="읽기 방식">
        {feedOptions.map(option => <Pressable key={option.mode} accessibilityRole="radio"
          accessibilityLabel={option.accessibilityLabel} accessibilityState={{ checked: mode === option.mode }}
          hitSlop={{ top: 8, bottom: 8, left: 2, right: 2 }} onPress={() => selectMode(option.mode)}
          style={[styles.modeOption, mode === option.mode && styles.modeOptionActive]}>
          <Text style={[styles.modeLabel, mode === option.mode && styles.modeLabelActive]}>{option.label}</Text>
        </Pressable>)}
      </View>
    </View>

    {sheet === 'location' && <BibleLocationSheet current={activeVerse} verses={feedVerses}
      scopeNote="구약·신약 66권의 모든 장과 절을 선택할 수 있습니다."
      onClose={() => setSheet(null)} onSelect={id => {
        if (verseOf.has(id)) jump(id);
      }} />}

    {sheet === 'search' && <BibleLocationSheet current={current} verses={feedVerses} searchable
      onClose={() => setSheet(null)} onSelect={id => jump(id)} />}

    <ShareVerseSheet verse={shareVerse} onClose={() => setShareVerse(null)} />
    <CommentsSheet verse={commentVerse} onClose={() => setCommentVerse(null)} />
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  feed: { flex: 1 },
  loading: { flex: 1 },
  page: { backgroundColor: colors.paper },
  feedHeader: { position: 'absolute', top: 28, left: 18, right: 18, zIndex: 5,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  searchControl: { flexDirection: 'row', gap: 6, minHeight: 48, paddingHorizontal: 16, paddingVertical: 7,
    alignItems: 'center', justifyContent: 'center', borderRadius: 14,
    backgroundColor: colors.card, borderColor: colors.line, borderWidth: 1 },
  searchLabel: { color: colors.navy, fontSize: 14, fontWeight: '600' },
  modeSwitch: { position: 'absolute', top: 82, right: 18, height: 28, padding: 2, gap: 2, zIndex: 5,
    flexDirection: 'row', alignItems: 'center', borderRadius: 14,
    backgroundColor: colors.card, borderColor: colors.line, borderWidth: 1 },
  modeOption: { height: 24, paddingHorizontal: 9, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modeOptionActive: { backgroundColor: colors.navy },
  modeLabel: { color: colors.muted, fontSize: 11, fontWeight: '500' },
  modeLabelActive: { color: colors.paper, fontWeight: '700' },
  actionRail: { position: 'absolute', right: 12, alignItems: 'center' },
  action: { alignItems: 'center', width: 60, minHeight: 68, gap: 0 },
  actionCircle: { alignItems: 'center', justifyContent: 'center' },
  actionLabel: { color: colors.navy, fontSize: 12, fontWeight: '500' },
  metadata: { position: 'absolute', left: 24, right: 84, bottom: 21 },
  bookRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 50 },
  bookAvatar: { width: 32, height: 40, alignItems: 'center', justifyContent: 'center' },
  bookDetails: { gap: 6 },
  bookNameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  bookName: { color: colors.navy, fontSize: 17, fontWeight: '600' },
  verseAddress: { color: colors.muted, fontSize: 11 },
  sourceLink: { alignSelf: 'flex-start', marginTop: 12, paddingVertical: 5 },
  source: { color: colors.faint, fontSize: 9 },
  progressTrack: { position: 'absolute', bottom: 0, height: 2, width: '100%', backgroundColor: colors.line },
  progressFill: { height: 2, backgroundColor: colors.navy },
  storageError: { color: colors.navy, fontSize: 11, paddingHorizontal: 24, paddingVertical: 8 },
});
