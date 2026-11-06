import { expect, it } from 'vitest';
import { createStarterAccount } from '../state';
import { battleCats, createDepthAccount } from './state';
import { act, createBattle, legalChoices, replayBattle } from './battle';
import { exportSave, importSave, saveChecksum } from './save';
import { enterNode, startRun } from './run';

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
  expect(next.version).toBe('0.6.0');
  expect(next.account.currencies).toEqual(legacy.currencies);
  expect(next.account.cards).toEqual(legacy.cards);
  expect(next.gear).toHaveLength(legacy.inventory.items.length);
  expect(next.idle.lastAt).toBe(1234);
  expect(importSave(exportSave(next))).toEqual(next);
});

it('migrates a 0.5 save with a partially played three-skill battle and recorded replay', () => {
  let state = startRun(createDepthAccount(42), 1, 42).state;
  state = enterNode(state, '0-0').state;
  const battle = state.run!.battle!;
  act(battle, legalChoices(battle)[0]!);
  state.lastChoices = [...battle.choices];
  for (const card of state.account.cards) card.level = 6;
  const old = JSON.parse(JSON.stringify(state));
  old.version = '0.5.0';
  old.run.battle.version = '0.5.0';
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
