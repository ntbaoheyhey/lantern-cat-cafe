import { describe, expect, it } from 'vitest';
import type { ServerState } from '../api/GameApi';
import { MockGameApi } from '../api/MockGameApi';
import { nextStep } from './nextStep';

async function base(): Promise<ServerState> {
  const s = await new MockGameApi().getState();
  return {
    ...s,
    forge: { ...s.forge, pending: null, blockedBy: 'not_enough_shards' },
    boss: { ...s.boss, attemptsLeft: 5, keyEarnedToday: false },
  };
}

describe('nextStep', () => {
  it('asks to mint first when a voucher is pending', async () => {
    const s = await base();
    const pending = { ...s, forge: { ...s.forge, pending: {} as never, blockedBy: null } };
    expect(nextStep(pending, 1e9)).toEqual({ text: 'Mint your Relic in Forge', tab: 'Forge' });
  });

  it('says forge when nothing blocks it', async () => {
    const s = await base();
    expect(nextStep({ ...s, forge: { ...s.forge, blockedBy: null } }, 0)).toEqual({
      text: 'You can forge a Relic now',
      tab: 'Forge',
    });
  });

  it('suggests an upgrade only when an equipped item is affordable', async () => {
    const s = await base();
    expect(s.inventory.some((g) => g.equipped)).toBe(true);
    expect(nextStep(s, 1e9)).toEqual({ text: 'Upgrade your gear in Inventory', tab: 'Inventory' });
    expect(nextStep(s, 0).tab).toBe('Boss');
    const unequipped = { ...s, inventory: s.inventory.map((g) => ({ ...g, equipped: false })) };
    expect(nextStep(unequipped, 1e9).tab).toBe('Boss');
  });

  it('counts the boss fights left', async () => {
    const s = await base();
    expect(nextStep(s, 0)).toEqual({ text: 'Try the boss (5 fights left today)', tab: 'Boss' });
    expect(nextStep({ ...s, boss: { ...s.boss, attemptsLeft: 1 } }, 0).text).toBe('Try the boss (1 fight left today)');
  });

  it('says come back tomorrow once the key is earned or fights run out', async () => {
    const s = await base();
    const done = { text: 'Come back tomorrow for a new Boss Key', tab: null };
    expect(nextStep({ ...s, boss: { ...s.boss, keyEarnedToday: true } }, 0)).toEqual(done);
    expect(nextStep({ ...s, boss: { ...s.boss, attemptsLeft: 0 } }, 0)).toEqual(done);
  });
});
