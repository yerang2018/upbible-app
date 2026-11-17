import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { matchesBookName } from './bible-search.ts';
const books = JSON.parse(readFileSync(new URL('../data/krv.json', import.meta.url), 'utf8'));
const results = query => books.filter(book => matchesBookName(book.name, query)).map(book => book.name);

test('ㅊ으로 시작하는 책과 여러 글자의 초성으로 검색합니다', () => {
  assert.deepEqual(results('ㅊ'), ['창세기', '출애굽기']);
  assert.deepEqual(results('ㅊㅅㄱ'), ['창세기']);
  assert.deepEqual(results('창ㅅ'), ['창세기']);
  assert.deepEqual(results('ㅅㅁㅇ'), ['사무엘상', '사무엘하']);
});
test('완성된 이름, 공백, 한글 조합과 없는 이름을 처리합니다', () => {
  assert.deepEqual(results('  창 세 기 '), ['창세기']);
  assert.deepEqual(results('마태'), ['마태복음']);
  assert.deepEqual(results('창세기'.normalize('NFD')), ['창세기']);
  assert.deepEqual(results('없는책'), []);
  assert.equal(results('').length, 66);
  assert.equal(matchesBookName('창세기', '창세기기'), false);
});
