import type { Cost } from '../contract';
import { requireRule } from '../internal';
import type { DepthAccount } from './contract';
import { syncCalendarDay } from './bridge';
import { gameplayA6 } from './gameplay-a6';
import { cappedPreviewV4 } from './meta-v4';
import { grantDepth, requireHome, transactDepth } from './state';
import { dailyProgressA6, WEEKLY_POINTS_CAP_A6, type DailyTaskA6 } from './daily-state-a6';

export const DAILY_TASKS_A6: { id: DailyTaskA6; name: string; detail: string; reward: Cost }[] = [
  { id: 'patrol', name: 'A safe walk home', detail: 'Win one patrol or Tower floor.', reward: { stamps: 20, fish: 30 } },
  { id: 'tips', name: 'Evening tips', detail: 'Collect passive Night tips.', reward: { stamps: 20, threads: 5 } },
  { id: 'recruit', name: 'A new seat', detail: 'Invite one cat.', reward: { stamps: 20, fish: 30 } },
  { id: 'train', name: 'A little stronger', detail: 'Raise any cat by one level.', reward: { stamps: 20, threads: 5 } },
  { id: 'gear', name: 'Ready for the rain', detail: 'Enhance one piece of gear.', reward: { stamps: 20, fish: 30 } },
];
export const WEEKLY_CHESTS_A6 = [10, 20, 30] as const;
export const LOGIN_GIFTS_A6: Cost[] = [
  { fish: 100, stamps: 40 }, { stamps: 100, threads: 15 }, { fish: 120, threads: 20 },
  { stamps: 100, essence: 3 }, { fish: 150, threads: 30 }, { stamps: 150 }, { stamps: 180, essence: 6 },
];

/** One calendar-aware preview for both the board and its badge. */
export function dailyBoardA6(s: DepthAccount, now: number) {
  const floor = Math.max(s.idle.lastAt, s.v4?.clockWatermark ?? 0, (s.idle.dayKey ?? 0) * 86400000);
  const rollback = !Number.isSafeInteger(now) || now < floor;
  const refreshed = !rollback && Math.floor(now / 86400000) > (s.idle.dayKey ?? Math.floor(s.idle.lastAt / 86400000)) ? syncCalendarDay(s, now) : null;
  const state = refreshed?.ok ? refreshed.state : s, progress = dailyProgressA6(state);
  const blocked = !gameplayA6(s) ? 'Open A6 first.' : rollback ? 'Wait for the cafe clock to catch up.'
    : s.run && !s.run.complete ? 'Finish your patrol first.' : null;
  const rewardState = (requested: Cost, eligible: boolean, claimed: boolean) => {
    const reward = cappedPreviewV4(state, requested);
    const reason = blocked ?? (claimed ? 'Already collected.' : !eligible ? 'Keep playing to unlock this gift.'
      : !Object.values(reward).some(n => n > 0) ? 'Today’s supplies are full.' : null);
    return { requested, reward, reason, claimed };
  };
  const tasks = DAILY_TASKS_A6.map(t => ({ ...t, complete: progress.completed.includes(t.id),
    ...rewardState(t.reward, progress.completed.includes(t.id), progress.claimed.includes(t.id)) }));
  const weekly = WEEKLY_CHESTS_A6.map(points => ({ points,
    ...rewardState({ stamps: points * 4, threads: points }, progress.weeklyPoints >= points, progress.weeklyClaims.includes(points)) }));
  const login = { gift: progress.loginGifts + 1,
    ...rewardState(LOGIN_GIFTS_A6[progress.loginGifts] ?? {}, progress.loginGifts < 7, progress.loginDay >= state.account.day || progress.loginGifts >= 7) };
  return { state, progress, tasks, weekly, login, rollback, weekDaysLeft: 7 - (state.account.day - 1) % 7,
    taskWeeklyPointGain: Math.max(0, Math.min(1, WEEKLY_POINTS_CAP_A6 - progress.weeklyPoints)) };
}

export function claimDailyA6(state: DepthAccount, now: number, kind: 'task' | 'weekly' | 'login', id?: string | number) {
  return transactDepth(state, s => {
    requireHome(s);
    requireRule(['task', 'weekly', 'login'].includes(kind), 'UNKNOWN_ID', 'Choose a gift from the board.');
    const board = dailyBoardA6(s, now);
    const selected = kind === 'task' ? board.tasks.find(t => t.id === id) : kind === 'weekly' ? board.weekly.find(w => w.points === id) : board.login;
    requireRule(selected, 'UNKNOWN_ID', 'Choose a gift from the board.');
    requireRule(!selected.reason, 'NOT_READY', selected.reason ?? '');
    Object.assign(s, board.state);
    grantDepth(s, selected.reward);
    const p = dailyProgressA6(s);
    if (kind === 'task') { p.claimed.push(id as DailyTaskA6); p.weeklyPoints = Math.min(WEEKLY_POINTS_CAP_A6, p.weeklyPoints + 1); }
    if (kind === 'weekly') p.weeklyClaims.push(id as number);
    if (kind === 'login') { p.loginDay = s.account.day; p.loginGifts++; }
    s.dailyA6 = p;
    s.v4!.clockWatermark = now;
  });
}
