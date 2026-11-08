import { expect, it } from 'vitest';
import { createStarterAccount } from '../state';
import { battleCats, createDepthAccount } from './state';
import { act, createBattle, legalChoices, replayBattle } from './battle';
import { playBattle } from './policies';
import { exportSave, importSave, saveChecksum } from './save';
import { enterNode, startRun } from './run';
import { clone } from '../internal';
import { ENEMIES, ENEMY_BY_ID } from './catalog';
import type { BattleSetup } from './contract';

// Independently fixed launch values exercise imports after catalogue tuning.
const launchStats: NonNullable<BattleSetup['enemyStats']> = {
  'button-guard': { hp: 210, attack: 48, defense: 25 },
  'sock-skipper': { hp: 165, attack: 54, defense: 8 },
  'spool-ram': { hp: 300, attack: 74, defense: 16 },
  'needle-moth': { hp: 155, attack: 43, defense: 6 },
  'teacup-healer': { hp: 180, attack: 35, defense: 10 },
  'kettle-knight': { hp: 340, attack: 62, defense: 35 },
  'yarn-giant': { hp: 820, attack: 80, defense: 22 },
  'binding-thread': { hp: 90, attack: 25, defense: 0 },
  'practice-cushion': { hp: 230, attack: 14, defense: 0 },
  'pollen-scout': { hp: 270, attack: 54, defense: 10 },
  'rain-spool': { hp: 1050, attack: 85, defense: 24 },
  'crumb-sentinel': { hp: 360, attack: 68, defense: 22 },
  'pantry-crown': { hp: 1220, attack: 92, defense: 25 },
};

it('round trips account, equipment, settings and an active battle', () => {
  let state = createDepthAccount(42, 1000);
  state = startRun(state, 1, 42).state;
  state = enterNode(state, '0-0').state;
  expect(importSave(exportSave(state))).toEqual(state);
});
it('rejects corrupt checksums and unsupported schemas without modifying the input account', () => {
  const state = createDepthAccount();
  expect(() => importSave(exportSave(state).replace('mochi', 'panko'))).toThrow('checksum');
  const payload = JSON.stringify({ version: '99', team: [] });
  expect(() => importSave(`THC5.${saveChecksum(payload)}.${payload}`)).toThrow('structure');
  expect(() => importSave('{"__proto__":{"polluted":true}}')).toThrow();
  expect(state.team).toEqual(['mochi', 'soot', 'clover']);
});
it('migrates a 0.4 account while preserving currencies, items, levels and card identity', () => {
  const legacy = createStarterAccount(18);
  legacy.cards[0]!.level = 4;
  const next = importSave(JSON.stringify(legacy), 1234);
  expect(next.version).toBe('0.7.0');
  expect(next.account.currencies).toEqual(legacy.currencies);
  expect(next.account.cards).toEqual(legacy.cards);
  expect(next.gear).toHaveLength(legacy.inventory.items.length);
  expect(next.idle.lastAt).toBe(1234);
  expect(importSave(exportSave(next))).toEqual(next);
});

it('migrates a 0.5 save with a partially played three-skill battle and recorded replay', () => {
  let state = startRun(createDepthAccount(42), 1, 42).state;
  state = enterNode(state, '0-0').state;
  const battle = createBattle({ ...state.lastBattle!, enemyStats: launchStats });
  state.run!.battle = battle;
  state.lastBattle = clone(battle.initial);
  act(battle, legalChoices(battle)[0]!);
  state.lastChoices = [...battle.choices];
  for (const card of state.account.cards) card.level = 6;
  const old = JSON.parse(JSON.stringify(state));
  old.version = '0.5.0';
  old.run.battle.version = '0.5.0';
  delete old.run.battle.initial.enemyStats;
  delete old.lastBattle.enemyStats;
  const payload = JSON.stringify(old);
  const next = importSave(`THC5.${saveChecksum(payload)}.${payload}`);
  expect(next).toEqual(state);
  expect(next.run!.battle!.actors.filter(actor => actor.side === 'party').every(actor => actor.skills.length === 3)).toBe(true);
  expect(replayBattle(next.lastBattle!, next.lastChoices)).toEqual(battle);
  expect(battleCats(next).every(cat => cat.skills.length === 4)).toBe(true);
  expect(importSave(exportSave(next))).toEqual(next);
});

it('round trips a four-skill encounter without replacing its pending actions', () => {
  let state = createDepthAccount(31);
  for (const card of state.account.cards) card.stars = 3;
  state = enterNode(startRun(state, 1, 31).state, '0-0').state;
  expect(state.run!.battle!.initial.cats.every(cat => cat.skills.length === 4)).toBe(true);
  expect(importSave(exportSave(state))).toEqual(state);
  expect(createBattle(state.run!.battle!.initial)).toEqual(state.run!.battle);
});

for (const version of ['0.5.0', '0.6.0']) it(`preserves ${version} active battles, replays and later summons`, () => {
  const state = startRun(createDepthAccount(42), 1, 42).state;
  const cats = battleCats(state).map(cat => ({ ...cat, stats: { ...cat.stats, hp: 10000, attack: 1 } }));
  const battle = createBattle({ seed: 42, chapter: 2, cats, enemies: ['pollen-scout'], enemyStats: launchStats });
  act(battle, legalChoices(battle)[0]!);
  state.run!.battle = battle;
  state.lastBattle = clone(battle.initial);
  state.lastChoices = [...battle.choices];
  const old = JSON.parse(JSON.stringify(state));
  old.version = version;
  old.run.battle.version = version;
  delete old.lastBattle.enemyStats;
  delete old.run.battle.initial.enemyStats;
  const payload = JSON.stringify(old);
  const next = importSave(`THC${version === '0.5.0' ? '5' : '6'}.${saveChecksum(payload)}.${payload}`);
  expect(next).toEqual(state);
  expect(replayBattle(next.lastBattle!, next.lastChoices)).toEqual(battle);
  const expected = playBattle(clone(battle), 'auto');
  const original = { ...ENEMY_BY_ID['binding-thread']! };
  try {
    Object.assign(ENEMY_BY_ID['binding-thread']!, { hp: 9999, attack: 999, defense: 999 });
    const continued = playBattle(next.run!.battle!, 'auto');
    expect(continued.log.some(event => event.kind === 'summon')).toBe(true);
    expect(continued).toEqual(expected);
    expect(replayBattle(next.lastBattle!, continued.choices)).toEqual(expected);
  } finally { Object.assign(ENEMY_BY_ID['binding-thread']!, original); }
});

it('snapshots current enemy stats for new battles and keeps replays independent of catalogue edits', () => {
  const state = enterNode(startRun(createDepthAccount(42), 1, 42).state, '0-0').state;
  const initial = clone(state.run!.battle!);
  expect(state.lastBattle).toEqual(initial.initial);
  for (const enemy of ENEMIES) expect(initial.initial.enemyStats![enemy.id])
    .toEqual({ hp: enemy.hp, attack: enemy.attack, defense: enemy.defense });
  const expected = playBattle(clone(initial), 'auto');
  const originals = ENEMIES.map(enemy => ({ ...enemy }));
  try {
    for (const enemy of ENEMIES) Object.assign(enemy, { hp: 9999, attack: 999, defense: 999 });
    expect(replayBattle(initial.initial, expected.choices)).toEqual(expected);
    const fresh = createBattle({ ...initial.initial, enemyStats: undefined });
    expect(fresh.actors.find(actor => actor.side === 'enemy')!.maxHp).toBe(9999);
  } finally { ENEMIES.forEach((enemy, index) => Object.assign(enemy, originals[index])); }
});

for (const invalid of [undefined, null, {}, { 'button-guard': { hp: 0, attack: 1, defense: 0 } }]) {
  it(`rejects an incomplete current enemy snapshot ${JSON.stringify(invalid)}`, () => {
    const state = enterNode(startRun(createDepthAccount(42), 1, 42).state, '0-0').state;
    const value = JSON.parse(JSON.stringify(state));
    value.run.battle.initial.enemyStats = invalid;
    const payload = JSON.stringify(value);
    expect(() => importSave(`THC7.${saveChecksum(payload)}.${payload}`)).toThrow('structure');
  });
}
