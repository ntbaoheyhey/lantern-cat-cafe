import { expect, it } from 'vitest';
import { LABELS } from './labels';

// 2026-10-24 09:00 UTC; the next reset (17:00 UTC) is later the same day.
const MORNING = new Date(Date.UTC(2026, 9, 24, 9, 0));
const AFTER_RESET = new Date(Date.UTC(2026, 9, 24, 18, 0));

it('shows the next reset in the given time zone', () => {
  expect(LABELS.resetTime(MORNING, 'America/New_York')).toMatch(/^midnight Vietnam time \(UTC\+7\), (1:00\s?PM|13:00) your time$/);
  expect(LABELS.resetTime(MORNING, 'UTC')).toMatch(/, (5:00\s?PM|17:00) your time$/);
});

it('uses the next reset, so a daylight-saving change is reflected', () => {
  // Reset on 2026-11-02 is after US clocks go back (Nov 1): New York is UTC-5 then, not UTC-4.
  const beforeShift = new Date(Date.UTC(2026, 10, 2, 9, 0));
  expect(LABELS.resetTime(beforeShift, 'America/New_York')).toMatch(/(12:00\s?PM|12:00)/);
  expect(LABELS.resetTime(AFTER_RESET, 'UTC')).toMatch(/(5:00\s?PM|17:00)/);
});

it('keeps just the Vietnam wording for a player already on Vietnam time', () => {
  expect(LABELS.resetTime(MORNING, 'Asia/Ho_Chi_Minh')).toBe('midnight Vietnam time (UTC+7)');
});
