import type { ReaderRecord } from './reader-preferences';
import { mergeReaderRecords, type MergeConflict } from './reader-sync-merge.ts';

export type SyncSnapshot = { record: ReaderRecord; revision: number };
export type SyncPlan =
  | { kind: 'write'; record: ReaderRecord; expectedRevision: number }
  | { kind: 'choose-initial'; local: ReaderRecord; remote: SyncSnapshot }
  | { kind: 'conflict'; local: ReaderRecord; remote: SyncSnapshot; fields: MergeConflict[] };

/** 이 함수는 순수 계산만 합니다. 데이터 전송이나 저장은 호출자가 명시적으로 처리합니다. */
export function planReaderSync(local: ReaderRecord, base: SyncSnapshot | null, remote: SyncSnapshot | null): SyncPlan {
  if (base && !remote) {
    // 서버 데이터가 삭제된 이유를 모르면 기존 기록으로 자동 복원하지 않습니다.
    throw new Error('서버 기록을 확인할 수 없습니다. 자동 동기화를 중단합니다.');
  }
  if (base && remote && remote.revision < base.revision) {
    throw new Error('서버 기록의 버전이 이전 상태입니다. 자동 동기화를 중단합니다.');
  }
  if (!base && remote) return { kind: 'choose-initial', local, remote };
  if (!remote) return { kind: 'write', record: local, expectedRevision: 0 };
  const merged = mergeReaderRecords(base!.record, local, remote.record);
  if (merged.conflicts.length) return { kind: 'conflict', local, remote, fields: merged.conflicts };
  return { kind: 'write', record: merged.record, expectedRevision: remote.revision };
}
