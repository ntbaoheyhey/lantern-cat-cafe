import { expect, it } from 'vitest';
import { createStarterAccount } from '../state';
import { createDepthAccount } from './state';
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
  expect(next.version).toBe('0.5.0');
  expect(next.account.currencies).toEqual(legacy.currencies);
  expect(next.account.cards).toEqual(legacy.cards);
  expect(next.gear).toHaveLength(legacy.inventory.items.length);
  expect(next.idle.lastAt).toBe(1234);
  expect(importSave(exportSave(next))).toEqual(next);
});
