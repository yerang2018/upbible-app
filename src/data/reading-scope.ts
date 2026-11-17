import { bible } from './bible';

// 사용자 요청으로 개역한글 66권 전체를 노출합니다. 구절 주소와 기존 저장 기록은 유지합니다.
export const feedVerses = bible.verses;

const positions = new Map(feedVerses.map((verse, index) => [verse.id, index]));
export const isInReadingScope = (id: string) => positions.has(id);
export const feedPositionOf = (id: string) => positions.get(id) ?? 0;
