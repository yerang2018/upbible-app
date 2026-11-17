import { Pressable } from './Touch';
import { AppText as Text, AppTextInput as TextInput } from './AppText';
import { useMemo, useState } from 'react';
import { Keyboard, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import { LineIcon } from './LineIcon';
import { BottomSheet } from './BottomSheet';
import { books as bibleBooks } from '../data/bible';
import { matchesBookName } from '../domain/bible-search';
import type { Verse } from '../domain/bible-model';
import { colors } from '../theme';

const newTestamentIds = new Set(bibleBooks.slice(39).map(book => book.abbrev));
type Testament = 'old' | 'new';
const testamentOf = (id: string): Testament => newTestamentIds.has(id) ? 'new' : 'old';

type Step = 'book' | 'chapter' | 'verse';

export function BibleLocationSheet({ current, verses, searchable = false, onSelect, onClose }: {
  current: Verse; verses: readonly Verse[]; scopeNote?: string; searchable?: boolean; onSelect: (id: string) => void; onClose: () => void;
}) {
  const [searchFocused, setSearchFocused] = useState(false);
  const [query, setQuery] = useState('');
  const [testament, setTestament] = useState<Testament>(() => testamentOf(current.bookId));
  const [step, setStep] = useState<Step>('book');
  const [bookId, setBookId] = useState(current.bookId);
  const [chapter, setChapter] = useState(current.chapter);
  const [verse, setVerse] = useState(current.verse);
  const { height } = useWindowDimensions();
  // 실제로 읽을 수 있는 범위에서 선택지를 만들고, 본문 추가 후에도 같은 화면을 사용합니다.
  const books = useMemo(() => [...new Map(verses.map(item => [item.bookId, { id: item.bookId, name: item.bookName }])).values()], [verses]);
  const visibleBooks = books.filter(book => query.trim() ? matchesBookName(book.name, query) : testamentOf(book.id) === testament);
  const bookVerses = verses.filter(item => item.bookId === bookId);
  const bookName = books.find(item => item.id === bookId)?.name ?? current.bookName;
  const chapters = [...new Set(bookVerses.map(item => item.chapter))];
  const chapterVerses = bookVerses.filter(item => item.chapter === chapter);
  const selected = chapterVerses.find(item => item.verse === verse);
  const searchingBooks = searchable && step === 'book';
  const steps: { id: Step; label: string; value: string }[] = [
    { id: 'book', label: '책', value: bookName },
    { id: 'chapter', label: '장', value: `${chapter}장` },
    { id: 'verse', label: '절', value: `${verse}절` },
  ];

  return <BottomSheet visible title={searchable ? '성경 검색' : '성경 선택'} onClose={onClose}>
    {searchable && <View style={[styles.searchBox, searchFocused && styles.searchFocused]}>
      <LineIcon name="search" size={20} />
      <TextInput accessibilityLabel="성경 책 이름 또는 초성 검색"
      placeholder="예: 창세기, ㅊㅅㄱ" placeholderTextColor={colors.muted}
      value={query} onChangeText={value => { setQuery(value); setStep('book'); }}
      autoCorrect={false} autoCapitalize="none" clearButtonMode="while-editing" returnKeyType="search"
      onFocus={() => { setSearchFocused(true); setStep('book'); }} onBlur={() => setSearchFocused(false)} onSubmitEditing={() => setStep('book')} style={styles.searchInput} />
    </View>}
    <View accessibilityRole="tablist" style={styles.testaments}>
      {([{ id: 'old', label: '구약' }, { id: 'new', label: '신약' }] as const).map(item =>
        <Pressable key={item.id} accessibilityRole="tab" accessibilityLabel={`${item.label} 성경 선택`}
          accessibilityState={{ selected: testament === item.id }}
          onPress={() => { setTestament(item.id); setQuery(''); setStep('book'); }}
          style={[styles.testament, testament === item.id && styles.selectedCell]}>
          <Text style={[styles.testamentText, testament === item.id && styles.selectedText]}>{item.label}</Text>
        </Pressable>)}
    </View>
    {step !== 'book' && <View style={styles.breadcrumb}>
      <Pressable accessibilityRole="button" accessibilityLabel="이전 선택 단계로" onPress={() => setStep(step === 'verse' ? 'chapter' : 'book')} style={styles.back}><Text style={styles.stepValue}>‹ 뒤로</Text></Pressable>
      <Text style={styles.hint}>{bookName}{step === 'verse' ? ` › ${chapter}장` : ''} › {step === 'chapter' ? '장 선택' : '절 선택'}</Text>
    </View>}
    {!searchingBooks && <View accessibilityRole="tablist" style={styles.steps}>
      {steps.map(item => <Pressable key={item.id} accessibilityRole="tab"
        accessibilityLabel={`${item.label} 선택`} accessibilityState={{ selected: step === item.id }}
        onPress={() => { setStep(item.id); if (item.id === 'book') setTestament(testamentOf(bookId)); }} style={[styles.step, step === item.id && styles.activeStep]}>
        <Text style={[styles.stepValue, step === item.id && { fontWeight: '700' }]}>{item.value}</Text>
      </Pressable>)}
    </View>}
    <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" key={`${step}:${testament}:${query}`} style={{ maxHeight: height * 0.34 }} contentContainerStyle={styles.options}
      showsVerticalScrollIndicator={false}>
      {step === 'book' && visibleBooks.length === 0 && <Text style={styles.hint}>일치하는 성경이 없습니다. 책 이름이나 초성을 확인해 주세요.</Text>}
      {step === 'book' && visibleBooks.map(item => <Pressable key={item.id} accessibilityRole="button"
        accessibilityLabel={`${item.name} 선택`} accessibilityState={{ selected: item.id === bookId }}
        style={[styles.bookCell, searchingBooks && styles.searchResult, item.id === bookId && styles.selectedCell]} onPress={() => {
          const first = verses.find(value => value.bookId === item.id);
          if (!first) return;
          Keyboard.dismiss(); setTestament(testamentOf(item.id)); setBookId(item.id); setChapter(first.chapter); setVerse(first.verse); setStep('chapter');
        }}>
        <Text style={[styles.cellText, item.id === bookId && styles.selectedText]}>{item.name}</Text>
      </Pressable>)}
      {step === 'chapter' && chapters.map(number => <Pressable key={number} accessibilityRole="button"
        accessibilityLabel={`${number}장 선택`} accessibilityState={{ selected: number === chapter }}
        style={[styles.numberCell, number === chapter && styles.selectedCell]} onPress={() => {
          const first = bookVerses.find(item => item.chapter === number);
          if (!first) return;
          setChapter(number); setVerse(first.verse); setStep('verse');
        }}>
        <Text style={[styles.cellText, number === chapter && styles.selectedText]}>{number}</Text>
      </Pressable>)}
      {step === 'verse' && chapterVerses.map(item => <Pressable key={item.id} accessibilityRole="button"
        accessibilityLabel={`${item.verse}절 선택`} accessibilityState={{ selected: item.verse === verse }}
        style={[styles.numberCell, item.verse === verse && styles.selectedCell]} onPress={() => setVerse(item.verse)}>
        <Text style={[styles.cellText, item.verse === verse && styles.selectedText]}>{item.verse}</Text>
      </Pressable>)}
    </ScrollView>
    {!searchingBooks && <Pressable accessibilityRole="button" accessibilityLabel={`${bookName} ${chapter}장 ${verse}절로 이동`}
      disabled={!selected || (searchable && step === 'book')} onPress={() => selected && onSelect(selected.id)} style={[styles.go, searchable && step === 'book' && { opacity: 0.45 }]}>
      <Text style={styles.goText}>{bookName} {chapter}:{verse}로 이동</Text>
    </Pressable>}
  </BottomSheet>;
}

const styles = StyleSheet.create({
  breadcrumb: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  back: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
  searchFocused: { borderColor: colors.navy, backgroundColor: '#FFFFFF', boxShadow: '0px 0px 0px 3px rgba(31,42,68,0.08)' },
  searchResult: { width: '100%', minHeight: 54, alignItems: 'flex-start', paddingHorizontal: 16 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 50, paddingHorizontal: 12,
    marginBottom: 14, borderWidth: 1, borderColor: colors.line, borderRadius: 14, backgroundColor: colors.card },
  searchInput: { flex: 1, minWidth: 0, fontSize: 16, minHeight: 50, paddingVertical: 10, color: colors.navy },
  testaments: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  testament: { flex: 1, minHeight: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  testamentText: { color: colors.navy, fontSize: 16, fontWeight: '600' },
  steps: { flexDirection: 'row', gap: 8, marginBottom: 18, borderBottomWidth: 1, borderColor: colors.line },
  step: { flex: 1, minHeight: 44, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 2, borderColor: 'transparent' },
  activeStep: { borderColor: colors.navy },
  stepLabel: { color: colors.muted, fontSize: 11 },
  stepValue: { color: colors.navy, fontSize: 15, fontWeight: '600' },
  hint: { color: colors.muted, fontSize: 12, marginVertical: 18 },
  scopeNote: { color: colors.faint, fontSize: 11, marginTop: -8, marginBottom: 16 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 8 },
  bookCell: { width: '47%', minHeight: 50, borderRadius: 8, alignItems: 'flex-start', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 4,
    borderBottomWidth: 1, borderColor: colors.line, backgroundColor: 'transparent' },
  numberCell: { width: '17%', minHeight: 48, paddingVertical: 8, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  selectedCell: { backgroundColor: colors.navy, borderColor: colors.navy },
  cellText: { color: colors.navy, fontSize: 16 },
  selectedText: { color: colors.paper },
  go: { minHeight: 52, backgroundColor: colors.navy, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginVertical: 18 },
  goText: { textAlign: 'center', color: colors.paper, fontSize: 15, fontWeight: '600' },
});
