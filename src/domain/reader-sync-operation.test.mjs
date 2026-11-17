import assert from 'node:assert/strict';
import test from 'node:test';
import { syncReaderRecord } from './reader-sync-operation.ts';
const record = () => ({ position:'gn:1:1', fontLevel:3, bookmarks:[], likes:[], comments:[] });

test('첫 기기 연결에서 기존 계정 기록이 있으면 선택 없이 쓰지 않습니다', async () => {
  let writes=0;
  const store={read:async()=>({record:record(),revision:2}),write:async()=>{writes++;return 3;}};
  assert.equal((await syncReaderRecord(store,record(),null)).kind,'choose-initial');
  assert.equal(writes,0);
});
test('서버에서 충돌 오류가 나면 저장 성공이라고 표시하지 않습니다', async () => {
  const store={read:async()=>null,write:async()=>{throw new Error('revision conflict');}};
  await assert.rejects(syncReaderRecord(store,record(),null),/revision conflict/);
});
test('서버 응답 버전이 증가하지 않으면 성공으로 처리하지 않습니다', async () => {
  const store={read:async()=>null,write:async()=>0};
  await assert.rejects(syncReaderRecord(store,record(),null));
});
test('실제로 기록한 내용과 서버의 새 버전을 기준 기록으로 반환합니다', async () => {
  let sent;
  const store={read:async()=>null,write:async (value,revision)=>{sent={value,revision};return 1;}};
  const result=await syncReaderRecord(store,record(),null);
  assert.deepEqual(sent,{value:record(),revision:0});
  assert.deepEqual(result,{kind:'saved',snapshot:{record:record(),revision:1}});
});
