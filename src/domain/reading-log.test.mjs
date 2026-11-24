import assert from 'node:assert/strict';
import test from 'node:test';
import {
  dateKeyOf, emptyReadingLog, logVerseRead, readingStreak, restoreReadingLog, todayVerseCount,
} from './reading-log.ts';

const day = '2026-11-24';
const read = (log, id, date = day) => logVerseRead(log, id, date);

test('처음 읽으면 오늘 1절 · 연속 1일이 됩니다', () => {
  const log = read(emptyReadingLog(day), 'gn:1:1');
  assert.equal(todayVerseCount(log, day), 1);
  assert.equal(readingStreak(log, day), 1);
});

test('같은 절을 다시 넘겨도 절 수가 늘지 않습니다', () => {
  const log = read(read(emptyReadingLog(day), 'gn:1:1'), 'gn:1:1');
  assert.equal(todayVerseCount(log, day), 1);
  assert.equal(todayVerseCount(read(log, 'gn:1:2'), day), 2);
});

test('날이 바뀌면 같은 절도 새로 셉니다', () => {
  const log = read(read(emptyReadingLog(day), 'gn:1:1'), 'gn:1:1', '2026-11-25');
  assert.equal(todayVerseCount(log, day), 1);
  assert.equal(todayVerseCount(log, '2026-11-25'), 1);
});

test('이틀 이어 읽으면 연속 2일, 하루를 건너뛰면 1일이 됩니다', () => {
  const two = read(read(emptyReadingLog(day), 'gn:1:1'), 'gn:1:2', '2026-11-25');
  assert.equal(readingStreak(two, '2026-11-25'), 2);
  const broken = read(two, 'gn:1:3', '2026-11-27');
  assert.equal(readingStreak(broken, '2026-11-27'), 1);
});

test('오늘 아직 읽지 않았어도 어제까지의 연속 일수를 지킵니다', () => {
  const log = read(read(emptyReadingLog(day), 'gn:1:1'), 'gn:1:2', '2026-11-25');
  assert.equal(todayVerseCount(log, '2026-11-26'), 0);
  assert.equal(readingStreak(log, '2026-11-26'), 2);
  assert.equal(readingStreak(read(log, 'gn:1:3', '2026-11-28'), '2026-11-28'), 1);
});

test('기록은 최근 90일만 남깁니다', () => {
  let log = emptyReadingLog('2026-01-01');
  for (let index = 0; index < 100; index += 1) {
    const date = dateKeyOf(new Date(2026, 0, 1 + index));
    log = logVerseRead(log, 'gn:1:1', date);
  }
  const dates = Object.keys(log.days).sort();
  assert.equal(dates.length, 90);
  assert.equal(dates[dates.length - 1], dateKeyOf(new Date(2026, 0, 100)));
});

test('깨진 기록에서도 쓸 수 있는 날짜와 숫자만 복원합니다', () => {
  const log = restoreReadingLog({
    days: { [day]: 3, '2026-11-23': 0, '어제': 4, '2026-11-25': -2, '2026-11-26': 1.5, '2026-11-22': 2 },
    date: day,
    seen: ['gn:1:1', 5, null],
  }, day);
  assert.deepEqual(log.days, { [day]: 3, '2026-11-22': 2 });
  assert.deepEqual(log.seen, ['gn:1:1']);
  assert.deepEqual(restoreReadingLog('깨짐', day), { days: {}, date: day, seen: [] });
});

test('날짜는 기기의 지역 시간으로 만듭니다', () => {
  assert.equal(dateKeyOf(new Date(2026, 10, 24, 23, 59)), '2026-11-24');
  assert.equal(dateKeyOf(new Date(2026, 10, 25, 0, 1)), '2026-11-25');
  assert.equal(dateKeyOf(new Date(2026, 0, 1)), '2026-01-01');
});
