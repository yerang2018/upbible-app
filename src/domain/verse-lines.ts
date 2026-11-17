export type FontMetrics = { unitsPerEm: number; widths: Record<string, number> };

export function verseLineWidth(text: string, fontSize: number, metrics: FontMetrics) {
  return Array.from(text).reduce((sum, char) => sum + (metrics.widths[char] ?? metrics.unitsPerEm), 0)
    * fontSize / metrics.unitsPerEm;
}

// iOS의 여러 줄 Text 측정/그리기 차이를 피하기 위해 줄 경계를 직접 정합니다.
// 어절 경계를 우선하며, 긴 어절만 문자 사이에서 나눕니다. 본문은 삭제하지 않습니다.
export function layoutVerseLines(text: string, bodyWidth: number, bodyHeight: number, fontSize: number, metrics: FontMetrics) {
  const chars = Array.from(`“${text}”`);
  const safeWidth = Math.max(fontSize * 2, bodyWidth - fontSize * 0.5);
  const rowHeight = Math.ceil(fontSize * 1.4);
  const rowsPerPage = Math.max(1, Math.floor((bodyHeight - 8) / rowHeight));
  const lines: string[] = [];
  let start = 0;
  while (start < chars.length) {
    let end = start;
    let lastBreak = start;
    let width = 0;
    while (end < chars.length) {
      const nextWidth = verseLineWidth(chars[end], fontSize, metrics);
      if (end > start && width + nextWidth > safeWidth) break;
      width += nextWidth;
      end++;
      if (/\s/.test(chars[end - 1])) lastBreak = end;
    }
    if (end < chars.length && lastBreak > start) end = lastBreak;
    lines.push(chars.slice(start, end).join(''));
    start = end;
  }
  const pages: string[][] = [];
  for (let i = 0; i < lines.length; i += rowsPerPage) pages.push(lines.slice(i, i + rowsPerPage));
  return { pages, rowHeight, safeWidth };
}
