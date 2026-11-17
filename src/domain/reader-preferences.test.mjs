import assert from 'node:assert/strict';
import test from 'node:test';
import { restoreReaderRecord } from './reader-preferences.ts';

const first = 'gn:1:1';
const known = id => ['gn:1:1', 'gn:1:2'].includes(id);

test('예전 기록을 읽으면 위치와 보관함은 유지하고 글자 크기는 3단계로 시작합니다', () => {
  assert.deepEqual(restoreReaderRecord({position:'gn:1:2',bookmarks:[first]}, first, known), {
    position:'gn:1:2', bookmarks:[first], likes:[], fontLevel:3, comments:[],
  });
});

test('댓글을 복원하면서 기존 기록을 유지하고 잘못된 댓글은 제외합니다', () => {
  const comment = { id:'one', verseId:first, text:'말씀을 기억합니다.', createdAt:10 };
  const saved = restoreReaderRecord({position:first, bookmarks:[first], comments:[
    comment, null, { ...comment, verseId:'missing' }, { ...comment, text:' ' },
    { ...comment, createdAt:NaN },
  ]}, first, known);
  assert.deepEqual(saved.comments, [comment]);
  assert.deepEqual(saved.bookmarks, [first]);
});

test('좋아요와 저장은 구분하며 중복과 없는 구절은 제거합니다', () => {
  const saved = restoreReaderRecord({position:'missing', bookmarks:[first,first,'missing'], likes:['gn:1:2'],fontLevel:2}, first, known);
  assert.equal(saved.position, first);
  assert.deepEqual(saved.bookmarks,[first]);
  assert.deepEqual(saved.likes,['gn:1:2']);
  assert.equal(saved.fontLevel,2);
});

test('기존 4단계와 지원하지 않는 크기는 3단계로 복원합니다', () => {
  for (const fontLevel of [0,4,5,'4',null,NaN]) {
    assert.equal(restoreReaderRecord({fontLevel},first,known).fontLevel,3);
  }
});

test('앱 글자도 본문과 같은 비율로 단계마다 커집니다', async () => {
  const { uiFontScale, fontSizes } = await import('./reader-preferences.ts');
  const scales = [1, 2, 3].map(uiFontScale);
  assert.ok(scales[0] < scales[1] && scales[1] < scales[2]);
  for (const level of [1, 2, 3]) assert.equal(uiFontScale(level), fontSizes[level] / 22);
});

test('재로그인할 때 기기의 마지막 글자 크기를 우선하고 잘못된 값은 계정 설정을 유지합니다', async () => {
  const { preferredFontLevel } = await import('./reader-preferences.ts');
  assert.equal(preferredFontLevel('1', 3), 1);
  assert.equal(preferredFontLevel('2', 1), 2);
  for (const value of [null, '', '4', 'invalid']) assert.equal(preferredFontLevel(value, 2), 2);
});
