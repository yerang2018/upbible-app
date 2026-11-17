import { Pressable } from './Touch';
import { AppText as Text } from './AppText';
import * as Sharing from 'expo-sharing';
import { useRef, useState } from 'react';
import type { ComponentRef } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, Share, StyleSheet, View, useWindowDimensions } from 'react-native';
import type { TextStyle } from 'react-native';
import { captureRef, releaseCapture } from 'react-native-view-shot';

import { BottomSheet } from './BottomSheet';
import { LineIcon } from './LineIcon';
import { attribution } from '../data/bible';
import type { Verse } from '../domain/bible-model';
import { reference } from '../domain/bible-model';
import { colors, serif } from '../theme';

const webWordWrap = Platform.OS === 'web' ? { wordBreak: 'keep-all' } as TextStyle : undefined;

export function ShareVerseSheet({ verse, onClose }: { verse: Verse | null; onClose: () => void }) {
  const cardRef = useRef<ComponentRef<typeof View>>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const window = useWindowDimensions();

  async function share() {
    if (!verse || busy || !ready) return;
    setBusy(true);
    let uri: string | null = null;
    try {
      if (Platform.OS === 'web') {
        await Share.share({ message: `${verse.text}\n\n${reference(verse)}\n${attribution}\n업바이블` });
      } else {
        if (!(await Sharing.isAvailableAsync())) throw new Error('공유 기능을 사용할 수 없습니다.');
        // 본문과 출처가 전부 담긴 카드만 촬영하여 휴대폰 기본 공유 창에 전달합니다.
        uri = await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile' });
        await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: '말씀 이미지 공유' });
      }
    } catch {
      Alert.alert('공유를 열지 못했습니다', '잠시 후 다시 눌러 주세요.');
    } finally {
      if (uri) releaseCapture(uri);
      setBusy(false);
    }
  }

  return <BottomSheet visible={Boolean(verse)} title="말씀 공유" onClose={onClose}>
    {verse && <>
      <ScrollView style={{ maxHeight: window.height * 0.5 }} contentContainerStyle={styles.preview}>
        <View ref={cardRef} collapsable={false} onLayout={() => setReady(true)} style={styles.card}>
          <LineIcon name="light" size={30} />
          <Text selectable style={[styles.text, webWordWrap]} lineBreakStrategyIOS="hangul-word"
            textBreakStrategy="balanced">{`“${verse.text}”`}</Text>
          <Text style={styles.reference}>{reference(verse)}</Text>
          <View style={styles.rule} />
          <Text style={styles.brand}>업바이블</Text>
          <Text style={styles.source}>{attribution}</Text>
        </View>
      </ScrollView>
      <Pressable accessibilityRole="button" accessibilityLabel={Platform.OS === 'web' ? '말씀 내용 공유하기' : '말씀 이미지 공유하기'}
        disabled={busy || !ready} onPress={share} style={[styles.button, (busy || !ready) && styles.disabled]}>
        {busy ? <ActivityIndicator color={colors.paper} />
          : <Text style={styles.buttonText}>{Platform.OS === 'web' ? '내용 공유하기' : '이미지로 공유하기'}</Text>}
      </Pressable>
    </>}
  </BottomSheet>;
}

const styles = StyleSheet.create({
  preview: { paddingBottom: 10 },
  card: { backgroundColor: colors.paper, paddingHorizontal: 28, paddingVertical: 36, minHeight: 380, alignItems: 'center', borderWidth: 1, borderColor: colors.line, borderRadius: 20 },
  text: { fontFamily: serif, fontSize: 23, lineHeight: 39, textAlign: 'center', color: colors.navy, marginVertical: 30 },
  reference: { fontSize: 12, color: colors.muted },
  rule: { width: 24, height: 1, backgroundColor: colors.line, marginVertical: 24 },
  brand: { fontFamily: serif, fontSize: 13, color: colors.navy, marginBottom: 8 },
  source: { fontSize: 9, color: colors.muted },
  button: { backgroundColor: colors.navy, minHeight: 54, paddingVertical: 12, paddingHorizontal: 8, borderRadius: 18, marginVertical: 16, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: colors.paper, fontSize: 15, fontWeight: '600' },
  disabled: { opacity: 0.5 },
});
