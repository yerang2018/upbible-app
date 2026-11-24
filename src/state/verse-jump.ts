// MY 목록에서 고른 구절을 쇼츠 탭이 이어받도록 잠깐 보관합니다.
// 화면 이동 사이에만 쓰고 바로 비우므로 저장하지 않습니다.
let pending: string | null = null;

export function requestVerseJump(id: string) {
  pending = id;
}

export function consumeVerseJump() {
  const id = pending;
  pending = null;
  return id;
}
