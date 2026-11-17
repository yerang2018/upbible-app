const initials = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
export function matchesBookName(name: string, query: string) {
  const value = name.normalize('NFC').replace(/\s/g, '');
  const search = query.normalize('NFC').replace(/\s/g, '');
  if (!search) return true;
  const characters = Array.from(value);
  return Array.from(search).every((char, index) => {
    const target = characters[index];
    if (!target) return false;
    const code = target.codePointAt(0)!;
    return char === target || (initials.includes(char) && code >= 0xac00 && code <= 0xd7a3
      && initials[Math.floor((code - 0xac00) / 588)] === char);
  });
}
