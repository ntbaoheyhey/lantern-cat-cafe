import { expect, it } from 'vitest';
import * as R from './index';
const ready = () => R.acceptRelicSnapshot(R.setGameplayA6(R.createDepthAccount(11, 0), true), 43113, R.RELIC_FIXTURE).state;
it('gives every active cat at most eight percent while retaining ordinary equipment', () => {
  const before = ready(), after = R.selectRelic(before, 4).state;
  expect(R.relicBonusA6(after)).toBe(800);
  for (const id of before.team) {
    const a = R.depthStats(before, id), b = R.depthStats(after, id);
    for (const stat of ['hp', 'attack', 'defense'] as const) expect(b[stat]).toBe(Math.floor(a[stat] * 1.08));
    expect(R.equippedItems(after, id)).toEqual(R.equippedItems(before, id));
  }
  expect(R.battleCats(after).map(c => c.bonuses)).toEqual(R.battleCats(before).map(c => c.bonuses));
  expect(R.teamPowerV4(after)).toBeGreaterThan(R.teamPowerV4(before));
  expect(R.relicBonusA6(R.selectRelic(after, null).state)).toBe(0);
});
it('never stacks copies or holdings, and clears transferred or invalid selections', () => {
  let s = ready();
  s = R.acceptRelicSnapshot(s, 43113, R.RELIC_FIXTURE.map(r => ({ ...r, balance: '999999999999999999999' }))).state;
  s = R.selectRelic(s, 4).state;
  expect(R.relicBonusA6(s)).toBe(800);
  const empty = R.acceptRelicSnapshot(s, 43113, []);
  expect(empty.ok).toBe(true); expect(empty.state.selectedRelic).toBeNull(); expect(R.relicBonusA6(empty.state)).toBe(0);
  expect(R.selectRelic(empty.state, 4).ok).toBe(false);
  expect(R.acceptRelicSnapshot(s, 1, R.RELIC_FIXTURE).ok).toBe(false);
  expect(R.acceptRelicSnapshot(s, 43113, [{ id: 4, rarity: 9, balance: '1' }]).ok).toBe(false);
});
it('keeps the existing lead-cat effect when A6 is OFF and scales each supported rarity', () => {
  const a6 = ready();
  for (const relic of R.RELIC_EFFECTS) expect(R.relicBonusA6(R.selectRelic(a6, relic.id).state)).toBe((relic.rarity + 1) * 200);
  const off = R.setGameplayA6(R.selectRelic(a6, 4).state, false);
  expect(R.relicBonusA6(off)).toBe(0);
  const cats = R.battleCats(off);
  expect(cats[0]!.bonuses.openingCharge).toBeGreaterThanOrEqual(8);
  expect(cats.slice(1).every(c => (c.bonuses.openingCharge ?? 0) < 8)).toBe(true);
});
