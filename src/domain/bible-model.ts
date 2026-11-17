export type BibleBook = {
  abbrev: string;
  name: string;
  chapters: string[][];
};

export type Verse = {
  id: string;
  bookId: string;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
  chapterLength: number;
};

// 책이 추가되어도 화면은 같은 구절 목록과 주소를 사용합니다.
export function createBibleIndex(books: BibleBook[]) {
  const verses: Verse[] = [];
  const positions = new Map<string, number>();
  for (const book of books) {
    book.chapters.forEach((chapter, chapterIndex) => {
      chapter.forEach((text, verseIndex) => {
        const id = `${book.abbrev}:${chapterIndex + 1}:${verseIndex + 1}`;
        positions.set(id, verses.length);
        verses.push({
          id, bookId: book.abbrev, bookName: book.name,
          chapter: chapterIndex + 1, verse: verseIndex + 1,
          text, chapterLength: chapter.length,
        });
      });
    });
  }

  return {
    verses,
    positionOf(id: string | null | undefined) {
      return (id && positions.get(id)) || 0;
    },
    find(id: string) {
      const position = positions.get(id);
      return position === undefined ? undefined : verses[position];
    },
    context(position: number, radius = 3) {
      const start = Math.max(0, position - radius);
      return verses.slice(start, position + radius + 1);
    },
  };
}

export function reference(verse: Verse) {
  return `${verse.bookName} ${verse.chapter}:${verse.verse}`;
}
