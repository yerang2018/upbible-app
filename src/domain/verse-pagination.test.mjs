import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { measureVerseLines, splitVersePart } from './verse-pagination.ts';

const books = JSON.parse(readFileSync(new URL('../data/krv.json', import.meta.url), 'utf8'));

test('성경 66권 전체의 긴 구절을 반복 분할해도 공백·본문·순서를 보존합니다', () => {
  for (const text of books.flatMap(book => book.chapters.flat())) {
    let parts = [text];
    while (parts.some(part => part.length > 20)) {
      parts = parts.flatMap(part => part.length > 20 ? splitVersePart(part) : [part]);
    }
    assert.equal(parts.join(''), text);
    assert.ok(parts.every(part => part.length > 0));
  }
});

test('가능하면 어절 사이에서 나누고 공백 없는 글자와 이모지도 보존합니다', () => {
  assert.deepEqual(splitVersePart('태초에 하나님이 천지를 창조하시니라'), ['태초에 하나님이 ', '천지를 창조하시니라']);
  assert.deepEqual(splitVersePart('가나다라'), ['가나', '다라']);
  assert.deepEqual(splitVersePart('🙏🌿'), ['🙏', '🌿']);
  assert.deepEqual(splitVersePart('빛'), ['빛']);
});

test('실제 줄의 아래 끝과 가로 넘침을 검사합니다', () => {
  const lines = [
    { x: 0, y: 0, width: 234, height: 30.8 },
    { x: 0, y: 30.8, width: 233, height: 30.8 },
    { x: 0, y: 61.6, width: 260, height: 30.8 },
  ];
  assert.deepEqual(measureVerseLines(lines, 234), { height: 101, overflowsWidth: true });
  assert.equal(measureVerseLines(lines.slice(0, 2), 234).overflowsWidth, false);
  assert.equal(measureVerseLines([{ x: 10, y: 0, width: 230, height: 31 }], 234).overflowsWidth, true);
});

test('신고된 아가 3:3은 끝부분을 포함하며 분할 후에도 그대로 이어집니다', () => {
  const text = books.find(book => book.abbrev === 'ct').chapters[2][2];
  assert.ok(text.endsWith('너희가 보았느냐 하고'));
  const parts = splitVersePart(text);
  assert.equal(parts.join(''), text);
  assert.ok(parts.at(-1).endsWith('너희가 보았느냐 하고'));
});
