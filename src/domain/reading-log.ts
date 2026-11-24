// 하루에 읽은 절 수와 연속 읽기 일수를 세는 기록입니다.
// 계정 동기화 기록(ReaderRecord)과 섞지 않고 기기 안에만 저장합니다.
// 날짜별 목록만 남기므로 서버 병합 충돌 없이 앱을 다시 열어도 이어집니다.
export type ReadingLog = {
  days: Record<string, number>; // 'YYYY-MM-DD' → 그날 읽은 절 수
  date: string; // seen 목록이 속한 날짜
  seen: string[]; // 같은 날 같은 절을 두 번 세지 않기 위한 목록
};

export const readingLogDays = 90;
const seenLimit = 2500;

// 기기의 지역 시간 기준 날짜를 씁니다. 자정을 넘기면 새 날로 기록됩니다.
export function dateKeyOf(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isDateKey(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function previousDateKey(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  return dateKeyOf(new Date(year, month - 1, day - 1));
}

export function emptyReadingLog(date: string): ReadingLog {
  return { days: {}, date, seen: [] };
}

function pruneDays(days: Record<string, number>) {
  const keys = Object.keys(days).sort();
  if (keys.length <= readingLogDays) return days;
  const kept: Record<string, number> = {};
  for (const key of keys.slice(-readingLogDays)) kept[key] = days[key];
  return kept;
}

// 같은 날 같은 절을 여러 번 넘겨도 한 번만 셉니다.
export function logVerseRead(log: ReadingLog, verseId: string, date: string): ReadingLog {
  if (!verseId || !isDateKey(date)) return log;
  const sameDay = log.date === date;
  const seen = sameDay ? log.seen : [];
  if (seen.includes(verseId)) return log;
  const days = pruneDays({ ...log.days, [date]: (log.days[date] ?? 0) + 1 });
  return { days, date, seen: [...seen, verseId].slice(-seenLimit) };
}

export function todayVerseCount(log: ReadingLog, date: string) {
  return log.days[date] ?? 0;
}

// 오늘 읽었으면 오늘까지, 아직 안 읽었으면 어제까지 이어진 날을 셉니다.
// 자정 직후에 연속 기록이 0으로 보이지 않게 하기 위해서입니다.
export function readingStreak(log: ReadingLog, date: string) {
  let cursor = date;
  if ((log.days[cursor] ?? 0) <= 0) cursor = previousDateKey(cursor);
  let count = 0;
  while ((log.days[cursor] ?? 0) > 0) {
    count += 1;
    cursor = previousDateKey(cursor);
  }
  return count;
}

// 예전 기록이나 깨진 값이 있어도 읽을 수 있는 부분만 살립니다.
export function restoreReadingLog(value: unknown, today: string): ReadingLog {
  const empty = emptyReadingLog(today);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return empty;
  const saved = value as Partial<ReadingLog>;
  const days: Record<string, number> = {};
  if (saved.days && typeof saved.days === 'object' && !Array.isArray(saved.days)) {
    for (const [key, count] of Object.entries(saved.days)) {
      if (!isDateKey(key)) continue;
      if (typeof count !== 'number' || !Number.isSafeInteger(count) || count <= 0) continue;
      days[key] = count;
    }
  }
  const date = isDateKey(saved.date) ? saved.date : today;
  const seen = Array.isArray(saved.seen)
    ? saved.seen.filter((id): id is string => typeof id === 'string' && id.length > 0).slice(-seenLimit)
    : [];
  return { days: pruneDays(days), date, seen };
}
