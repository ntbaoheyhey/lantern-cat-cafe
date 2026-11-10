import { progress, requireRule } from '../internal';
import type { DepthAccount } from './contract';
import { gameplayA6 } from './gameplay-a6';
import { cappedPreviewV4 } from './meta-v4';
import { syncCalendarDay } from './bridge';
import { grantDepth, requireHome, transactDepth } from './state';

const MINUTE = 60000, DAY = 86400000;
export const IDLE_CAP_HOURS_A6 = 12;
export const FAST_REWARDS_A6 = 2;

/** Progress comes from earned combat stars, including an unfinished chapter. */
export function idleStageA6(s: DepthAccount): number {
  return Math.max(0, ...s.cleared.map(c => c * 7), ...Object.values(s.v4?.journey?.stars ?? {})
    .filter(r => r.conditions[0] && ['battle', 'elite', 'boss'].includes(r.kind))
    .map(r => (r.chapter - 1) * 7 + Number(r.nodeId.split('-')[0]) + 1));
}

export function idleChestA6(s: DepthAccount, now: number, fast = false) {
  const floor = Math.max(s.idle.lastAt, s.v4?.clockWatermark ?? 0, (s.idle.dayKey ?? 0) * DAY);
  const rollback = !Number.isSafeInteger(now) || now < floor, effective = rollback ? floor : now;
  const previousDay = s.idle.dayKey ?? Math.floor(s.idle.lastAt / DAY);
  const refreshed = Math.floor(effective / DAY) > previousDay ? syncCalendarDay(s, effective) : null;
  const state = refreshed?.ok ? refreshed.state : s;
  const day = Math.floor(effective / DAY), used = state.idle.a6?.fastDay === day ? state.idle.a6.fastClaims : 0;
  const elapsed = Math.min(IDLE_CAP_HOURS_A6 * 3600, Math.max(0, Math.floor((effective - s.idle.lastAt) / 1000)));
  const minutes = fast ? 60 : Math.floor(elapsed / 60), stage = idleStageA6(s);
  const reward = cappedPreviewV4(state, {
    fish: Math.floor(minutes * (1 + stage * .08)),
    threads: Math.floor(minutes * (.15 + stage * .01)),
    stamps: Math.floor(minutes * (.25 + stage * .015)),
  });
  const remaining = Math.max(0, FAST_REWARDS_A6 - used);
  const reason = !gameplayA6(s) ? 'Open A6 first.' : rollback ? 'Wait for the cafe clock to catch up.'
    : s.run && !s.run.complete ? 'Finish your patrol first.'
    : fast && !remaining ? 'Two fast rewards collected. More tomorrow.'
    : !fast && minutes < 10 ? 'Tips are ready every ten minutes.'
    : !Object.values(reward).some(n => n > 0) ? 'Today’s supplies are full. Your tips can wait.' : null;
  return { elapsed, effectiveMinutes: minutes, claims: reason ? 0 : 1, capHours: IDLE_CAP_HOURS_A6,
    remaining, reward, rollback, now: effective, readyAt: Math.max(effective, s.idle.lastAt + 10 * MINUTE), stage, reason };
}

export function claimIdleA6(state: DepthAccount, now: number, fast = false) {
  return transactDepth(state, s => {
    requireHome(s);
    const p = idleChestA6(s, now, fast);
    requireRule(!p.reason, 'NOT_READY', p.reason ?? '');
    const refreshed = syncCalendarDay(s, now);
    requireRule(refreshed.ok, 'NOT_READY', 'The cafe calendar is unavailable.');
    Object.assign(s, refreshed.state);
    grantDepth(s, p.reward);
    if (fast) s.idle.a6 = { fastDay: Math.floor(now / DAY), fastClaims: FAST_REWARDS_A6 - p.remaining + 1 };
    else {
      s.idle.lastAt = now;
      s.account.daily.service = Math.min(2, s.account.daily.service + 1);
      progress(s.account, 'service');
    }
    s.v4!.clockWatermark = now;
  });
}
