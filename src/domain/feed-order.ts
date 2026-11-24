// 추천(랜덤) 피드의 순서를 만드는 순수 계산입니다.
// 날짜를 씨앗으로 쓰므로 같은 날에는 순서가 그대로 유지되고 날이 바뀌면 새로 섞입니다.
// (앱을 다시 열거나 화면을 오가도 읽던 자리가 튀지 않게 하기 위해서입니다.)

// 날짜 문자열을 32비트 정수 씨앗으로 바꿉니다(FNV-1a).
export function seedOfDate(date: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < date.length; index += 1) {
    hash ^= date.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

// 씨앗이 같으면 같은 순서가 나오는 작은 난수 생성기입니다(mulberry32).
function randomOf(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(value ^ (value >>> 15), value | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleIds(ids: readonly string[], seed: number): string[] {
  const random = randomOf(seed);
  const result = [...ids];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

export function recommendedIds(ids: readonly string[], date: string): string[] {
  return shuffleIds(ids, seedOfDate(date));
}
