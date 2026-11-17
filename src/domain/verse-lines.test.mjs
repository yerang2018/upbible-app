import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { layoutVerseLines, verseLineWidth } from './verse-lines.ts';

const books = JSON.parse(readFileSync(new URL('../data/krv.json', import.meta.url), 'utf8'));
const metrics = JSON.parse(readFileSync(new URL('../data/verse-font-metrics.json', import.meta.url), 'utf8'));

test('문자 폭은 앱에 포함한 실제 글꼴과 일치하며 본문의 모든 문자를 포함합니다', () => {
  const font = readFileSync(new URL('../../assets/fonts/NanumMyeongjo-Regular.ttf', import.meta.url));
  assert.equal(createHash('sha256').update(font).digest('hex'), metrics.fontSha256);
  for (const text of books.flatMap(book => book.chapters.flat())) {
    for (const char of text) assert.notEqual(metrics.widths[char], undefined);
  }
});

test('전체 31,103개 항목을 화면 너비 4종·글자 크기 3종에서 빠짐없이 배치합니다', () => {
  for (const screenWidth of [320, 375, 390, 430]) {
    for (const fontSize of [22, 26, 30]) {
      const bodyWidth = screenWidth - 156;
      const bodyHeight = 320;
      for (const text of books.flatMap(book => book.chapters.flat())) {
        const { pages, rowHeight, safeWidth } = layoutVerseLines(text, bodyWidth, bodyHeight, fontSize, metrics);
        assert.equal(pages.flat().join(''), `“${text}”`);
        for (const lines of pages) {
          assert.ok(lines.length * rowHeight + 8 <= bodyHeight);
          for (const line of lines) assert.ok(verseLineWidth(line, fontSize, metrics) <= safeWidth + 0.001);
        }
      }
    }
  }
});

test('아가 3:3의 마지막 어절과 닫는 따옴표도 표시할 줄에 포함합니다', () => {
  const text = books.find(book => book.abbrev === 'ct').chapters[2][2];
  for (const fontSize of [22, 26, 30]) {
    const { pages } = layoutVerseLines(text, 234, 450, fontSize, metrics);
    assert.ok(pages.flat().join('').endsWith('너희가 보았느냐 하고”'));
  }
});
