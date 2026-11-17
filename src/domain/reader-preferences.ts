export const fontLevels = [1, 2, 3] as const;
export type FontLevel = typeof fontLevels[number];
export const fontSizes: Record<FontLevel, number> = { 1: 22, 2: 26, 3: 30 };

export type VerseComment = { id: string; verseId: string; text: string; createdAt: number };

export type ReaderRecord = {
  position: string;
  bookmarks: string[];
  likes: string[];
  fontLevel: FontLevel;
  comments: VerseComment[];
};

// 예전 저장 기록에는 좋아요와 글자 크기가 없어도 기존 보관함을 유지합니다.
export function restoreReaderRecord(value: unknown, firstId: string, isKnown: (id: string) => boolean): ReaderRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('저장 형식 오류');
  const saved = value as Partial<ReaderRecord>;
  const ids = (list: unknown) => Array.isArray(list)
    ? [...new Set(list.filter((id): id is string => typeof id === 'string' && isKnown(id)))] : [];
  return {
    position: typeof saved.position === 'string' && isKnown(saved.position) ? saved.position : firstId,
    bookmarks: ids(saved.bookmarks),
    likes: ids(saved.likes),
    fontLevel: fontLevels.includes(saved.fontLevel as FontLevel) ? saved.fontLevel as FontLevel : 3,
    comments: Array.isArray(saved.comments) ? saved.comments.filter((item): item is VerseComment =>
      Boolean(item) && typeof item === 'object' && typeof item.id === 'string' &&
      typeof item.verseId === 'string' && isKnown(item.verseId) &&
      typeof item.text === 'string' && item.text.trim().length > 0 &&
      typeof item.createdAt === 'number' && Number.isFinite(item.createdAt)) : [],
  };
}

// 본문과 같은 배율로 화면의 글자도 확대합니다.
export const uiFontScale = (level: FontLevel) => fontSizes[level] / fontSizes[1];

// 마지막 기기 선택을 로그인 계정의 이전 크기보다 우선합니다.
export function preferredFontLevel(saved: string | null, fallback: FontLevel): FontLevel {
  return saved === '1' || saved === '2' || saved === '3' ? Number(saved) as FontLevel : fallback;
}
