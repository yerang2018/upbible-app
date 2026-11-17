import assert from 'node:assert/strict';
import test from 'node:test';
import { mergeReaderRecords } from './reader-sync-merge.ts';

const empty = () => ({position:'gn:1:1',fontLevel:3,bookmarks:[],likes:[],comments:[]});
const comment = (id, text='메모') => ({ id, verseId:'gn:1:1', text, createdAt:1 });

test('서로 다른 기기에서 추가한 좋아요와 저장을 모두 보존합니다', () => {
  const base=empty(), local={...empty(),likes:['a'],bookmarks:['b']}, remote={...empty(),likes:['c'],bookmarks:['d']};
  const result=mergeReaderRecords(base,local,remote);
  assert.deepEqual(result.record.likes,['a','c']);
  assert.deepEqual(result.record.bookmarks,['b','d']);
  assert.deepEqual(result.conflicts,[]);
});

test('기준 시점의 좋아요 및 댓글을 한 기기에서 삭제한 경우 되살리지 않습니다', () => {
  const base={...empty(), likes:['a'], comments:[comment('one')]};
  const local={...empty()}, remote={...base,bookmarks:['b']};
  const result=mergeReaderRecords(base,local,remote);
  assert.deepEqual(result.record.likes,[]);
  assert.deepEqual(result.record.comments,[]);
  assert.deepEqual(result.record.bookmarks,['b']);
  assert.deepEqual(result.conflicts,[]);
});

test('같은 댓글의 수정과 삭제가 충돌하면 자동 저장하지 않도록 표시합니다', () => {
  const base={...empty(),comments:[comment('one')]};
  const local={...empty(),comments:[]}, remote={...empty(),comments:[comment('one','수정')]};
  assert.deepEqual(mergeReaderRecords(base,local,remote).conflicts,['comment:one']);
});

test('읽은 위치가 양쪽에서 다르게 바뀌면 충돌로 표시합니다', () => {
  const result=mergeReaderRecords(empty(),{...empty(),position:'gn:1:2'},{...empty(),position:'gn:1:3'});
  assert.deepEqual(result.conflicts,['position']);
});

test('기기별로 추가한 댓글은 보존하고 똑같은 변경은 충돌로 처리하지 않습니다', () => {
  const local={...empty(),position:'gn:1:2',comments:[comment('a')]};
  const remote={...empty(),position:'gn:1:2',comments:[comment('b')]};
  const result=mergeReaderRecords(empty(),local,remote);
  assert.deepEqual(result.record.comments.map(x=>x.id),['a','b']);
  assert.deepEqual(result.conflicts,[]);
});
