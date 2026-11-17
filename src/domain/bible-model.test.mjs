import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { createBibleIndex } from './bible-model.ts';

const books = JSON.parse(readFileSync(new URL('../data/krv.json', import.meta.url), 'utf8'));
const bible = createBibleIndex(books);

test('성경 66권 마지막 절까지 빠짐없이 주소로 찾습니다', () => {
  assert.equal(bible.verses.length, 31103);
  assert.equal(new Set(bible.verses.map(v => v.id)).size, 31103);
  assert.equal(bible.verses.at(-1)?.id, 'ap:22:21');
  assert.equal(bible.find('gn:1:1')?.text, books[0].chapters[0][0]);
});

test('1장 마지막 절 다음은 2장 1절입니다', () => {
  const position = bible.positionOf('gn:1:31');
  assert.equal(bible.verses[position + 1].id, 'gn:2:1');
  assert.equal(bible.positionOf('gn:2:1'), 31);
});

test('문맥은 장 경계를 넘고 성경 시작과 끝에서는 범위를 줄입니다', () => {
  assert.deepEqual(bible.context(0).map(v => v.id), ['gn:1:1', 'gn:1:2', 'gn:1:3', 'gn:1:4']);
  const context = bible.context(bible.positionOf('gn:2:1'));
  assert.equal(context[0].id, 'gn:1:29');
  assert.equal(context[3].id, 'gn:2:1');
  assert.equal(context.at(-1)?.id, 'gn:2:4');
  assert.equal(bible.context(bible.verses.length - 1).length, 4);
});

test('이전 판본에만 있거나 잘못된 저장 주소는 처음부터 시작합니다', () => {
  assert.equal(bible.positionOf('unknown:3:16'), 0);
  assert.equal(bible.positionOf('gn:99:1'), 0);
  assert.equal(bible.positionOf(null), 0);
  assert.equal(bible.find('gn:99:1'), undefined);
});

test('66권의 책 경계와 각 장 마지막 절을 정확히 연결합니다', () => {
  assert.equal(books.length, 66);
  assert.equal(books.reduce((sum, book) => sum + book.chapters.length, 0), 1189);
  for (const [index, book] of books.entries()) {
    for (const [chapter, texts] of book.chapters.entries()) {
      const last = bible.find(`${book.abbrev}:${chapter + 1}:${texts.length}`);
      assert.equal(last?.text, texts.at(-1));
    }
    if (index < books.length - 1) {
      const lastChapter = book.chapters.at(-1);
      const position = bible.positionOf(`${book.abbrev}:${book.chapters.length}:${lastChapter.length}`);
      assert.equal(bible.verses[position + 1].id, `${books[index + 1].abbrev}:1:1`);
    }
  }
  assert.equal(bible.find('atos:8:37')?.text, '(없음)');
  assert.ok(bible.find('3jo:1:15'));
  assert.ok(bible.find('jó:42:17'));
});
