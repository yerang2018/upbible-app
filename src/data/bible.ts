import raw from './krv.json';
import { createBibleIndex } from '../domain/bible-model';

// 공개 데이터의 개역한글 66권을 포함합니다. 앱 실행 중에는 내려받지 않습니다.
export const books = raw;
export const bible = createBibleIndex(books);
export const attribution = '성경전서 개역한글판';
export const attributionFull = '성경전서 개역한글판 © 대한성서공회 1961';
