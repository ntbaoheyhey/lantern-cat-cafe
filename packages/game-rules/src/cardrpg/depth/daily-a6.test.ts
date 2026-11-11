import { expect, it } from 'vitest';
import * as R from './index';
import { firstInvitation } from './onboarding';
const ready = () => R.setGameplayA6(R.createDepthAccount(11, 0), true);
const take = (r: R.RuleResult<R.DepthAccount>) => { expect(r.ok, r.error).toBe(true); return r.state; };

it('records real activities once and advances weekly points only on task claims', () => {
  let s = take(R.metaCommand(ready(), { type: 'level', cardId: 'mochi' }));
  expect(R.dailyProgressA6(s).completed).toEqual(['train']);
  expect(R.dailyProgressA6(s).weeklyPoints).toBe(0);
  s = take(R.claimDailyA6(s, 0, 'task', 'train'));
  expect(R.dailyProgressA6(s).weeklyPoints).toBe(1);
  expect(R.claimDailyA6(R.importSave(R.exportSave(s)), 0, 'task', 'train').ok).toBe(false);
  s = take(firstInvitation(s, 4));
  expect(R.dailyProgressA6(s).completed).toContain('recruit');
  s = take(R.claimIdleA6(s, 600000));
  expect(R.dailyProgressA6(s).completed).toContain('tips');
});
it('keeps capped rewards pending and suppresses their available state', () => {
  let s = take(R.metaCommand(ready(), { type: 'level', cardId: 'mochi' }));
  s.account.daily.earned = { ...R.DEPTH_CAPS_V4 };
  const before = R.exportSave(s), board = R.dailyBoardA6(s, 0);
  expect(board.tasks.find(t => t.id === 'train')?.reason).toMatch(/full/);
  expect(R.claimDailyA6(s, 0, 'task', 'train').ok).toBe(false);
  expect(R.exportSave(s)).toBe(before);
  s = take(R.syncCalendarDay(s, 86400000));
  expect(R.dailyProgressA6(s).completed).toEqual([]);
});
it('claims each login gift at most once per calendar day and resists clock rollback', () => {
  let s = take(R.claimDailyA6(ready(), 0, 'login'));
  expect(R.claimDailyA6(R.importSave(R.exportSave(s)), 1000, 'login').ok).toBe(false);
  s = take(R.claimDailyA6(s, 86400000, 'login'));
  expect(R.dailyProgressA6(s).loginGifts).toBe(2);
  expect(R.claimDailyA6(s, 0, 'login').ok).toBe(false);
  for (let d = 2; d < 7; d++) s = take(R.claimDailyA6(s, d * 86400000, 'login'));
  expect(R.dailyProgressA6(s).loginGifts).toBe(7);
  expect(R.claimDailyA6(s, 7 * 86400000, 'login').ok).toBe(false);
});
it('resets weekly points across the existing account week without losing login place', () => {
  const s = ready();
  s.dailyA6 = { day: 1, completed: [], claimed: [], week: 0, weeklyPoints: 30, weeklyClaims: [], loginDay: 1, loginGifts: 1 };
  const claimed = take(R.claimDailyA6(s, 0, 'weekly', 10));
  expect(R.claimDailyA6(R.importSave(R.exportSave(claimed)), 0, 'weekly', 10).ok).toBe(false);
  const next = take(R.syncCalendarDay(claimed, 7 * 86400000));
  expect(R.dailyProgressA6(next)).toMatchObject({ weeklyPoints: 0, weeklyClaims: [], loginGifts: 1 });
});
it('preserves flag-OFF saves and failed transactions exactly', () => {
  const off = R.createDepthAccount(11, 0), bytes = R.exportSave(off);
  expect(R.claimDailyA6(off, 0, 'login').ok).toBe(false);
  expect(R.exportSave(off)).toBe(bytes);
  const result = take(R.metaCommand(off, { type: 'level', cardId: 'mochi' }));
  expect(result.dailyA6).toBeUndefined();
  const s = ready(), before = R.exportSave(s);
  expect(R.claimDailyA6(s, 0, 'task', 'train').ok).toBe(false);
  expect(R.exportSave(s)).toBe(before);
});

it('records gear enhancement and a completed public patrol as the other two daily activities', async () => {
  const { playRun } = await import('./run-bot');
  let s = ready();
  s = take(R.enhanceGear(s, s.gear[0]!.id));
  expect(R.dailyProgressA6(s).completed).toContain('gear');
  // Strong owned cats make this a deterministic victory fixture; rewards still use public settlement.
  for (const c of s.account.cards) c.level = 10;
  s = playRun(take(R.startRun(s, 1, 11)), 'auto');
  expect(s.run?.won).toBe(true);
  expect(R.dailyProgressA6(s).completed).toContain('patrol');
  expect(R.dailyProgressA6(s).weeklyPoints).toBe(0);
  s = take(R.claimDailyA6(s, 0, 'task', 'patrol'));
  expect(R.dailyProgressA6(s).weeklyPoints).toBe(1);
});
