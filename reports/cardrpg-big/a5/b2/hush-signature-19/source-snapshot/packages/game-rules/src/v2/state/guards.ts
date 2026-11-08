import { V2_CONFIG } from '../config';
import { CONFIG } from '../../config';
import { CHAPTERS } from '../content';
import { applyBossResult, applyCraft, applyRelicForge, applySalvage, lockItem } from './apply';
import { chooseClass, equip } from './equip';
import type { PlayerStateV2, StateRefusalV2, StateResultV2 } from './types';

/**
 * Client-side pre-checks. Each one runs the same pure rule the Edge Function runs (or a guard
 * the function repeats before calling its RPC), so a refusal here carries exactly the code the
 * server would answer. null means "the server's pure rules would not block this".
 */
export type GuardResultV2 = StateRefusalV2 | null;

/** Mirrors MIN_CLAIM_INTERVAL_SECONDS in supabase/functions/_shared/game.ts (a test keeps them equal). */
export const MIN_CLAIM_INTERVAL_SECONDS_V2 = 10;

const refusal = (result: StateResultV2<object>): GuardResultV2 => (result.ok ? null : result);

export function guardChooseClass(state: PlayerStateV2, classId: string): GuardResultV2 {
  return refusal(chooseClass(state, classId));
}

export function guardEquip(state: PlayerStateV2, itemId: string | null, slot: string): GuardResultV2 {
  return refusal(equip(state, itemId, slot));
}

export function guardCraft(state: PlayerStateV2, recipeId: string, slot: string): GuardResultV2 {
  return refusal(applyCraft(state, recipeId, slot, 0, 0));
}

export function guardSalvage(state: PlayerStateV2, itemIds: string[]): GuardResultV2 {
  return refusal(applySalvage(state, itemIds));
}

export function guardLock(state: PlayerStateV2, itemId: string): GuardResultV2 {
  return refusal(lockItem(state, itemId, true));
}

export function guardRelicForge(state: PlayerStateV2, today: string): GuardResultV2 {
  return refusal(applyRelicForge(state, today));
}

/** nowS is unix seconds. A loss path is used so only the refusals (never the chest) are exercised. */
export function guardBoss(state: PlayerStateV2, chapter: number, nowS: number): GuardResultV2 {
  if (!Number.isInteger(chapter) || chapter < 1 || chapter > CHAPTERS.length) return { ok: false, code: 'invalid_request' };
  return refusal(applyBossResult(state, {
    won: false, chapter, chest: { stackDeltas: {}, items: [] },
    keyCost: V2_CONFIG.boss.keyCost, cooldownS: V2_CONFIG.boss.lossCooldownSeconds, now: nowS,
  }));
}

export interface ClaimGuardV2 {
  refusal: GuardResultV2;
  /** Seconds the server would pay for: 0 on rewind or inside the minimum interval, else capped. */
  creditedSeconds: number;
  /** The clock is behind the last claim; the server pays nothing and a client should resync. */
  clockRewound: boolean;
  /** The gap exceeded the offline cap (for example a >30-day absence); the extra is dropped, not refused. */
  capped: boolean;
}

/** lastClaimMicros is the server's last claim time; nowMs the (server-corrected) current time. */
export function guardClaim(state: PlayerStateV2, nowMs: number, lastClaimMicros: number): ClaimGuardV2 {
  const elapsed = nowMs / 1000 - lastClaimMicros / 1e6;
  const valid = Number.isFinite(elapsed);
  const clockRewound = valid && elapsed < 0;
  const tooSoon = !valid || elapsed < MIN_CLAIM_INTERVAL_SECONDS_V2;
  return {
    refusal: state.classId ? null : { ok: false, code: 'no_class' },
    creditedSeconds: tooSoon ? 0 : Math.min(elapsed, CONFIG.idle.offlineCapSeconds),
    clockRewound,
    capped: !tooSoon && elapsed > CONFIG.idle.offlineCapSeconds,
  };
}
