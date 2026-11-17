import { useAppearance } from '../state/Appearance';
import { Pressable } from '../components/Touch';
import { AppText as Text } from '../components/AppText';
import { Link, useFocusEffect } from 'expo-router';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
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
import { fontSizes } from '../domain/reader-preferences';
import type { FontLevel } from '../domain/reader-preferences';
import { useReader } from '../state/ReaderState';
import { colors } from '../theme';

const viewabilityConfig = { itemVisiblePercentThreshold: 70, minimumViewTime: 120 };
type ViewabilityEvent = Parameters<NonNullable<FlatListProps<Verse>['onViewableItemsChanged']>>[0];

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

export default function ShortsScreen() {
  const reader = useReader();
  const { background } = useAppearance();
  const { setPosition, toggleLike, toggleBookmark, fontLevel, likes, bookmarks, ready } = reader;
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [sheet, setSheet] = useState<Sheet>(null);
  const [sheetVerse, setSheetVerse] = useState<Verse | null>(null);
  const [shareVerse, setShareVerse] = useState<Verse | null>(null);
  const [commentVerse, setCommentVerse] = useState<Verse | null>(null);
  const list = useRef<FlatList<Verse>>(null);
  const visibleId = useRef<string | null>(null);
  const focused = useRef(false);
  const position = feedPositionOf(reader.position);
  const current = feedVerses[position];
  const activeVerse = sheetVerse ?? current;

  // MY 목록에서 선택한 구절도 쇼츠 탭으로 돌아오는 순간 정확히 맞춥니다.
  useFocusEffect(useCallback(() => {
    focused.current = true;
    if (ready && size.height && visibleId.current !== reader.position) {
      visibleId.current = current.id;
      setPosition(current.id);
      list.current?.scrollToIndex({ index: feedPositionOf(reader.position), animated: false });
    }
    return () => { focused.current = false; };
  }, [ready, reader.position, current.id, setPosition, size.height]));

  const jump = useCallback((index: number) => {
    const verse = feedVerses[index];
    if (!verse) return;
    visibleId.current = verse.id;
    setPosition(verse.id);
    list.current?.scrollToIndex({ index, animated: false });
    setSheet(null);
  }, [setPosition]);

  const onPageSettled = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!focused.current || !size.height) return;
    const index = Math.max(0, Math.min(feedVerses.length - 1,
      Math.round(event.nativeEvent.contentOffset.y / size.height)));
    visibleId.current = feedVerses[index].id;
    setPosition(visibleId.current);
  }, [setPosition, size.height]);

  // 목록이 유지되는 동안 같은 콜백을 사용하여 개발 중 새로고침에도 넘김을 유지합니다.
  const [onVisibleChanged] = useState<NonNullable<FlatListProps<Verse>['onViewableItemsChanged']>>(() =>
    ({ viewableItems }: ViewabilityEvent) => {
      if (!focused.current) return;
      const visible = viewableItems.find(item => item.isViewable);
      if (visible) { visibleId.current = visible.item.id; setPosition(visible.item.id); }
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
        : <FlatList key={`${size.width}:${size.height}`} ref={list} data={feedVerses}
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
    </View>

    {sheet === 'location' && <BibleLocationSheet current={activeVerse} verses={feedVerses}
      scopeNote="구약·신약 66권의 모든 장과 절을 선택할 수 있습니다."
      onClose={() => setSheet(null)} onSelect={id => {
        const index = feedVerses.findIndex(verse => verse.id === id);
        if (index >= 0) jump(index);
      }} />}

    {sheet === 'search' && <BibleLocationSheet current={current} verses={feedVerses} searchable
      onClose={() => setSheet(null)} onSelect={id => jump(feedPositionOf(id))} />}

    <ShareVerseSheet verse={shareVerse} onClose={() => setShareVerse(null)} />
    <CommentsSheet verse={commentVerse} onClose={() => setCommentVerse(null)} />
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  feed: { flex: 1 },
  loading: { flex: 1 },
  page: { backgroundColor: colors.paper },
  feedHeader: { position: 'absolute', top: 26, left: 18, right: 18, zIndex: 5,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  searchControl: { flexDirection: 'row', gap: 6, minHeight: 48, paddingHorizontal: 16, paddingVertical: 7,
    alignItems: 'center', justifyContent: 'center', borderRadius: 25,
    backgroundColor: colors.card, borderColor: colors.line, borderWidth: 1 },
  searchLabel: { color: colors.navy, fontSize: 14, fontWeight: '600' },
  actionRail: { position: 'absolute', right: 12, alignItems: 'center' },
  action: { alignItems: 'center', width: 60, minHeight: 68, gap: 0 },
  actionCircle: { alignItems: 'center', justifyContent: 'center' },
  actionLabel: { color: colors.navy, fontSize: 12, fontWeight: '500' },
  metadata: { position: 'absolute', left: 24, right: 84, bottom: 21 },
  bookRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 50 },
  bookAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, borderColor: colors.line, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
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
