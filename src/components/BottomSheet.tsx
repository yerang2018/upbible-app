import { Pressable } from './Touch';
import { AppText as Text } from './AppText';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { Animated, Keyboard, KeyboardAvoidingView, Modal, PanResponder, Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LineIcon } from './LineIcon';
import { colors } from '../theme';

export function BottomSheet({ visible, title, onClose, children }: PropsWithChildren<{
  visible: boolean; title: string; onClose: () => void;
}>) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [offset] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (visible) { offset.setValue(0); }
  }, [visible, offset]);
  const dismiss = useCallback(() => {
    Keyboard.dismiss();
    Animated.timing(offset, { toValue: height, duration: 200, useNativeDriver: Platform.OS !== 'web' })
      .start(({ finished }) => { if (finished) onClose(); });
  }, [height, offset, onClose]);
  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 5 && gesture.dy > Math.abs(gesture.dx),
    onPanResponderGrant: () => offset.stopAnimation(),
    onPanResponderMove: (_, gesture) => offset.setValue(Math.max(0, gesture.dy)),
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dy > 64 || (gesture.dy > 16 && gesture.vy > 0.6)) dismiss();
      else Animated.spring(offset, { toValue: 0, useNativeDriver: Platform.OS !== 'web' }).start();
    },
    onPanResponderTerminate: () => Animated.spring(offset, { toValue: 0, useNativeDriver: Platform.OS !== 'web' }).start(),
  }), [dismiss, offset]);
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
      <Pressable accessibilityRole="button" accessibilityLabel="창 닫기"
        style={StyleSheet.absoluteFill} onPress={onClose} />
      <Animated.View accessibilityViewIsModal style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20),
        transform: [{ translateY: offset }] }]}>
        <View {...pan.panHandlers} style={styles.handleTouch} accessible accessibilityRole="button"
          accessibilityLabel="아래로 끌어 닫기" accessibilityActions={[{ name: 'activate', label: '닫기' }]}
          onAccessibilityTap={dismiss} onAccessibilityAction={dismiss}>
          <View style={styles.handle} />
        </View>
        <View style={styles.header}>
          <Text accessibilityRole="header" style={styles.title}>{title}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="닫기" onPress={onClose} style={styles.close}>
            <LineIcon name="close" />
          </Pressable>
        </View>
        {children}
      </Animated.View>
    </KeyboardAvoidingView>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#1F2A4455' },
  sheet: { backgroundColor: colors.paper, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%', paddingHorizontal: 24 },
  handleTouch: { height: 36, alignItems: 'center', justifyContent: 'center' },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.line, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20 },
  title: { flex: 1, flexShrink: 1, fontSize: 20, fontWeight: '700', color: colors.navy },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
