import { useEffect, useState } from 'react';
import { Animated, PanResponder, StyleSheet, View } from 'react-native';
import { Pressable } from './Touch';
import { AppText as Text } from './AppText';
import { fontLevels } from '../domain/reader-preferences';
import type { FontLevel } from '../domain/reader-preferences';
import { useReader } from '../state/ReaderState';
import { useAppearance } from '../state/Appearance';
import { colors } from '../theme';
export function FontSizeControl() {
  const { fontLevel, setFontLevel, ready } = useReader();
  const { reduceMotion } = useAppearance();
  const [x] = useState(() => new Animated.Value((fontLevel - 1) * 47));
  const [zoom] = useState(() => new Animated.Value(1));
  const dragStart = (fontLevel - 1) * 47;
  useEffect(() => {
    x.stopAnimation();
    if (reduceMotion) { x.setValue((fontLevel - 1) * 47); zoom.setValue(1); }
    else {
      Animated.spring(x, { toValue: (fontLevel - 1) * 47, stiffness: 240, damping: 25, mass: 0.8, useNativeDriver: true }).start();
      Animated.sequence([
        Animated.timing(zoom, { toValue: 1.14, duration: 120, useNativeDriver: true }),
        Animated.spring(zoom, { toValue: 1, damping: 18, stiffness: 200, useNativeDriver: true }),
      ]).start();
    }
    return () => { x.stopAnimation(); zoom.stopAnimation(); };
  }, [fontLevel, reduceMotion, x, zoom]);
  const pan = PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, g) => ready && Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
    onPanResponderGrant: () => { x.stopAnimation(); if (!reduceMotion) Animated.spring(zoom, { toValue: 1.14, useNativeDriver: true }).start(); },
    onPanResponderMove: (_, g) => x.setValue(Math.max(0, Math.min(94, dragStart + g.dx))),
    onPanResponderRelease: (_, g) => {
      const level = (Math.max(0, Math.min(2, Math.round((dragStart + g.dx) / 47))) + 1) as FontLevel;
      setFontLevel(level);
      Animated.spring(zoom, { toValue: 1, useNativeDriver: true }).start();
      if (reduceMotion) x.setValue((level - 1) * 47);
      else Animated.spring(x, { toValue: (level - 1) * 47, damping: 25, stiffness: 240, useNativeDriver: true }).start();
    },
    onPanResponderTerminate: () => { zoom.setValue(1); x.setValue((fontLevel - 1) * 47); },
  });
  return <View accessibilityRole="radiogroup" accessibilityLabel="성경 본문 크기" style={styles.control} {...pan.panHandlers}>
    <Animated.View pointerEvents="none" style={[styles.selection, { transform: [{ translateX: x }, { scale: zoom }] }]} />
    {fontLevels.map(level => <Pressable key={level} accessibilityRole="radio" accessibilityLabel={`성경 본문 크기 ${level}단계`} accessibilityState={{ checked: fontLevel === level }} disabled={!ready} onPress={() => setFontLevel(level)} style={styles.option}><Text style={{ fontSize: 10 + level * 5, lineHeight: 36, color: colors.navy, fontWeight: fontLevel === level ? '700' : '400' }}>가</Text></Pressable>)}
  </View>;
}
const styles = StyleSheet.create({
  control: { width: 150, height: 52, flexDirection: 'row', alignItems: 'center', gap: 3, padding: 5, borderRadius: 14, backgroundColor: '#F3F4F6', borderColor: colors.line, borderWidth: 1 },
  option: { width: 44, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  selection: { position: 'absolute', left: 5, top: 5, width: 44, height: 40, borderRadius: 10, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
});
