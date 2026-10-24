// Reuse game-rules' Vitest dependency, just as this package's test script does.
import { describe, expect, it } from '../../game-rules/node_modules/vitest';
import { CONFIG, goldPerSecond, heroPower } from '@taskbar-hero/game-rules';
import {
  buildServerState,
  ENDPOINTS,
  ERROR_CODES,
  HTTP_STATUS,
  type RelicVoucher,
  type StoredState,
} from './index';

describe('API contract constants', () => {
  it('exports unique error codes with exactly one status for every code', () => {
    expect(ERROR_CODES).toEqual([
      'unauthenticated', 'not_owner', 'not_found', 'rate_limited', 'no_attempts_left',
      'forge_blocked', 'mint_not_confirmed', 'not_enough_gold', 'max_level', 'server_error',
    ]);
    expect(new Set(ERROR_CODES).size).toBe(ERROR_CODES.length);
    expect(Object.keys(HTTP_STATUS).sort()).toEqual([...ERROR_CODES].sort());
    expect(HTTP_STATUS).toEqual({
      unauthenticated: 401,
      not_owner: 403,
      not_found: 404,
      rate_limited: 429,
      no_attempts_left: 409,
      forge_blocked: 409,
      mint_not_confirmed: 409,
      not_enough_gold: 409,
      max_level: 409,
      server_error: 500,
    });
  });

  it('exports unique Edge Function names without URL prefixes', () => {
    expect(ENDPOINTS).toEqual([
      'game-state', 'idle-claim', 'equip', 'boss-fight', 'upgrade', 'relic-forge',
      'relic-mint-report',
    ]);
    expect(new Set(ENDPOINTS).size).toBe(ENDPOINTS.length);
    for (const endpoint of ENDPOINTS) expect(endpoint).toMatch(/^[a-z]+(?:-[a-z]+)*$/);
  });
});

const nowMs = Date.UTC(2026, 9, 24, 12, 0, 0, 500);

function storedState(overrides: Partial<StoredState> = {}): StoredState {
  return {
    gold: 123,
    shards: CONFIG.relic.shardCost,
    bossKeys: CONFIG.relic.bossKeyCost,
    bossLevel: 4,
    inventory: [
      { id: 'equipped', slot: 'weapon', rarity: 'rare', level: 3, equipped: true },
      { id: 'unequipped', slot: 'armor', rarity: 'legendary', level: 20, equipped: false },
    ],
    attemptsToday: 0,
    keyEarnedToday: false,
    forgedToday: false,
    pending: null,
    today: null,
    ...overrides,
  };
}

function voucher(): RelicVoucher {
  return {
    player: '0x0000000000000000000000000000000000000001',
    relicId: '2',
    rarity: 1,
    rarityName: 'rare',
    nonce: '123',
    expiry: nowMs / 1000 + 1800,
    signature: '0x1234',
  };
}

describe('buildServerState', () => {
  it('projects stored fields, equipped gear, derived income and server seconds', () => {
    const stored = storedState({ keyEarnedToday: true });
    const gear = [{ slot: 'weapon', rarity: 'rare', level: 3 }] as const;
    const power = heroPower([...gear]);
    expect(buildServerState(stored, nowMs)).toEqual({
      gold: 123,
      shards: CONFIG.relic.shardCost,
      bossKeys: CONFIG.relic.bossKeyCost,
      bossLevel: 4,
      inventory: stored.inventory,
      gear,
      boss: {
        level: 4,
        attemptsToday: 0,
        attemptsLeft: CONFIG.boss.maxAttemptsPerDay,
        keyEarnedToday: true,
      },
      forge: { blockedBy: null, forgedToday: false, pending: null, today: null },
      power,
      goldPerSecond: goldPerSecond(power),
      serverTime: nowMs / 1000,
    });
  });

  it.each([
    [0, CONFIG.boss.maxAttemptsPerDay],
    [1, CONFIG.boss.maxAttemptsPerDay - 1],
    [CONFIG.boss.maxAttemptsPerDay - 1, 1],
    [CONFIG.boss.maxAttemptsPerDay, 0],
    [CONFIG.boss.maxAttemptsPerDay + 1, 0],
    [100, 0],
  ])('clamps attempts left for %i attempts to %i', (attemptsToday, attemptsLeft) => {
    const state = buildServerState(storedState({ attemptsToday }), nowMs);
    expect(state.boss.attemptsToday).toBe(attemptsToday);
    expect(state.boss.attemptsLeft).toBe(attemptsLeft);
  });

  it.each([
    { forgedToday: true, bossKeys: 0, shards: 0, blockedBy: 'daily_limit' },
    { forgedToday: false, bossKeys: 0, shards: 0, blockedBy: 'no_boss_key' },
    {
      forgedToday: false, bossKeys: CONFIG.relic.bossKeyCost,
      shards: CONFIG.relic.shardCost - 1, blockedBy: 'not_enough_shards',
    },
    {
      forgedToday: false, bossKeys: CONFIG.relic.bossKeyCost,
      shards: CONFIG.relic.shardCost, blockedBy: null,
    },
  ])('prioritizes forge block $blockedBy', ({ blockedBy, ...overrides }) => {
    expect(buildServerState(storedState(overrides), nowMs).forge.blockedBy).toBe(blockedBy);
  });

  it('allows a paid pending voucher despite all new-forge blockers', () => {
    const pending = voucher();
    const state = buildServerState(storedState({
      forgedToday: true, bossKeys: 0, shards: 0, pending,
    }), nowMs);
    expect(state.forge).toEqual({ blockedBy: null, forgedToday: true, pending, today: null });
  });

  it('handles an empty inventory with base power and income', () => {
    const state = buildServerState(storedState({ inventory: [] }), nowMs);
    expect(state.inventory).toEqual([]);
    expect(state.gear).toEqual([]);
    expect(state.power).toBe(CONFIG.hero.basePower);
    expect(state.goldPerSecond).toBe(goldPerSecond(CONFIG.hero.basePower));
  });

  it('does not mutate or alias input items, vouchers or today relics', () => {
    const stored = storedState({
      pending: voucher(),
      today: { relicId: '2', rarityName: 'rare', minted: false, txHash: null },
    });
    const before: StoredState = JSON.parse(JSON.stringify(stored));
    const state = buildServerState(stored, nowMs);
    expect(stored).toEqual(before);
    expect(state.inventory === stored.inventory).toBe(false);
    for (let i = 0; i < state.inventory.length; i++) {
      expect(state.inventory[i] === stored.inventory[i]).toBe(false);
    }
    expect(state.gear[0] === state.inventory[0]).toBe(false);
    expect(state.gear[0] === stored.inventory[0]).toBe(false);
    expect(state.forge.pending === stored.pending).toBe(false);
    expect(state.forge.today === stored.today).toBe(false);

    state.inventory[0]!.level = 99;
    state.inventory[1]!.equipped = true;
    state.inventory.pop();
    state.gear[0]!.level = 42;
    state.forge.pending!.nonce = '456';
    state.forge.today!.minted = true;
    expect(stored).toEqual(before);
    expect(buildServerState(stored, nowMs).inventory).toEqual(before.inventory);

    const fresh = buildServerState(stored, nowMs);
    stored.inventory[0]!.level = 10;
    stored.pending!.signature = '0xabcd';
    stored.today!.txHash = '0x1234';
    expect(fresh.inventory).toEqual(before.inventory);
    expect(fresh.gear[0]!.level).toBe(3);
    expect(fresh.forge.pending).toEqual(before.pending);
    expect(fresh.forge.today).toEqual(before.today);
  });
});
