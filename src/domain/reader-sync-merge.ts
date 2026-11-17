import type { ReaderRecord, VerseComment } from './reader-preferences';

export type MergeConflict = 'position' | 'fontLevel' | `comment:${string}`;
export type MergeResult = { record: ReaderRecord; conflicts: MergeConflict[] };

// 공통 기준 이후 양쪽이 바꾼 경우에만 충돌로 표시합니다.
// 충돌 결과를 서버에 쓰기 전에 반드시 사용자가 선택해야 합니다.
export function mergeReaderRecords(base: ReaderRecord, local: ReaderRecord, remote: ReaderRecord): MergeResult {
  const conflicts: MergeConflict[] = [];
  function value<T>(field: MergeConflict, before: T, here: T, there: T, equal: (a: T, b: T) => boolean = Object.is): T {
    if (equal(here, there)) return here;
    if (equal(before, here)) return there;
    if (equal(before, there)) return here;
    conflicts.push(field);
    return here;
  }
  function membership(before: string[], here: string[], there: string[]): string[] {
    const b = new Set(before), l = new Set(here), r = new Set(there);
    const ordered = [...new Set([...here, ...there, ...before])];
    return ordered.filter(id => {
      const old = b.has(id), left = l.has(id), right = r.has(id);
      return left === right ? left : left === old ? right : left;
    });
  }
  function equalComment(a: VerseComment | undefined, b: VerseComment | undefined) {
    return a === b || (a !== undefined && b !== undefined && a.id === b.id && a.verseId === b.verseId &&
      a.text === b.text && a.createdAt === b.createdAt);
  }
  const comments = (items: VerseComment[]) => new Map(items.map(item => [item.id, item]));
  const b = comments(base.comments), l = comments(local.comments), r = comments(remote.comments);
  const ids = [...new Set([...l.keys(), ...r.keys(), ...b.keys()])];
  const mergedComments: VerseComment[] = [];
  for (const id of ids) {
    const item = value(`comment:${id}`, b.get(id), l.get(id), r.get(id), equalComment);
    if (item) mergedComments.push(item);
  }
  return {
    record: {
      position: value('position', base.position, local.position, remote.position),
      fontLevel: value('fontLevel', base.fontLevel, local.fontLevel, remote.fontLevel),
      bookmarks: membership(base.bookmarks, local.bookmarks, remote.bookmarks),
      likes: membership(base.likes, local.likes, remote.likes),
      comments: mergedComments,
    },
    conflicts,
  };
}
