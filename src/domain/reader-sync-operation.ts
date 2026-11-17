import type { ReaderRecord } from './reader-preferences';
import { planReaderSync, type SyncPlan, type SyncSnapshot } from './reader-sync-plan.ts';

type Store = {
  read: () => Promise<SyncSnapshot | null>;
  // 조건이 맞지 않으면 덮어쓰지 않고 오류를 반환해야 합니다.
  write: (record: ReaderRecord, expectedRevision: number) => Promise<number>;
};
type Result = { kind: 'saved'; snapshot: SyncSnapshot } | Exclude<SyncPlan, { kind: 'write' }>;

// 서버 적용 전 독립적으로 검증하는 동기화 작업입니다. 호출 전후로 계정과 로컬 변경을
// 확인하는 것은 이 함수를 연결할 상태 관리 계층의 책임입니다.
export async function syncReaderRecord(store: Store, local: ReaderRecord, base: SyncSnapshot | null): Promise<Result> {
  const remote = await store.read();
  const plan = planReaderSync(local, base, remote);
  if (plan.kind !== 'write') return plan;
  const revision = await store.write(plan.record, plan.expectedRevision);
  if (!Number.isSafeInteger(revision) || revision <= plan.expectedRevision) throw new Error('저장 결과의 버전이 올바르지 않습니다.');
  return { kind: 'saved', snapshot: { record: plan.record, revision } };
}
