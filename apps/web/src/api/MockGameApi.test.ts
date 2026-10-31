import { CONFIG, computeClaimGains, computeIdleGains, deriveSeed, gearStat, heroPower, rarityIndex, relicIdFor, starterGear, upgradeCost } from '@taskbar-hero/game-rules';
import { describe, expect, it } from 'vitest';
import { GameApiError } from './GameApi';
import { DEMO_SIGNATURE, MockGameApi } from './MockGameApi';

const DAY_MS = 86_400_000;

it('starts with the starter gear equipped and listed in inventory', async () => {
  const s = await new MockGameApi({ now: () => 0 }).getState();
  expect(s.inventory).toHaveLength(CONFIG.slots.length);
  expect(s.inventory.every((g) => g.equipped)).toBe(true);
  expect(s.gear).toHaveLength(CONFIG.slots.length);
  expect(s.power).toBe(heroPower(s.gear));
  expect(s.boss).toEqual({ level: 1, attemptsToday: 0, attemptsLeft: CONFIG.boss.maxAttemptsPerDay, keyEarnedToday: false });
});

it('equip swaps the item in that slot and raises power', async () => {
  const api = new MockGameApi({ now: () => 0, inventory: [{ slot: 'weapon', rarity: 'epic', level: 1 }] });
  const before = await api.getState();
  const epic = before.inventory.find((g) => !g.equipped)!;
  const after = await api.equip(epic.id);
  const weapons = after.inventory.filter((g) => g.slot === 'weapon');
  expect(weapons.filter((g) => g.equipped).map((g) => g.id)).toEqual([epic.id]);
  expect(after.power).toBeGreaterThan(before.power);
  expect(after.power - before.power).toBeCloseTo(gearStat(epic) - gearStat({ slot: 'weapon', rarity: 'common', level: 1 }));
});

it('equip refuses an item the player does not own', async () => {
  await expect(new MockGameApi().equip('nope')).rejects.toEqual(new GameApiError('not_owner'));
});

it('claim adds drops to inventory, unequipped', async () => {
  let t = 0;
  const api = new MockGameApi({ now: () => t });
  t = 3600_000;
  const r = await api.claim();
  expect(r.drops.length).toBeGreaterThan(0);
  expect(r.drops.every((d) => !d.equipped && r.inventory.some((g) => g.id === d.id))).toBe(true);
});

it('claim pays like the server: online window at full rate, the rest offline', async () => {
  let t = 0;
  const api = new MockGameApi({ now: () => t, seed: 7 });
  t = 3600_000;
  const r = await api.claim();
  const player = { gear: starterGear(), bossLevel: 1 };
  expect(r.gold).toBe(computeClaimGains(player, 3600, deriveSeed(7, 1)).gold);
  expect(r.gold).toBeLessThan(computeIdleGains(player, 3600, deriveSeed(7, 1)).gold);
});

it('fightBoss counts attempts, grants one key per day, and stops at the daily limit', async () => {
  let t = 0;
  // Strong gear so the level 1 boss is beaten.
  const strong = CONFIG.slots.map((slot) => ({ slot, rarity: 'legendary' as const, level: 30 }));
  const api = new MockGameApi({ now: () => t, inventory: strong });
  for (const g of (await api.getState()).inventory.filter((g) => !g.equipped)) await api.equip(g.id);

  const first = await api.fightBoss();
  expect(first.result.won).toBe(true);
  expect(first.keyGranted).toBe(true);
  expect(first.state.bossKeys).toBe(1);
  expect(first.state.bossLevel).toBe(2);
  expect(first.state.boss.keyEarnedToday).toBe(true);

  const second = await api.fightBoss();
  expect(second.keyGranted).toBe(false);
  expect(second.state.bossKeys).toBe(1);

  for (let i = 2; i < CONFIG.boss.maxAttemptsPerDay; i++) await api.fightBoss();
  expect((await api.getState()).boss.attemptsLeft).toBe(0);
  await expect(api.fightBoss()).rejects.toEqual(new GameApiError('no_attempts_left'));

  t += DAY_MS;
  const nextDay = await api.getState();
  expect(nextDay.boss.attemptsLeft).toBe(CONFIG.boss.maxAttemptsPerDay);
  expect(nextDay.boss.keyEarnedToday).toBe(false);
});

describe('forge', () => {
  const rich = { shards: CONFIG.relic.shardCost, bossKeys: CONFIG.relic.bossKeyCost };

  it('reports why forging is blocked', async () => {
    const s = await new MockGameApi({ now: () => 0 }).getState();
    expect(s.forge).toEqual({ blockedBy: 'no_boss_key', forgedToday: false, pending: null, today: null });
    await expect(new MockGameApi({ now: () => 0 }).forgeRelic()).rejects.toEqual(
      new GameApiError('forge_blocked', 'no_boss_key'),
    );
  });

  it('spends the cost once and returns a voucher whose relicId matches its rarity', async () => {
    const api = new MockGameApi({ now: () => 0, start: rich });
    const { voucher, state } = await api.forgeRelic();
    expect(state.shards).toBe(0);
    expect(state.bossKeys).toBe(0);
    expect(voucher.relicId).toBe(String(relicIdFor(voucher.rarityName)));
    expect(voucher.rarity).toBe(rarityIndex(voucher.rarityName));
    expect(voucher.signature).toBe(DEMO_SIGNATURE);
    expect(state.forge).toEqual({
      blockedBy: null,
      forgedToday: true,
      pending: voucher,
      today: { claimId: voucher.claimId, relicId: voucher.relicId, rarityName: voucher.rarityName, minted: false, txHash: null },
    });
    // Asking again returns the same voucher without charging.
    const again = await api.forgeRelic();
    expect(again.voucher).toEqual(voucher);
  });

  it('re-signs an expired voucher with the same relic, never re-rolling', async () => {
    let t = 0;
    const api = new MockGameApi({ now: () => t, start: rich });
    const first = (await api.forgeRelic()).voucher;
    t = (first.expiry + 1) * 1000;
    const second = (await api.forgeRelic()).voucher;
    expect(second.relicId).toBe(first.relicId);
    expect(second.rarity).toBe(first.rarity);
    expect(second.nonce).not.toBe(first.nonce);
    expect(second.expiry).toBeGreaterThan(t / 1000);
  });

  it('reportMint clears the pending voucher and the daily limit applies', async () => {
    const api = new MockGameApi({ now: () => 0, start: { shards: 2 * CONFIG.relic.shardCost, bossKeys: 2 } });
    const { voucher } = await api.forgeRelic();
    await expect(api.reportMint('999', '0x1')).rejects.toEqual(new GameApiError('not_found'));
    const s = await api.reportMint(voucher.nonce, '0x1');
    expect(s.forge).toEqual({
      blockedBy: 'daily_limit',
      forgedToday: true,
      pending: null,
      today: { claimId: voucher.claimId, relicId: voucher.relicId, rarityName: voucher.rarityName, minted: true, txHash: '0x1' },
    });
    await expect(api.forgeRelic()).rejects.toEqual(new GameApiError('forge_blocked', 'daily_limit'));
  });
});

describe('upgrade', () => {
  it('spends upgradeCost gold and raises the level by one', async () => {
    const api = new MockGameApi({ now: () => 0, start: { gold: 1_000_000 } });
    const before = await api.getState();
    const item = before.inventory[0]!;
    const after = await api.upgrade(item.id);
    const up = after.inventory.find((g) => g.id === item.id)!;
    expect(up.level).toBe(item.level + 1);
    expect(after.gold).toBe(before.gold - upgradeCost(item)!);
    expect(after.power).toBeGreaterThan(before.power);
  });

  it('refuses without enough gold, at max level, or for an item not owned', async () => {
    const poor = new MockGameApi({ now: () => 0 });
    const item = (await poor.getState()).inventory[0]!;
    await expect(poor.upgrade(item.id)).rejects.toEqual(new GameApiError('not_enough_gold'));
    await expect(poor.upgrade('nope')).rejects.toEqual(new GameApiError('not_owner'));
    const maxed = new MockGameApi({ now: () => 0, start: { gold: 1e12 }, inventory: [{ slot: 'ring', rarity: 'common', level: CONFIG.gear.maxLevel }] });
    const top = (await maxed.getState()).inventory.find((g) => g.level === CONFIG.gear.maxLevel)!;
    await expect(maxed.upgrade(top.id)).rejects.toEqual(new GameApiError('max_level'));
  });
});
