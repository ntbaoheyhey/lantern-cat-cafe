import { clone } from '../internal';
import { describe, expect, it } from 'vitest';
import * as R from './index';

const account = () => {
  const s = R.setGameplayA6(R.createDepthAccount(37, 0), true);
  s.account.currencies.fish = 5000;
  s.account.currencies.threads = 500;
  return s;
};
describe('A6 Power and useful upgrades', () => {
  it('uses the same full-health Power on the roster and the actual battle actors', () => {
    const s = account();
    const battle = R.createBattle({ seed: 4, chapter: 1, cats: R.battleCats(s), enemies: [R.CHAPTERS[0]!.pool[0]!], gameplayV4: true, skillsV5: true, gameplayA6: true });
    expect(battle.actors.filter(a => a.side === 'party').reduce((sum, a) => sum + R.powerScoreA6(a), 0)).toBe(R.teamPowerV4(s));
    expect(R.powerScoreA6({ hp: 100, attack: 10, defense: 5 })).toBe(475);
    const actor=battle.actors[0]!;
    expect(R.powerScoreA6({...actor,hp:1})).toBe(R.powerScoreA6(actor));
  });
  it('previews an affordable improvement without spending and rejects a repeated stale click', () => {
    const s = account(), before = clone(s);
    const option = R.upgradeOptionsA6(s)[0]!;
    expect(option.after).toBeGreaterThan(option.before);
    expect(s).toEqual(before);
    const applied = R.applyUpgradeA6(s, option.change, option.expectedBuild);
    expect(applied.ok).toBe(true);
    expect(R.teamPowerV4(applied.state)).toBe(option.after);
    for (const [id, amount] of Object.entries(option.cost)) if (id !== 'shards')
      expect(s.account.currencies[id as keyof typeof s.account.currencies] - applied.state.account.currencies[id as keyof typeof s.account.currencies]).toBe(amount);
    const repeated = R.applyUpgradeA6(applied.state, option.change, option.expectedBuild);
    expect(repeated.ok).toBe(false);
    expect(repeated.state).toBe(applied.state);
  });
  it('never offers an unaffordable purchase or changes a committed route', () => {
    const s = account();
    for (const id of Object.keys(s.account.currencies) as Array<keyof typeof s.account.currencies>) s.account.currencies[id] = 0;
    expect(R.upgradeOptionsA6(s)).toEqual([]);
    const active = R.startRun(account(), 1, 17).state;
    expect(R.upgradeOptionsA6(active)).toEqual([]);
    expect(R.autoEquipA6(active).state).toBe(active);
    expect(R.autoEquipA6(active).ok).toBe(false);
    expect(R.upgradeOptionsA6(R.setGameplayA6(account(), false))).toEqual([]);
  });
  it('equips owned improvements without stealing a current teammate’s gear or spending currency', () => {
    const s = account();
    s.gear = []; s.equipment = {};
    const mochi = R.makeGear(s, 'hearthloom-weapon-common', 1);
    const soot = R.makeGear(s, 'moonwick-weapon-rare', 2);
    const spare = R.makeGear(s, 'mossbrew-outfit-common', 3);
    s.gear.push(mochi, soot, spare);
    s.equipment.mochi = { weapon: mochi.id }; s.equipment.soot = { weapon: soot.id };
    const before = clone(s), equipped = R.autoEquipA6(s);
    expect(equipped.ok).toBe(true);
    expect(equipped.state.equipment.soot?.weapon).toBe(soot.id);
    expect(equipped.state.account.currencies).toEqual(s.account.currencies);
    expect(R.teamPowerV4(equipped.state)).toBeGreaterThan(R.teamPowerV4(s));
    expect(s).toEqual(before);
    const ids = Object.values(equipped.state.equipment).flatMap(Object.values);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

it('previews immutable gear and equips the same legal best item without consuming it', () => {
  const s = R.setGameplayA6(R.createDepthAccount(31, 0), true);
  const gear = R.makeGear(s, 'hearthloom-weapon-epic', 4);
  s.gear.push(gear);
  const frozen = (value: unknown): void => { if (value && typeof value === 'object') { Object.freeze(value); Object.values(value).forEach(frozen); } };
  frozen(s);
  const before = R.teamPowerV4(s), projected = R.itemUtilityV4(s, s.team[0]!, gear);
  expect(projected).toBeGreaterThan(0);
  const equipped = R.autoEquipA6(s);
  expect(equipped.ok).toBe(true);
  expect(R.teamPowerV4(equipped.state)).toBeGreaterThan(before);
  expect(equipped.state.gear).toEqual(s.gear);
  expect(equipped.state.account.currencies).toEqual(s.account.currencies);
  expect(R.teamPowerV4(s)).toBe(before);
});
