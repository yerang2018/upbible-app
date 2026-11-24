import assert from 'node:assert/strict';
import test from 'node:test';
import { recommendedIds, seedOfDate, shuffleIds } from './feed-order.ts';

const ids = Array.from({ length: 120 }, (_, index) => `gn:1:${index + 1}`);

test('같은 날에는 추천 순서가 그대로 유지됩니다', () => {
  assert.deepEqual(recommendedIds(ids, '2026-11-24'), recommendedIds(ids, '2026-11-24'));
  assert.equal(seedOfDate('2026-11-24'), seedOfDate('2026-11-24'));
});

test('날이 바뀌면 추천 순서도 달라집니다', () => {
  assert.notDeepEqual(recommendedIds(ids, '2026-11-24'), recommendedIds(ids, '2026-11-25'));
});

test('섞은 결과에도 모든 구절이 한 번씩 남습니다', () => {
  const shuffled = recommendedIds(ids, '2026-11-24');
  assert.equal(shuffled.length, ids.length);
  assert.deepEqual([...shuffled].sort(), [...ids].sort());
});

test('섞어도 원래 구절 목록은 바뀌지 않습니다', () => {
  const original = [...ids];
  shuffleIds(ids, 12345);
  assert.deepEqual(ids, original);
});

test('구절이 없거나 하나여도 그대로 돌려줍니다', () => {
  assert.deepEqual(shuffleIds([], 7), []);
  assert.deepEqual(shuffleIds(['gn:1:1'], 7), ['gn:1:1']);
});
