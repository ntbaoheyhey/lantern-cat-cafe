import type { DepthAccount } from './contract';

export type DailyTaskA6 = 'patrol' | 'tips' | 'recruit' | 'train' | 'gear';
export const WEEKLY_POINTS_CAP_A6 = 35;
export interface DailyProgressA6 {
  day: number;
  completed: DailyTaskA6[];
  claimed: DailyTaskA6[];
  week: number;
  weeklyPoints: number;
  weeklyClaims: number[];
  loginDay: number;
  loginGifts: number;
}

/** Pure preview. Older A6 saves acquire this optional record only on a mutation. */
export function dailyProgressA6(s: DepthAccount): DailyProgressA6 {
  const day = s.account.day, week = Math.floor((day - 1) / 7), old = s.dailyA6;
  return {
    day, week,
    completed: old?.day === day ? [...old.completed] : [],
    claimed: old?.day === day ? [...old.claimed] : [],
    weeklyPoints: old?.week === week ? old.weeklyPoints : 0,
    weeklyClaims: old?.week === week ? [...old.weeklyClaims] : [],
    loginDay: old?.loginDay ?? 0,
    loginGifts: old?.loginGifts ?? 0,
  };
}

/** Successful public mutations mark activities once; no previews or OFF saves change. */
export function observeDailyA6(before: DepthAccount, after: DepthAccount): void {
  if (!after.gameplayA6) return;
  const p = dailyProgressA6(after);
  const mark = (task: DailyTaskA6) => { if (!p.completed.includes(task)) p.completed.push(task); };
  if (after.run?.complete && after.run.won && (!before.run?.complete || before.run.id !== after.run.id)) mark('patrol');
  if (after.account.daily.service > (before.account.day === after.account.day ? before.account.daily.service : 0)) mark('tips');
  if (after.account.daily.draws > (before.account.day === after.account.day ? before.account.daily.draws : 0)
      || after.freeInvite && !before.freeInvite) mark('recruit');
  if (after.account.cards.some(c => c.level > (before.account.cards.find(old => old.id === c.id)?.level ?? c.level))) mark('train');
  if (after.gear.some(g => g.enhancement > (before.gear.find(old => old.id === g.id)?.enhancement ?? g.enhancement))) mark('gear');
  after.dailyA6 = p;
}
