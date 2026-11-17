import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const base = new URL('../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('src/data/source.json', base), 'utf8'));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const args = process.argv.slice(2);

try {
  if (args.length && !(args.length === 2 && args[0] === '--source')) {
    throw new Error('사용법: npm run bible:import 또는 npm run bible:import -- --source 원본파일경로');
  }
  let bytes;
  if (args[0] === '--source') {
    bytes = await readFile(args[1]);
  } else {
    const url = `https://raw.githubusercontent.com/thiagobodruk/bible/${manifest.revision}/${manifest.sourcePath}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(45000) });
    if (!response.ok) throw new Error(`원본 다운로드 실패: ${response.status}`);
    bytes = Buffer.from(await response.arrayBuffer());
  }
  if (sha256(bytes) !== manifest.upstreamSha256) {
    throw new Error('원본 파일이 기록된 버전과 다릅니다. 기존 데이터를 유지합니다.');
  }
  const upstream = JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, ''));
  // 본문 문자열에는 어떤 치환이나 교정도 하지 않고 선택한 책만 추출합니다.
  const selected = manifest.expectedBooks.map(book => {
    const found = upstream.find(item => item.abbrev === book.abbrev);
    if (!found) throw new Error(`${book.name}을 원본에서 찾지 못했습니다.`);
    return found;
  });
  const output = Buffer.from(JSON.stringify(selected) + '\n');
  if (sha256(output) !== manifest.bundledSha256) {
    throw new Error('추출 결과가 검토한 데이터와 다릅니다. 기존 데이터를 유지합니다.');
  }
  await writeFile(new URL('src/data/krv.json', base), output);
  console.log(`성경 66권 데이터 추출 완료 · ${output.length.toLocaleString('ko-KR')}바이트`);
} catch (error) {
  console.error(`성경 데이터 가져오기 실패: ${error.message}`);
  process.exitCode = 1;
}
