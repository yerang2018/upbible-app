// 앱에 포함된 TTF의 cmap(format 4)·hmtx에서 성경 본문에 쓰이는 문자 폭을 추출합니다.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const root = new URL('../', import.meta.url);
const font = readFileSync(new URL('assets/fonts/NanumMyeongjo-Regular.ttf', root));
const u16 = offset => font.readUInt16BE(offset);
const i16 = offset => font.readInt16BE(offset);
const u32 = offset => font.readUInt32BE(offset);
const tables = {};
for (let i = 0; i < u16(4); i++) {
  const offset = 12 + i * 16;
  tables[font.toString('ascii', offset, offset + 4)] = u32(offset + 8);
}
const cmap = tables.cmap;
let format4;
for (let i = 0; i < u16(cmap + 2); i++) {
  const offset = cmap + u32(cmap + 4 + i * 8 + 4);
  if (u16(offset) === 4) format4 = offset;
}
if (format4 === undefined) throw new Error('지원하는 cmap이 없습니다.');
const segments = u16(format4 + 6) / 2;
const ends = format4 + 14;
const starts = ends + segments * 2 + 2;
const deltas = starts + segments * 2;
const ranges = deltas + segments * 2;
function glyph(code) {
  for (let i = 0; i < segments; i++) {
    if (code < u16(starts + i * 2) || code > u16(ends + i * 2)) continue;
    const delta = i16(deltas + i * 2);
    const range = u16(ranges + i * 2);
    if (!range) return (code + delta) & 65535;
    const id = u16(ranges + i * 2 + range + (code - u16(starts + i * 2)) * 2);
    return id ? (id + delta) & 65535 : 0;
  }
  return 0;
}
const books = JSON.parse(readFileSync(new URL('src/data/krv.json', root), 'utf8'));
const chars = new Set('“”' + books.flatMap(book => book.chapters.flat()).join(''));
const widths = {};
const metricsCount = u16(tables.hhea + 34);
for (const char of [...chars].sort()) {
  const id = glyph(char.codePointAt(0));
  if (!id) throw new Error(`글꼴에 없는 문자: ${JSON.stringify(char)}`);
  widths[char] = u16(tables.hmtx + Math.min(id, metricsCount - 1) * 4);
}
const output = { fontSha256: createHash('sha256').update(font).digest('hex'), unitsPerEm: u16(tables.head + 18), widths };
writeFileSync(new URL('src/data/verse-font-metrics.json', root), JSON.stringify(output) + '\n');
console.log(`글꼴 폭 추출: ${chars.size}문자`);
