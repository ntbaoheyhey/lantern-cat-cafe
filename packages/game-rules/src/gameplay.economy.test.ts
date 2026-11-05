import { actCafe, advanceCafe, bossReady, createCafe, returnToCafe } from '../client/cafe';
import { describe, expect, it } from 'vitest';
import { CONFIG } from './config';
import * as v2 from './v2';
import { chapterJourney, bonusRollQuality, replayOutcome } from '../client/gameplay';

function starter(classId: v2.ClassId): v2.PlayerStateV2 {
  const empty = v2.emptyState(); if (!empty.ok) throw Error('empty');
  const chosen = v2.chooseClass(empty.state, classId); if (!chosen.ok || !chosen.starterWeapon) throw Error('class');
  const inserted = v2.addItems(chosen.state, [chosen.starterWeapon], v2.V2_CONFIG.bag.limit, v2.salvage);
  if (!inserted.ok) throw Error('starter');
  const equipped = v2.equip(inserted.state, chosen.starterWeapon.id, 'weapon');
  if (!equipped.ok) throw Error('equip');
  return equipped.state;
}

/** Same pure claim/guard/apply path used by the server, including RNG per accepted claim. */
function hour(classId: v2.ClassId, seed: number, times: number[], cosmeticReads: boolean) {
  let state = starter(classId), lastMs = 0, seconds = 0, accepted = 0;
  for (const ms of times) {
    const guard = v2.guardClaim(state, ms, lastMs * 1000);
    if (guard.refusal || guard.creditedSeconds === 0) continue;
    const delta = v2.computeClaimV2(v2.claimInputV2(state, { today: '2026-11-04', offline: false }), guard.creditedSeconds, seed + accepted);
    const result = v2.applyClaim(state, delta);
    if (!result.ok) throw Error(result.code);
    state = result.state; lastMs = ms; seconds += guard.creditedSeconds; accepted++;
    if (cosmeticReads) {
      // Repeated goal, outcome and roll UI reads cannot advance the economy.
      for (let n = 0; n < 3; n++) {
        chapterJourney(state.chapter, state.round, state.kills);
        replayOutcome(true, 100, [{ catHp: 20 }]);
        for (const item of state.items) bonusRollQuality(item.rarity, item.bonus);
      }
    }
  }
  return { state, seconds, accepted };
}

describe('first-session cadence stays inside the server-accepted economy', () => {
  it('credits at most one hour and matches authoritative grants despite repeated requests and UI effects', () => {
    const regular = Array.from({ length: Math.floor((3600_000 - CONFIG.gameplay.firstClaimMs) / CONFIG.gameplay.claimIntervalMs) }, (_, i) => CONFIG.gameplay.firstClaimMs + (i + 1) * CONFIG.gameplay.claimIntervalMs);
    const times = [CONFIG.gameplay.firstClaimMs, ...regular];
    const duplicateClicks = times.flatMap(t => [t, t, t + 1, t + 100]);
    for (const cls of ['warrior', 'guardian', 'rogue'] as const) for (let seed = 1; seed <= 12; seed++) {
      const authoritative = hour(cls, seed, times, false);
      const presented = hour(cls, seed, duplicateClicks, true);
      expect(presented).toEqual(authoritative);
      expect(presented.seconds).toBeLessThanOrEqual(3600);
      expect(presented.accepted).toBe(times.length);
      expect(presented.state.stacks.catKey).toBeLessThanOrEqual(v2.MATERIALS.find(m => m.id === 'catKey')!.maxStack);
    }
  });
  it('never pays early requests or a backward clock and respects the offline cap', () => {
    const state = starter('warrior');
    for (const ms of [-1, 0, CONFIG.gameplay.firstClaimMs - 1]) expect(v2.guardClaim(state, ms, 0).creditedSeconds).toBe(0);
    expect(v2.guardClaim(state, 30 * 86400_000, 0).creditedSeconds).toBe(CONFIG.idle.offlineCapSeconds);
  });
});

describe('Sample adventure cannot enter the server economy or alter replay', () => {
  it('keeps authoritative rewards and replay byte-identical through all local play styles and five seeds', () => {
    for (const seed of [11, 29, 47, 71, 101]) for (const style of ['idle', 'active', 'minmax']) {
      const stats = v2.deriveStats({ classId: 'warrior', level: 10 });
      const boss = v2.bossOfChapter(1), replay = v2.simulateBossV2(stats, 'warrior', boss, seed);
      const times = Array.from({ length: 33 }, (_, i) => CONFIG.gameplay.firstClaimMs + i * CONFIG.gameplay.claimIntervalMs);
      const before = hour('warrior', seed, times, false);
      let local = createCafe(seed);
      for (let t = 0; t < 600; t++) {
        if (style !== 'idle' && local.encounter) local = actCafe(local, { type: 'route', route: style === 'minmax' ? 'risk' : 'study' });
        if (bossReady(local)) local = actCafe(local, { type: 'fight' });
        if (local.boss && style !== 'idle') local = actCafe(local, { type: 'counter', counter: local.boss.counter });
        if (!local.boss && t % 32 === 0 && style !== 'idle') local = actCafe(local, { type: 'craft', set: 'ember', slot: 'paw' });
        local = advanceCafe(local);
      }
      local = returnToCafe(local, 30 * 86400).state;
      expect(local.patches).toBeLessThanOrEqual(CONFIG.cafe.maxPatches);
      expect(local.inventory.length).toBeLessThanOrEqual(CONFIG.cafe.maxItems);
      expect(local).not.toHaveProperty('relics'); expect(local).not.toHaveProperty('stacks'); expect(local).not.toHaveProperty('currencies');
      expect(hour('warrior', seed, times.flatMap(t => [t, t, t + 100]), true)).toEqual(before);
      expect(v2.simulateBossV2(stats, 'warrior', boss, seed)).toEqual(replay);
      expect(before.state.lastRelicDay).toBeNull();
      expect(v2.relicForgeBlockV2({ stacks: before.state.stacks, lastRelicDay: -1 }, 0)).not.toBeNull();
    }
  });
});
