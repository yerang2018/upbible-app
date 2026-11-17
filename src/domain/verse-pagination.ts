// 화면에 맞지 않는 부분만 어절 경계에서 나눕니다. 원문의 공백까지 보존합니다.
export function splitVersePart(text: string): string[] {
  const midpoint = text.length / 2;
  const boundaries = [...text.matchAll(/\s+/g)]
    .map(match => match.index + match[0].length)
    .filter(index => index > 0 && index < text.length);
  const boundary = boundaries.sort((a, b) => Math.abs(a - midpoint) - Math.abs(b - midpoint))[0];
  if (boundary !== undefined) return [text.slice(0, boundary), text.slice(boundary)];
  const characters = Array.from(text);
  if (characters.length < 2) return [text];
  const middle = Math.ceil(characters.length / 2);
  return [characters.slice(0, middle).join(''), characters.slice(middle).join('')];
}

// Text의 바깥 상자 높이와 달리 실제 마지막 줄의 아래 끝까지 확인합니다.
// 명조 글꼴의 획과 소수점 반올림을 위해 아래쪽 여유를 둡니다.
export function measureVerseLines(lines: readonly { x: number; y: number; width: number; height: number }[], bodyWidth: number) {
  return {
    height: Math.ceil(Math.max(0, ...lines.map(line => line.y + line.height))) + 8,
    overflowsWidth: lines.some(line => line.width > bodyWidth + 1 || line.x + line.width > bodyWidth + 1 || line.x < -1),
  };
}
