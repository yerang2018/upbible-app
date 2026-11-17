// 수동 동기화 전용: 로그인만으로 사용자의 기록을 전송하지 않습니다.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ReaderRecord } from '../domain/reader-preferences';

export type RemoteReaderRecord = { record: unknown; revision: number };

export async function readRemoteRecord(client: SupabaseClient): Promise<RemoteReaderRecord | null> {
  const { data: user, error: userError } = await client.auth.getUser();
  if (userError) throw userError;
  if (!user.user) throw new Error('로그인이 필요합니다.');
  const { data, error } = await client.from('reader_records').select('record,revision')
    .eq('user_id', user.user.id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  if (!Number.isSafeInteger(data.revision) || data.revision < 1) throw new Error('저장 기록의 버전을 확인할 수 없습니다.');
  return { record: data.record, revision: data.revision };
}

export async function writeRemoteRecord(client: SupabaseClient, record: ReaderRecord, expectedRevision: number, expectedUserId: string): Promise<number> {
  const { data, error } = await client.rpc('write_reader_record', {
    expected_revision: expectedRevision, new_record: record, expected_user_id: expectedUserId,
  });
  if (error) throw error;
  if (!Array.isArray(data) || data.length !== 1) throw new Error('다른 기기에서 기록이 변경되었습니다. 다시 불러온 뒤 확인해 주세요.');
  const revision: unknown = data[0]?.revision;
  if (typeof revision !== 'number' || !Number.isSafeInteger(revision) || revision <= expectedRevision) throw new Error('저장 결과를 확인할 수 없습니다.');
  return revision;
}
