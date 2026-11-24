import { Pressable } from './Touch';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentRef } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAppearance } from '../state/Appearance';
import { layoutVerseLines } from '../domain/verse-lines';
import fontMetrics from '../data/verse-font-metrics.json';
import { colors, serif } from '../theme';

type Props = {
  text: string; label: string; width: number; height: number; fontSize: number; onDoubleTap: () => void;
};

// 긴 구절 안내는 한 번 가로로 넘긴 뒤에는 다시 띄우지 않습니다(앱을 다시 켜면 한 번 더).
let swipeHintSeen = false;

export function VerseStory(props: Props) {
  // 본문·글자 크기·화면 크기가 바뀌면 가로 페이지 위치를 초기화합니다.
  return <PaginatedVerseStory key={JSON.stringify([props.text, props.width, props.height, props.fontSize])} {...props} />;
}

function PaginatedVerseStory({ text, label, width, height, fontSize, onDoubleTap }: Props) {
  const { reduceMotion } = useAppearance();
  const [page, setPage] = useState(0);
  const pager = useRef<ComponentRef<typeof ScrollView>>(null);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelTap = () => { if (tapTimer.current) clearTimeout(tapTimer.current); tapTimer.current = null; };
  useEffect(() => () => { if (tapTimer.current) clearTimeout(tapTimer.current); }, []);
  const onBodyPress = () => {
    if (tapTimer.current) {
      cancelTap();
      onDoubleTap();
    } else {
      tapTimer.current = setTimeout(() => { tapTimer.current = null; }, 350);
    }
  };
  const bodyWidth = Math.max(80, Math.min(width - 156, 460));
  const bodyHeight = Math.max(fontSize * 1.4 + 8, height - 224);
  const { pages, rowHeight } = useMemo(
    () => layoutVerseLines(text, bodyWidth, bodyHeight, fontSize, fontMetrics),
    [text, bodyWidth, bodyHeight, fontSize],
  );
  const [showHint, setShowHint] = useState(() => pages.length > 1 && !swipeHintSeen);
  const [hintOpacity] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!showHint) return;
    if (reduceMotion) { hintOpacity.setValue(1); return; }
    const animation = Animated.timing(hintOpacity, { toValue: 1, duration: 260, delay: 700, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [showHint, reduceMotion, hintOpacity]);
  const dismissHint = useCallback(() => {
    if (!showHint) return;
    swipeHintSeen = true;
    setShowHint(false);
  }, [showHint]);
  const turnTo = (next: number) => {
    setPage(next); pager.current?.scrollTo({ x: width * next, animated: true });
    if (next > 0) dismissHint();
  };

  return <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
    {pages.length > 1 && <View style={styles.storyProgress}>
      {pages.map((_, index) => <Pressable key={index} style={styles.segmentTouch}
        accessibilityRole="button" accessibilityLabel={`${label} ${pages.length}부분 중 ${index + 1}번째 읽기`}
        accessibilityState={{ selected: index === page }} onPress={() => turnTo(index)}>
        <View style={[styles.segment, index <= page && styles.segmentRead]} />
      </Pressable>)}
    </View>}
    {/* 두 페이지 이상인 구절에서만 가로로 넘겨 읽는 방법을 부드럽게 알려 줍니다. */}
    {showHint && <Animated.View pointerEvents="none" style={[styles.hint, { top: (height - bodyHeight) / 2 - 30, opacity: hintOpacity }]}>
      <Text style={styles.hintText} allowFontScaling={false} maxFontSizeMultiplier={1}>← 옆으로 넘겨 이어 읽기</Text>
    </Animated.View>}
    <View style={[styles.body, { height: bodyHeight, top: (height - bodyHeight) / 2 }]}>
      <ScrollView ref={pager} horizontal pagingEnabled directionalLockEnabled nestedScrollEnabled
          scrollEnabled={pages.length > 1} showsHorizontalScrollIndicator={false}
          onScrollBeginDrag={cancelTap}
          bounces={false} style={styles.pager} scrollEventThrottle={16}
          onScroll={event => {
            const next = Math.max(0, Math.min(pages.length - 1,
              Math.round(event.nativeEvent.contentOffset.x / width)));
            setPage(next);
            if (next > 0) dismissHint();
          }}>
          {pages.map((lines, index) => <View key={index} style={[styles.part, { width, height: bodyHeight }]}>
            <Pressable style={{ width, height: bodyHeight, alignItems: 'center', justifyContent: 'center' }} accessibilityRole="button" onPress={onBodyPress}
              accessibilityLabel={`${label}${pages.length > 1 ? `, ${index + 1}/${pages.length}` : ''}. ${lines.join('')}. 두 번 누르면 좋아요를 설정하거나 취소합니다.`}>
              {/* 한 줄마다 독립된 Text를 배치해 여러 줄 자동 줄바꿈과 높이 측정에 의존하지 않습니다. */}
              <View accessible={false} style={{ width: bodyWidth, paddingBottom: 8 }}>
                {lines.map((line, lineIndex) => <View key={lineIndex} style={{ height: rowHeight }}>
                  <Text style={[styles.text, { width: bodyWidth, height: rowHeight + 8,
                    fontSize, lineHeight: rowHeight }]} numberOfLines={1} ellipsizeMode="clip"
                    allowFontScaling={false} maxFontSizeMultiplier={1}>{line.trim()}</Text>
                </View>)}
              </View>
            </Pressable>
          </View>)}
        </ScrollView>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  text: { fontFamily: serif, color: colors.navy, textAlign: 'center' },
  body: { position: 'absolute', left: 0, right: 0, justifyContent: 'center', alignItems: 'center' },
  pager: { width: '100%' },
  part: { justifyContent: 'center', alignItems: 'center' },
  storyProgress: { position: 'absolute', top: 2, left: 14, right: 14, flexDirection: 'row', gap: 4, zIndex: 6 },
  segmentTouch: { flex: 1, height: 20, justifyContent: 'center' },
  segment: { height: 3, borderRadius: 2, backgroundColor: colors.line },
  segmentRead: { backgroundColor: colors.navy },
  hint: { position: 'absolute', left: 24, height: 28, paddingHorizontal: 12, borderRadius: 14,
    justifyContent: 'center', backgroundColor: 'rgba(31, 42, 68, 0.07)', zIndex: 5 },
  hintText: { color: colors.navy, fontSize: 12, fontWeight: '500' },
});
