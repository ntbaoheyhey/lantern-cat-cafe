import { expect, it } from 'vitest';
import * as R from './index';
import { playRun } from './run-bot';
const take = (r: R.RuleResult<R.DepthAccount>) => { if (!r.ok) throw Error(r.error); return r.state; };
const SEEDS = [11, 12, 13, 14, 15, 16, 17, 18];
function fresh(seed: number) {
  let s = R.createDepthAccount(seed, 0);
  s = R.setGameplayV4(s, true); s = R.setSkillsV5(s, true); s = R.setGameplayA6(s, true); s = R.setFormationC2(s);
  s.economyV3 = false;
  return s;
}
/** What the café asks a player to do between routes: equip drops, then spend earnings on the best upgrade. */
function improve(s: R.DepthAccount) {
  const equip = (x: R.DepthAccount) => { const e = R.autoEquipA6(x); return e.ok ? e.state : x; };
  s = equip(s);
  for (let i = 0; i < 60; i++) {
    const option = R.upgradeOptionsA6(s)[0]; if (!option) break;
    const next = R.applyUpgradeA6(s, option.change); if (!next.ok) break; s = next.state;
  }
  return equip(s);
}
/** Plays chapters 1–3 once each, one calendar day apart; returns the chapters cleared. */
function campaign(seed: number, between: (s: R.DepthAccount) => R.DepthAccount) {
  let s = fresh(seed), now = 0;
  for (const chapter of [1, 2, 3]) {
    if (chapter > 1 && !s.cleared.includes(chapter - 1)) break;
    s = playRun(take(R.startRun(between(s), chapter, seed * 1000 + chapter)), 'auto');
    now += 86400000; s = take(R.syncCalendarDay(s, now));
  }
  return s.cleared;
}
it('lets a crew that equips its drops and spends its earnings clear all three chapters first try', () => {
  for (const seed of SEEDS) expect(campaign(seed, improve), `seed ${seed}`).toEqual([1, 2, 3]);
});
it('keeps chapter 3 a real test: an untouched starter crew loses it on most seeds', () => {
  const untouchedClears = SEEDS.filter(seed => campaign(seed, s => s).includes(3)).length;
  expect(untouchedClears).toBeLessThanOrEqual(2);
});
