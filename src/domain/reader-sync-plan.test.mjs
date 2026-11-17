import assert from 'node:assert/strict';
import test from 'node:test';
import { planReaderSync } from './reader-sync-plan.ts';
const record = () => ({ position:'gn:1:1', fontLevel:3, bookmarks:[], likes:[], comments:[] });
const snapshot = (revision, value=record()) => ({ revision, record:value });

test('기준 기록 없이 기존 계정에 로그인하면 덮어쓰기 전에 선택을 요구합니다', () => {
  const local={...record(),likes:['local']}, remote=snapshot(4,{...record(),likes:['remote']});
  assert.deepEqual(planReaderSync(local,null,remote),{kind:'choose-initial',local,remote});
});
test('새 계정의 첫 저장은 다른 기기가 먼저 썼는지 확인하도록 0 버전을 사용합니다', () => {
  assert.deepEqual(planReaderSync(record(),null,null),{kind:'write',record:record(),expectedRevision:0});
});
test('동시 수정된 읽기 위치는 자동으로 덮어쓰지 않습니다', () => {
  const base=snapshot(1), local={...record(),position:'gn:1:2'}, remote=snapshot(2,{...record(),position:'gn:1:3'});
  assert.deepEqual(planReaderSync(local,base,remote).kind,'conflict');
});
test('충돌하지 않는 변경만 합치고 서버의 현재 버전을 조건으로 씁니다', () => {
  const base=snapshot(2), local={...record(),likes:['a']}, remote=snapshot(3,{...record(),bookmarks:['b']});
  assert.deepEqual(planReaderSync(local,base,remote),{kind:'write',record:{...record(),likes:['a'],bookmarks:['b']},expectedRevision:3});
});
test('서버 기록이 삭제되거나 이전 버전으로 돌아가면 자동 저장을 중지합니다', () => {
  assert.throws(()=>planReaderSync(record(),snapshot(2),null));
  assert.throws(()=>planReaderSync(record(),snapshot(2),snapshot(1)));
});
