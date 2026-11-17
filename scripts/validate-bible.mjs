import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const base = new URL('../', import.meta.url);
const args = process.argv.slice(2);
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

try {
  if (args.length && !(args.length === 2 && args[0] === '--file')) {
    throw new Error('사용법: npm run bible:check 또는 npm run bible:check -- --file 검사파일경로');
  }
  const manifest = JSON.parse(await readFile(new URL('src/data/source.json', base), 'utf8'));
  const bytes = await readFile(args[0] === '--file' ? args[1] : new URL('src/data/krv.json', base));
  const books = JSON.parse(bytes.toString('utf8'));
  const errors = [];
  if (!Array.isArray(books)) throw new Error('책 목록이 배열이 아닙니다.');
  if (books.length !== manifest.expectedBooks.length) errors.push('확인 범위와 책 수가 다릅니다.');
  let totalChapters = 0;
  let totalVerses = 0;
  for (const [index, expected] of manifest.expectedBooks.entries()) {
    const book = books[index];
    if (!book || book.abbrev !== expected.abbrev || book.name !== expected.name) {
      errors.push(`${index + 1}번째 책 이름 또는 순서가 다릅니다.`);
      continue;
    }
    if (!Array.isArray(book.chapters)) { errors.push(`${book.name}: 장 목록이 없습니다.`); continue; }
    if (book.chapters.length !== expected.chapters) errors.push(`${book.name}: ${expected.chapters}장이 아닙니다.`);
    totalChapters += book.chapters.length;
    let verseCount = 0;
    book.chapters.forEach((chapter, chapterIndex) => {
      if (!Array.isArray(chapter)) { errors.push(`${book.name} ${chapterIndex + 1}장: 절 목록 오류`); return; }
      if (chapter.length !== expected.chapterVerseCounts[chapterIndex]) errors.push(`${book.name} ${chapterIndex + 1}장: 절 수가 다릅니다.`);
      verseCount += chapter.length;
      chapter.forEach((text, verseIndex) => {
        const ref = `${book.name} ${chapterIndex + 1}:${verseIndex + 1}`;
        if (typeof text !== 'string' || !text.trim()) errors.push(`${ref}: 본문이 비어 있습니다.`);
        else if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffd]|<[^>]+>/.test(text)) errors.push(`${ref}: 문자 깨짐 또는 HTML이 있습니다.`);
      });
    });
    if (verseCount !== expected.verses) errors.push(`${book.name}: 전체 절 수가 ${expected.verses}절이 아닙니다.`);
    totalVerses += verseCount;
  }
  if (sha256(bytes) !== manifest.bundledSha256) errors.push('본문 파일이 검토한 원본 추출 결과와 달라졌습니다.');
  const license = await readFile(new URL('docs/bible/THIRD_PARTY_LICENSE.txt', base));
  if (sha256(license) !== manifest.dataLicenseSha256) errors.push('전자 데이터 라이선스 원문이 변경되었습니다.');
  if (errors.length) throw new Error(errors.slice(0, 12).join('\n'));
  console.log(`검사 통과 · ${books.length}권 · ${totalChapters}장 · ${totalVerses.toLocaleString('ko-KR')}절`);
  console.log('책·장별 절 수, 빈 본문, 문자 깨짐, 원본 추출 파일 해시, 라이선스 확인');
  console.log('검사 범위: 개역한글 66권의 구조·고정 원본 일치. 대한성서공회 정본 전체와의 단어별 대조는 아닙니다.');
} catch (error) {
  console.error(`성경 데이터 검사 실패:\n${error.message}`);
  process.exitCode = 1;
}
