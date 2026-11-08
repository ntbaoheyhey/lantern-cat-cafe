import { expect, it } from 'vitest';
import type { Slot } from '../contract';
import { equipGear } from './equipment';
import { exportSave, importSave, saveChecksum } from './save';
import { createDepthAccount } from './state';

it('round trips a team after every starter equipment slot is unequipped', () => {
  let state = createDepthAccount(37);
  for (const id of state.team) {
    for (const slot of Object.keys(state.equipment[id] ?? {}) as Slot[]) {
      const result = equipGear(state, id, null, slot);
      expect(result.ok).toBe(true);
      state = result.state;
    }
  }
  expect(importSave(exportSave(state))).toEqual(state);
});

it('round trips after an item transfer removes its original starter slot', () => {
  const state = createDepthAccount(37);
  const item = state.equipment.mochi!.weapon!;
  const moved = equipGear(state, 'clover', item);
  expect(moved.ok).toBe(true);
  expect(moved.state.equipment.mochi!.weapon).toBeUndefined();
  expect(importSave(exportSave(moved.state))).toEqual(moved.state);
});

it('reads the typed empty equipment map in current and migrated saves', () => {
  const state = createDepthAccount(37);
  state.equipment = {};
  expect(importSave(exportSave(state))).toEqual(state);
  const legacy = JSON.stringify({ ...state, version: '0.5.0' });
  expect(importSave(`THC5.${saveChecksum(legacy)}.${legacy}`)).toEqual(state);
});

it.each([null, [], 5, { weapon: 5 }, { weapon: null }, { invalid: 'gear' }])(
  'rejects malformed equipment slot maps %#', equipment => {
    const state = createDepthAccount(37);
    Object.assign(state.equipment, { mochi: equipment });
    expect(() => exportSave(state)).toThrow(/unsupported or damaged/);
  },
);

it.each(['missing-item', 'wrong-slot', 'duplicate', 'unowned-card'])(
  'rejects inconsistent equipment references (%s)', problem => {
    const state = createDepthAccount(37);
    const weapon = state.equipment.mochi!.weapon!;
    if (problem === 'missing-item') state.equipment.mochi!.weapon = 'missing-gear';
    if (problem === 'wrong-slot') {
      delete state.equipment.mochi!.weapon;
      state.equipment.mochi!.outfit = weapon;
    }
    if (problem === 'duplicate') state.equipment.clover!.weapon = weapon;
    if (problem === 'unowned-card') state.equipment.unowned = {};
    expect(() => exportSave(state)).toThrow(/unsupported or damaged/);
  },
);
