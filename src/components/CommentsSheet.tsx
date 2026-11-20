import { Pressable } from './Touch';
import { AppText as Text, AppTextInput as TextInput } from './AppText';
import { useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import { BottomSheet } from './BottomSheet';
import { reference } from '../domain/bible-model';
import type { Verse } from '../domain/bible-model';
import { useReader } from '../state/ReaderState';
import { colors } from '../theme';

export function CommentsSheet({ verse, onClose }: { verse: Verse | null; onClose: () => void }) {
  const reader = useReader();
  const [draft, setDraft] = useState('');
  const { height } = useWindowDimensions();
  const comments = reader.comments.filter(comment => comment.verseId === verse?.id);
  const close = () => { setDraft(''); onClose(); };
  const submit = () => {
    if (!verse || !draft.trim() || !reader.ready) return;
    reader.addComment(verse.id, draft);
    setDraft('');
  };
  return <BottomSheet visible={Boolean(verse)} title={`댓글 ${comments.length}`} onClose={close}>
    <Text style={styles.reference}>{verse && reference(verse)}</Text>
    <Text style={styles.notice}>지금은 이 기기에만 저장되는 댓글입니다.</Text>
    <ScrollView style={{ maxHeight: height * 0.3 }} keyboardShouldPersistTaps="handled">
      {comments.length === 0 ? <Text style={styles.empty}>이 말씀에 대한 생각을 남겨 보세요.</Text>
        : [...comments].reverse().map(comment => <View key={comment.id} style={styles.comment}>
          <View style={styles.row}>
            <Text style={styles.author}>나</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={`댓글 삭제: ${comment.text}`}
              hitSlop={10} onPress={() => reader.deleteComment(comment.id)}>
              <Text style={styles.delete}>삭제</Text>
            </Pressable>
          </View>
          <Text style={styles.text}>{comment.text}</Text>
        </View>)}
    </ScrollView>
    <View style={styles.composer}>
      <TextInput accessibilityLabel="댓글 입력" placeholder="댓글을 남겨 주세요" placeholderTextColor={colors.faint}
        value={draft} onChangeText={setDraft} multiline maxLength={1000} style={styles.input} />
      <Pressable accessibilityRole="button" accessibilityLabel="댓글 등록" accessibilityState={{ disabled: !draft.trim() || !reader.ready }}
        disabled={!draft.trim() || !reader.ready} onPress={submit}
        style={[styles.submit, (!draft.trim() || !reader.ready) && styles.disabled]}>
        <Text style={styles.submitText}>등록</Text>
      </Pressable>
    </View>
  </BottomSheet>;
}

const styles = StyleSheet.create({
  reference: { color: colors.navy, fontSize: 14, marginBottom: 8 },
  notice: { color: colors.muted, fontSize: 11, marginBottom: 16 },
  empty: { color: colors.muted, fontSize: 14, textAlign: 'center', paddingVertical: 34 },
  comment: { paddingVertical: 16, borderTopWidth: 1, borderTopColor: colors.line },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  author: { fontSize: 12, fontWeight: '600', color: colors.navy },
  delete: { fontSize: 11, color: colors.muted },
  text: { fontSize: 15, lineHeight: 23, color: colors.navy },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingVertical: 18 },
  input: { flex: 1, fontSize: 15, lineHeight: 22, minHeight: 48, maxHeight: 112, color: colors.navy,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 13 },
  submit: { minHeight: 48, paddingVertical: 10, paddingHorizontal: 17, borderRadius: 12, backgroundColor: colors.navy, justifyContent: 'center' },
  disabled: { opacity: 0.35 },
  submitText: { color: colors.paper, fontSize: 13, fontWeight: '600' },
});
