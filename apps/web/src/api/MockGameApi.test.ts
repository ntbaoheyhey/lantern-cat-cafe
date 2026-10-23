import { CONFIG, gearStat, heroPower } from '@taskbar-hero/game-rules';
import { expect, it } from 'vitest';
import { GameApiError } from './GameApi';
import { MockGameApi } from './MockGameApi';

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
